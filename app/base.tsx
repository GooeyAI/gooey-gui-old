import type { LinksFunction } from "@remix-run/node";
import type { ReactNode } from "react";

import React, { useEffect, useRef, useState } from "react";
import { JsonViewer } from "@textea/json-viewer";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import Select from "react-select";
import { Link } from "@remix-run/react";
import { GooeyFileInput, links as fileInputLinks } from "~/gooeyFileInput";
import { RenderedMarkdown } from "~/renderedMarkdown";
import { ClientOnly } from "remix-utils";

import reactTabsStyle from "react-tabs/style/react-tabs.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: reactTabsStyle }, ...fileInputLinks()];
};

type TreeNode = {
  name: string;
  props: Record<string, any>;
  children: Array<TreeNode>;
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

export const applyTransform: Record<string, (val: FormDataEntryValue) => any> =
  {
    checkbox: Boolean,
    number: parseIntFloat,
    range: parseIntFloat,
    select: (val) => (val ? JSON.parse(`${val}`) : null),
    file: (val) => (val ? JSON.parse(`${val}`) : null),
  };

function parseIntFloat(val: FormDataEntryValue): number {
  let strVal = val.toString();
  const intVal = parseInt(strVal);
  const floatVal = parseFloat(strVal);
  if (floatVal == intVal) {
    return intVal;
  } else if (isNaN(floatVal)) {
    return 0;
  } else {
    return floatVal;
  }
}

function RenderedTreeNode({
  node,
  onChange,
}: {
  node: TreeNode;
  onChange: () => void;
}) {
  const { name, props, children } = node;
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
        <ul className="nav nav-tabs" role="tablist" {...props}>
          <RenderedChildren children={children} onChange={onChange} />
        </ul>
      );
    case "nav-item":
      return (
        <Link to={props.to} {...props}>
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
      return <pre {...props}>{props.body}</pre>;
    case "ul":
      return (
        <ul {...props}>
          <RenderedChildren children={children} onChange={onChange} />
        </ul>
      );
    case "div":
      return (
        <div {...props}>
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
        <TabPanel key={elem.props.label} {...elem.props}>
          <RenderedChildren children={elem.children} onChange={onChange} />
        </TabPanel>
      ));
      return (
        <Tabs {...props}>
          <TabList>{tabs}</TabList>
          {panels}
        </Tabs>
      );
    case "details":
      return (
        <Details
          open={props.open}
          summary={<RenderedMarkdown body={props.label} {...props} />}
        >
          <RenderedChildren children={children} onChange={onChange} />
        </Details>
      );
    case "img":
      return (
        <>
          <RenderedMarkdown body={props.caption} />
          <img
            className="gui-img"
            alt={props.caption}
            {...props}
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
          <video className="gui-video" controls {...props}></video>
        </>
      );
    case "audio":
      return (
        <>
          <RenderedMarkdown body={props.caption} />
          <audio className="gui-audio" controls {...props}></audio>
        </>
      );
    case "html":
      return (
        <span
          className="htmlContainer"
          dangerouslySetInnerHTML={{
            __html: props.body,
          }}
          {...props}
        ></span>
      );
    case "markdown":
      return <RenderedMarkdown body={props.body} {...props} />;
    case "textarea":
      return (
        <div className="gooeyInputOrTextArea">
          <RenderedMarkdown body={props.label} />
          <div>
            <textarea {...props} />
          </div>
        </div>
      );
    case "input":
      if (props.type === "file") {
        return (
          <ClientOnly>
            {() => (
              <GooeyFileInput
                name={props.name}
                multiple={props.multiple}
                label={props.label}
                accept={props.accept}
                onChange={onChange}
                defaultValue={props.defaultValue}
                {...props}
              />
            )}
          </ClientOnly>
        );
      }
      return (
        <div className="gooeyInputOrTextArea">
          <label>
            <RenderedMarkdown body={props.label} />
          </label>
          <input {...props} />
        </div>
      );
    case "gui-button":
      return (
        <button type="button" className={"btn btn-theme"} {...props}>
          <RenderedMarkdown body={props.label} />
        </button>
      );
    case "select":
      return <GuiSelect props={props} onChange={onChange} />;
    case "option":
      return (
        <option {...props}>
          <RenderedMarkdown body={props.label} />
        </option>
      );
    case "json":
      return (
        <ClientOnly>
          {() => (
            <JsonViewer
              style={{
                overflow: "scroll",
                marginTop: "1rem",
              }}
              value={props.value}
              defaultInspectDepth={props.defaultInspectDepth}
              rootName={false}
            ></JsonViewer>
          )}
        </ClientOnly>
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
      const CustomTag = name;
      return (
        // @ts-ignore
        <CustomTag {...props}>
          <RenderedChildren children={children} onChange={onChange} />
        </CustomTag>
      );
    // return (
    //   <div>
    //     <pre>
    //       <code>{JSON.stringify(node)}</code>
    //     </pre>
    //   </div>
    // );
  }
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

function GuiSelect({
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
      <ClientOnly>
        {() => (
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
                el.value = JSON.stringify(
                  newValue.map((opt: any) => opt.value)
                );
              } else {
                el.value = JSON.stringify(newValue.value);
              }
              onChange();
            }}
          />
        )}
      </ClientOnly>
    </div>
  );
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
    <div className="gooeyDetails">
      <input hidden={true} type="checkbox" ref={ref} name={"magic"} />
      <div
        className="gooeyDetailsHeader"
        onClick={() => {
          ref.current!.checked = !isOpen;
          setIsOpen(!isOpen);
        }}
        style={{
          userSelect: "none",
          backgroundColor: isOpen ? "#f2f2f2" : "initial",
        }}
      >
        <div style={{ float: "right" }}>{isOpen ? "⌄" : "⌃"}</div>
        {summary}
      </div>
      <div
        className="gooeyDetailsBody"
        style={{
          display: isOpen ? "block" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
