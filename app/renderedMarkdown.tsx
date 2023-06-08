import React from "react";
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
      className="htmlContainer mdContainer"
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    ></span>
  );
}
