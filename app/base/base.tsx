import styles from "../routes/styles.module.css";
import React from "react";
import { JsonViewer } from "@textea/json-viewer";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import { marked } from "marked";
import { json } from "@remix-run/node";

// export const meta: V2_MetaFunction = () => {
//   return [{ title: "New Remix App" }];
// };

// export const links: LinksFunction = () => {
//   return [
//     {
//       rel: "stylesheet",
//       href: "https://unpkg.com/modern-css-reset@1.4.0/dist/reset.min.css",
//     },
//   ];
// };

export async function runLoader({ url }: { url: string }) {
  let response = await fetch(url);
  // if (!response.ok) {
  //   throw json(await response.text(), { status: response.status });
  //   // return new Response("Failed to load: " + (await response.text()));
  // }
  return await response.json();
}

type TreeNode = {
  name: string;
  props: Record<string, any>;
  children: any[];
  style: Record<string, string>;
};

export function renderChildren(tree: Array<TreeNode>) {
  return <>{...tree.map(RenderTreeNode)}</>;
}

function RenderTreeNode(elem: TreeNode): any {
  switch (elem.name) {
    case "":
      return renderChildren(elem.children);
    case "pre":
      return <pre style={elem.style}>{elem.props.body}</pre>;
    case "div":
      return <div style={elem.style}>{renderChildren(elem.children)}</div>;
    case "tabs":
      return (
        <Tabs style={elem.style}>
          <TabList>
            {...elem.children.map((elem) => (
              <Tab>
                <RenderedMarkdown body={elem.props.label} />
              </Tab>
            ))}
          </TabList>
          {renderChildren(elem.children)}
        </Tabs>
      );
    case "tab":
      return (
        <TabPanel style={elem.style}>{renderChildren(elem.children)}</TabPanel>
      );
    case "details":
      return (
        <details open={elem.props.open}>
          <summary>
            <RenderedMarkdown body={elem.props.label} />
          </summary>
          {renderChildren(elem.children)}
        </details>
      );
    case "columns":
      return (
        <div style={elem.style} className={styles.columns}>
          {renderChildren(elem.children)}
        </div>
      );
    case "img":
      return (
        <>
          <RenderedMarkdown body={elem.props.caption} />
          <img
            className={styles.img}
            style={elem.style}
            src={elem.props.src}
            alt={elem.props.caption}
            onClick={() => {
              if (elem.props.src.startsWith("data:")) return;
              window.open(elem.props.src);
            }}
          />
        </>
      );
    case "video":
      return (
        <>
          <RenderedMarkdown body={elem.props.caption} />
          <video
            style={elem.style}
            className={styles.video}
            controls
            src={elem.props.src}
          ></video>
        </>
      );
    case "audio":
      return (
        <>
          <RenderedMarkdown body={elem.props.caption} />
          <audio
            style={elem.style}
            className={styles.audio}
            controls
            src={elem.props.src}
          ></audio>
        </>
      );
    case "html":
      return (
        <div
          style={elem.style}
          dangerouslySetInnerHTML={{
            __html: elem.props.body,
          }}
        ></div>
      );
    case "markdown":
      return (
        <RenderedMarkdown
          body={elem.props.body}
          allowUnsafeHTML={elem.props.unsafe_allow_html || false}
        />
      );
    case "textarea":
      return (
        <div>
          <RenderedMarkdown body={elem.props.label} />
          <div>
            <textarea
              className={styles.textArea}
              style={elem.style}
              defaultValue={elem.props.value}
              disabled={elem.props.disabled}
            />
          </div>
        </div>
      );
    case "input":
      return (
        <div>
          <label>
            <RenderedMarkdown body={elem.props.label} />
          </label>
          <input {...elem.props} />
        </div>
      );
    case "button":
      return (
        <button disabled={elem.props.disabled} type={elem.props.type}>
          <RenderedMarkdown body={elem.props.label} />
        </button>
      );
    case "select":
      return (
        <>
          <label>
            <RenderedMarkdown body={elem.props.label} />
          </label>
          <select style={elem.style}>{renderChildren(elem.children)}</select>
        </>
      );
    case "option":
      return (
        <option
          style={elem.style}
          defaultValue={elem.props.value}
          selected={elem.props.selected}
        >
          <RenderedMarkdown body={elem.props.label} />
        </option>
      );
    case "json":
      return (
        <JsonViewer
          style={{
            overflow: "scroll",
            marginTop: "1rem",
          }}
          value={elem.props.value}
          collapseStringsAfterLength={elem.props.collapseStringsAfterLength}
        ></JsonViewer>
      );
    case "table":
      return <table>{renderChildren(elem.children)}</table>;
    case "thead":
      return <thead>{renderChildren(elem.children)}</thead>;
    case "tbody":
      return <tbody>{renderChildren(elem.children)}</tbody>;
    case "tr":
      return <tr>{renderChildren(elem.children)}</tr>;
    case "th":
      return <th>{renderChildren(elem.children)}</th>;
    case "td":
      return <td>{renderChildren(elem.children)}</td>;
    default:
      return (
        <div className={styles.md}>
          <pre>
            <code>{JSON.stringify(elem)}</code>
          </pre>
        </div>
      );
  }
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
