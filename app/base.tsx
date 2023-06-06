import type { ReactNode } from "react";
import React, { useEffect, useRef, useState } from "react";
import { JsonViewer } from "@textea/json-viewer";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import { marked } from "marked";
import Select from "react-select";
import { Link } from "@remix-run/react";
import { ClientJsFix } from "~/clientJsFix";

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

export function RenderedChildren({
  children,
  onChange,
}: {
  children: Array<TreeNode>;
  onChange: () => void;
}) {
  let elements = children.map((node, idx) => {
    let key;
    if (node.props.name) {
      key = `input:${node.props.name}:${node.props.value}`;
    } else {
      key = `idx:${idx}`;
    }
    return <RenderedTreeNode key={key} node={node} onChange={onChange} />;
  });
  return <>{elements}</>;
}

function SelectElement({
  props,
  onChange,
}: {
  props: Record<string, any>;
  onChange: () => void;
}) {
  let inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={"gooeySelect"}>
      <label htmlFor={props.name}>
        <RenderedMarkdown body={props.label} />
      </label>
      <input
        ref={inputRef}
        type="hidden"
        name={props.name}
        value={
          props.defaultValue
            ? props.isMulti
              ? JSON.stringify(props.defaultValue.map((opt: any) => opt.value))
              : JSON.stringify(props.defaultValue.value)
            : undefined
        }
      />
      <ClientJsFix>
        <Select
          {...props}
          name={undefined}
          // delimiter=","
          isMulti={props.isMulti}
          onChange={(newValue: any) => {
            const el = inputRef.current;
            if (!el) return;
            if (newValue === undefined) {
              el.value = "";
            } else if (!newValue) {
              el.value = JSON.stringify(newValue);
            } else if (props.isMulti) {
              el.value = JSON.stringify(newValue.map((opt: any) => opt.value));
            } else {
              el.value = JSON.stringify(newValue.value);
            }
            onChange();
          }}
        />
      </ClientJsFix>
    </div>
  );
}

function RenderedTreeNode({
  node,
  onChange,
}: {
  node: TreeNode;
  onChange: () => void;
}) {
  const { name, props, children, style } = node;
  switch (name) {
    case "":
      return <RenderedChildren children={children} onChange={onChange} />;
    case "nav-tab-content":
      return (
        <div className="tab-content">
          <div className="tab-pane show active" role="tabpanel">
            <RenderedChildren children={children} onChange={onChange} />
          </div>
        </div>
      );

    case "nav-tabs":
      return (
        <ul className="nav nav-tabs" role="tablist" style={style} {...props}>
          <RenderedChildren children={children} onChange={onChange} />
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
                <RenderedChildren children={children} onChange={onChange} />
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
          <RenderedChildren children={children} onChange={onChange} />
        </ul>
      );
    case "div":
      return (
        <div style={style} {...props}>
          <RenderedChildren children={children} onChange={onChange} />
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
          <RenderedChildren children={elem.children} onChange={onChange} />
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
              <RenderedChildren children={children} onChange={onChange} />
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
        <span
          className="htmlContainer"
          style={style}
          dangerouslySetInnerHTML={{
            __html: props.body,
          }}
        ></span>
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
        <div className="gooeyInputOrTextArea">
          <RenderedMarkdown body={props.label} />
          <div>
            <textarea style={style} {...props} />
          </div>
        </div>
      );
    case "input":
      return (
        <div className="gooeyInputOrTextArea">
          <label>
            <RenderedMarkdown body={props.label} />
          </label>
          <input {...props} />
        </div>
      );
    case "button":
          return (
            <button type="button" className={"btn btn-theme"}  {...props}>
              <RenderedMarkdown body={props.label} />
            </button>
          );
    case "select":
      return <SelectElement props={props} onChange={onChange} />;
    case "option":
      return (
        <option style={style} {...props}>
          <RenderedMarkdown body={props.label} />
        </option>
      );
    case "json":
      return (
        <ClientJsFix>
          <JsonViewer
            style={{
              overflow: "scroll",
              marginTop: "1rem",
            }}
            value={props.value}
            defaultInspectDepth={props.defaultInspectDepth}
            rootName={false}
          ></JsonViewer>
        </ClientJsFix>
      );
    case "table":
      return (
        <table>
          {<RenderedChildren children={children} onChange={onChange} />}
        </table>
      );
    case "thead":
      return (
        <thead>
          {<RenderedChildren children={children} onChange={onChange} />}
        </thead>
      );
    case "tbody":
      return (
        <tbody>
          {<RenderedChildren children={children} onChange={onChange} />}
        </tbody>
      );
    case "tr":
      return (
        <tr>{<RenderedChildren children={children} onChange={onChange} />}</tr>
      );
    case "th":
      return (
        <th>{<RenderedChildren children={children} onChange={onChange} />}</th>
      );
    case "td":
      return (
        <td>{<RenderedChildren children={children} onChange={onChange} />}</td>
      );
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

export function Details({
  open,
  summary,
  children,
}: {
  open?: boolean;
  summary: React.JSX.Element;
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
    <div className="gooeyDetails" >
      <input hidden={true} type="checkbox" ref={ref} name={"magic"} />
      <div className="gooeyDetailsHeader"
        onClick={() => {
          ref.current!.checked = !isOpen;
          setIsOpen(!isOpen);
        }}
        style={{
          userSelect: "none",
          backgroundColor: isOpen ? "#f2f2f2" :"initial",
        }}
      >
          <div style={{float: "right"}}>
                {isOpen ? "⌄" : "⌃"}
          </div>
        {summary}
      </div>
      <div className="gooeyDetailsBody"
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
    <span
      className="htmlContainer"
      dangerouslySetInnerHTML={{ __html: html }}
      style={style}
    ></span>
  );
}
