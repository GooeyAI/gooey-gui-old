import type { ReactNode } from "react";
import React, { useEffect, useRef, useState } from "react";
import { JsonViewer } from "@textea/json-viewer";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import { marked } from "marked";
import Select from "react-select";
import { Link } from "@remix-run/react";

type TreeNode = {
  name: string;
  props: Record<string, any>;
  children: Array<TreeNode>;
  style: Record<string, string>;
};

export function getTransforms({
  children,
}: {
  children: Array<TreeNode>;
}): Record<string, string> {
  let ret: Record<string, string> = {};
  for (const node of children) {
    const { name, props, children } = node;
    switch (name) {
      case "input":
        ret[props.name] = props.type;
        break;
      default:
        ret[props.name] = name;
        break;
    }
    if (!children) continue;
    ret = { ...ret, ...getTransforms({ children }) };
  }
  return ret;
}

export function RenderedChildren({ children }: { children: Array<TreeNode> }) {
  let elements = children.map((node, idx) => {
    return <RenderedTreeNode key={node.props.name || idx} node={node} />;
  });
  return <>{elements}</>;
}

function RenderedTreeNode({ node }: { node: TreeNode }): any {
  const { name, props, children, style } = node;
  switch (name) {
    case "":
      return <RenderedChildren children={children} />;
    case "nav-tab-content":
      return (
        <div className="tab-content">
          <div className="tab-pane show active" role="tabpanel">
            <RenderedChildren children={children} />
          </div>
        </div>
      );

    case "nav-tabs":
      return (
        <ul className="nav nav-tabs" role="tablist" style={style} {...props}>
          <RenderedChildren children={children} />
        </ul>
      );
    case "nav-item":
      return (
        <Link to={props.href} {...props.attrs}>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${props.active ? "active" : ""}`}
              type="button"
              role="tab"
              aria-controls="run"
              aria-selected="true"
            >
              <p className="mb-0">
                <RenderedChildren children={children} />
              </p>
            </button>
          </li>
        </Link>
      );
    case "pre":
      return <pre style={style}>{props.body}</pre>;
    case "ul":
      return (
        <ul style={style} {...props}>
          <RenderedChildren children={children} />
        </ul>
      );
    case "div":
      return (
        <div style={style} {...props}>
          <RenderedChildren children={children} />
        </div>
      );
    case "tabs":
      let tabs = children.map((elem) => (
        <Tab key={elem.props.label}>
          <RenderedMarkdown body={elem.props.label} />
        </Tab>
      ));
      let panels = children.map((elem) => (
        <TabPanel key={elem.props.label} style={elem.style}>
          <RenderedChildren children={elem.children} />
        </TabPanel>
      ));
      return (
        <Tabs style={style}>
          <TabList>{tabs}</TabList>
          {panels}
        </Tabs>
      );
    case "details":
      return (
        <Details
          open={props.open}
          summary={<RenderedMarkdown body={props.label} />}
        >
          <RenderedChildren children={children} />
        </Details>
      );
    case "img":
      return (
        <>
          <RenderedMarkdown body={props.caption} />
          <img
            style={style}
            src={props.src}
            alt={props.caption}
            onClick={() => {
              if (props.src.startsWith("data:")) return;
              window.open(props.src);
            }}
          />
        </>
      );
    case "video":
      return (
        <>
          <RenderedMarkdown body={props.caption} />
          <video style={style} controls src={props.src}></video>
        </>
      );
    case "audio":
      return (
        <>
          <RenderedMarkdown body={props.caption} />
          <audio style={style} controls src={props.src}></audio>
        </>
      );
    case "html":
      return (
        <article
          className="htmlContainer"
          style={style}
          dangerouslySetInnerHTML={{
            __html: props.body,
          }}
        ></article>
      );
    case "markdown":
      return (
        <RenderedMarkdown
          body={props.body}
          // allowUnsafeHTML={props.unsafe_allow_html || false}
        />
      );
    case "textarea":
      return (
        <div>
          <RenderedMarkdown body={props.label} />
          <div>
            <textarea style={style} {...props} />
          </div>
        </div>
      );
    case "input":
      return (
        <div>
          <label>
            <RenderedMarkdown body={props.label} />
          </label>
          <input {...props} />
        </div>
      );
    case "button":
      return (
        <button {...props}>
          <RenderedMarkdown body={props.label} />
        </button>
      );
    case "select":
      return (
        <>
          <label>
            <RenderedMarkdown body={props.label} />
          </label>
          <select style={style} {...props}>
            <RenderedChildren children={children} />
          </select>
        </>
      );
    case "multiselect":
      return (
        <>
          <label>
            <RenderedMarkdown body={props.label} />
          </label>
          <Select
            defaultValue={props.defaultValue}
            isMulti
            isDisabled={props.disabled}
            name={props.name}
            options={props.options}
            className="basic-multi-select"
            classNamePrefix="select"
          />
        </>
      );
    case "option":
      return (
        <option style={style} {...props}>
          <RenderedMarkdown body={props.label} />
        </option>
      );
    case "json":
      return (
        <JsonViewer
          style={{
            overflow: "scroll",
            marginTop: "1rem",
          }}
          value={props.value}
          defaultInspectDepth={props.defaultInspectDepth}
          rootName={false}
        ></JsonViewer>
      );
    case "table":
      return <table>{<RenderedChildren children={children} />}</table>;
    case "thead":
      return <thead>{<RenderedChildren children={children} />}</thead>;
    case "tbody":
      return <tbody>{<RenderedChildren children={children} />}</tbody>;
    case "tr":
      return <tr>{<RenderedChildren children={children} />}</tr>;
    case "th":
      return <th>{<RenderedChildren children={children} />}</th>;
    case "td":
      return <td>{<RenderedChildren children={children} />}</td>;
    default:
      return (
        <div>
          <pre>
            <code>{JSON.stringify(node)}</code>
          </pre>
        </div>
      );
  }
}

function Details({
  open,
  summary,
  children,
}: {
  open?: boolean;
  summary: JSX.Element;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(open);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.checked != isOpen) {
      setIsOpen(ref.current.checked);
    }
  }, [isOpen]);

  return (
    <div style={{ border: "1px solid gray" }}>
      <input hidden={true} type="checkbox" ref={ref} name={"magic"} />
      <div
        onClick={() => {
          ref.current!.checked = !isOpen;
          setIsOpen(!isOpen);
        }}
        style={{
          userSelect: "none",
          backgroundColor: "lightgrey",
        }}
      >
        {isOpen ? "▼" : "▶"}
        {summary}
      </div>
      <div
        style={{
          display: isOpen ? "block" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function RenderedMarkdown({
  body,
  // allowUnsafeHTML,
  style,
}: {
  body: string;
  // allowUnsafeHTML?: boolean;
  style?: Record<string, string>;
}) {
  if (!body) return <></>;
  let html = marked.parse(body, {
    gfm: true,
    headerIds: false,
    mangle: false,
  });
  // if (!allowUnsafeHTML) {
  //   html = sanitizeHtml(html);
  // }
  return (
    <article dangerouslySetInnerHTML={{ __html: html }} style={style}></article>
  );
}
