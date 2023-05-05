import { useLoaderData } from "@remix-run/react";
import { RenderedChildren, runLoader } from "~/base/base";

export async function loader() {
  return runLoader({
    path: "/explore/",
  });
}

export default function Index() {
  const children = useLoaderData();
  return <RenderedChildren children={children} />;
}
