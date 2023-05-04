import { useLoaderData } from "@remix-run/react";
import { renderChildren, runLoader } from "~/base/base";
import type { LoaderArgs } from "@remix-run/node";
import * as process from "process";

export async function loader({ params, request }: LoaderArgs) {
  const url = new URL(request.url);
  const filePath = params["*"];
  return runLoader({
    url:
      process.env["SERVER_HOST"] +
      "/" +
      Array.of(filePath).join("/") +
      "?" +
      url.searchParams.toString(),
  });
}

export default function Index() {
  const children = useLoaderData();
  return renderChildren(children);
}
