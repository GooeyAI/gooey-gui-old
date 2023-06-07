import React from "react";
import { marked } from "marked";

export function RenderedMarkdown({
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
