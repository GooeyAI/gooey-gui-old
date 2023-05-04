import { useLoaderData } from "@remix-run/react";
import { renderChildren, runLoader } from "~/base/base";
import process from "process";

export async function loader() {
  return runLoader({
    url: process.env["SERVER_HOST"] + "/explore/",
  });
}

export default function Index() {
  const children = useLoaderData();
  return renderChildren(children);
}
