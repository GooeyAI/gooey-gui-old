import React, { useEffect, useRef } from "react";
import { marked } from "marked";
import { RenderedHTML } from "~/renderedHTML";

export function RenderedMarkdown({
  body,
  ...attrs
}: // allowUnsafeHTML,
{
  body: string;
  [attr: string]: any;
  // allowUnsafeHTML?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    // @ts-ignore
    if (!ref.current || !window.Prism) return;
    // @ts-ignore
    window.Prism.highlightAllUnder(ref.current);
  }, [body]);
  if (!body) return <></>;
  let html = marked.parse(body, {
    gfm: true,
    headerIds: false,
    mangle: false,
  });
  return (
    <RenderedHTML
      ref={ref}
      body={html}
      className="gui-html-container gui-md-container"
      {...attrs}
    />
  );
}
