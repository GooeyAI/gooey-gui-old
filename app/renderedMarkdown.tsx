import React, { useEffect, useRef } from "react";
import { marked } from "marked";

export function RenderedMarkdown({
  body,
  ...props
}: // allowUnsafeHTML,
{
  body: string;
  props?: Record<string, any>[];
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
  // if (!allowUnsafeHTML) {
  //   html = sanitizeHtml(html);
  // }
  return (
    <span
      ref={ref}
      dangerouslySetInnerHTML={{ __html: html }}
      className="gui-html-container gui-md-container"
      {...props}
    />
  );
}
