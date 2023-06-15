import React, { forwardRef, useEffect, useRef } from "react";
import parse, {
  attributesToProps,
  domToReact,
  Element,
  HTMLReactParserOptions,
  Text,
} from "html-react-parser";
import { useHydratedMemo } from "~/useHydrated";
import { Link } from "@remix-run/react";

export const RenderedHTML = forwardRef<
  HTMLSpanElement,
  {
    body: string;
    [attr: string]: any;
  }
>(function RenderedHTML({ body, ...attrs }, ref) {
  const reactParserOptions: HTMLReactParserOptions = {
    htmlparser2: {
      lowerCaseTags: false,
      lowerCaseAttributeNames: false,
    },
    replace: function (domNode) {
      if (!(domNode instanceof Element && domNode.attribs)) return;

      if (
        domNode.children.length &&
        domNode.children[0] instanceof Element &&
        domNode.children[0].name === "code" &&
        domNode.children[0].attribs.class?.includes("language-")
      ) {
        return (
          <RenderedPrismCode domNode={domNode} options={reactParserOptions} />
        );
      }

      if (typeof domNode.attribs["data-internal-link"] !== "undefined") {
        const href = domNode.attribs.href;
        delete domNode.attribs.href;
        return (
          <Link to={href} {...attributesToProps(domNode.attribs)}>
            {domToReact(domNode.children, reactParserOptions)}
          </Link>
        );
      }

      for (const [attr, value] of Object.entries(domNode.attribs)) {
        if (!attr.startsWith("on")) continue;
        // @ts-ignore
        domNode.attribs[attr] = (event: React.SyntheticEvent) => {
          // eslint-disable-next-line no-new-func
          const fn = new Function("event", value);
          return fn.call(event.currentTarget, event.nativeEvent);
        };
      }

      if (domNode.type === "script") {
        let body = getTextBody(domNode);
        return <InlineScript attrs={domNode.attribs} body={body} />;
      }
    },
  };
  const parsedElements = parse(body, reactParserOptions);
  return (
    <span ref={ref} className="gui-html-container" {...attrs}>
      {parsedElements}
    </span>
  );
});

function InlineScript({
  attrs,
  body,
}: {
  attrs?: Record<string, string>;
  body: string;
}) {
  const hydrated = useHydratedMemo();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // create script tag
    const script = document.createElement("script");
    // add attribs
    for (const [attr, value] of Object.entries(attrs ?? {})) {
      script.setAttribute(attr, value);
    }
    // add inline script
    if (body) {
      script.appendChild(document.createTextNode(body));
    }
    ref.current.replaceChildren(script);
  }, []);

  if (hydrated) {
    return <div ref={ref} style={{ display: "none" }}></div>;
  } else {
    return (
      <script
        {...attributesToProps(attrs ?? {}, "script")}
        dangerouslySetInnerHTML={{ __html: body }}
      />
    );
  }
}
function RenderedPrismCode({
  domNode,
  options,
}: {
  domNode: Element;
  options: HTMLReactParserOptions;
}) {
  const ref = useRef<HTMLElement>(null);
  const body = getTextBody(domNode);
  useEffect(() => {
    // @ts-ignore
    if (!ref.current || !window.Prism) return;
    // @ts-ignore
    window.Prism.highlightElement(ref.current);
  }, [body]);
  // @ts-ignore
  domNode.children[0].attribs.ref = ref;
  return (
    <span className="gui-html-container">
      <pre {...attributesToProps(domNode.attribs)}>
        {domToReact(domNode.children, options)}
      </pre>
    </span>
  );
}

function getTextBody(domNode: Element) {
  let body = "";
  const child = domNode.children[0];
  if (child instanceof Text) {
    body = child.data;
  }
  return body;
}
