import styles from "~/styles/styles.module.css";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { JsonViewer } from "@textea/json-viewer";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import { marked } from "marked";
import Select from "react-select";

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
  let elements = children.map((node, idx) => (
    <RenderedTreeNode key={idx} node={node} />
  ));
  return <>{elements}</>;
}

function RenderedTreeNode({ node }: { node: TreeNode }): any {
  let { name, props, children, style } = node;
  switch (name) {
    case "":
      return <RenderedChildren children={children} />;
    case "pre":
      return <pre style={style}>{props.body}</pre>;
    case "div":
      return (
        <div style={style}>
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
    case "columns":
      return (
        <div style={style} className={styles.columns}>
          <RenderedChildren children={children} />
        </div>
      );
    case "img":
      return (
        <>
          <RenderedMarkdown body={props.caption} />
          <img
            className={styles.img}
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
          <video
            style={style}
            className={styles.video}
            controls
            src={props.src}
          ></video>
        </>
      );
    case "audio":
      return (
        <>
          <RenderedMarkdown body={props.caption} />
          <audio
            style={style}
            className={styles.audio}
            controls
            src={props.src}
          ></audio>
        </>
      );
    case "html":
      return (
        <div
          style={style}
          dangerouslySetInnerHTML={{
            __html: props.body,
          }}
        ></div>
      );
    case "markdown":
      return (
        <RenderedMarkdown
          body={props.body}
          allowUnsafeHTML={props.unsafe_allow_html || false}
        />
      );
    case "textarea":
      return (
        <div>
          <RenderedMarkdown body={props.label} />
          <div>
            <textarea className={styles.textArea} style={style} {...props} />
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
        <button disabled={props.disabled} type={props.type}>
          <RenderedMarkdown body={props.label} />
        </button>
      );
    case "select":
      return (
        <>
          <label>
            <RenderedMarkdown body={props.label} />
          </label>
          <select style={style}>
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
        <option
          style={style}
          defaultValue={props.value}
          selected={props.selected}
        >
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
        <div className={styles.md}>
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
  allowUnsafeHTML,
  style,
}: {
  body: string;
  allowUnsafeHTML?: boolean;
  style?: Record<string, string>;
}) {
  if (!body) return <></>;
  let html = marked.parse(body, {
    gfm: true,
    headerIds: undefined,
    langPrefix: undefined,
    highlight: undefined,
    mangle: undefined,
  });
  // if (!allowUnsafeHTML) {
  //   html = sanitizeHtml(html);
  // }
  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      className={styles.md}
      style={style}
    ></div>
  );
}
