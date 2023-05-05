import { useLoaderData } from "@remix-run/react";
import { RenderedChildren, runLoader } from "~/base/base";
import type { LoaderArgs } from "@remix-run/node";
import * as process from "process";

export async function loader({ params, request }: LoaderArgs) {
  const url = new URL(request.url);
  const filePath = params["*"];
  return runLoader({
    path: Array.of(filePath).join("/") + url.search + url.hash,
  });
}

export default function Index() {
  const children = useLoaderData();
  return <RenderedChildren children={children} />;
}
