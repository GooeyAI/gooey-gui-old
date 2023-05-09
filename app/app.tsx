import {
  ShouldRevalidateFunction,
  useFetcher,
  useLoaderData,
  useParams,
} from "@remix-run/react";
import { getTransforms, RenderedChildren } from "~/base";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import React, { FormEvent } from "react";
import process from "process";
import is from "@sindresorhus/is";
import formData = is.formData;
// import { ActionArgs } from "@remix-run/node";

// export const meta: V2_MetaFunction = () => {
//   return [{ title: "New Remix App" }];
// };

// export const links: LinksFunction = () => {
//   return [
//     {
//       rel: "stylesheet",
//       href: "https://unpkg.com/modern-css-reset@1.4.0/dist/reset.min.css",
//     },
//   ];
// };

export async function loader({ params, request }: LoaderArgs) {
  return await _loader({ state: {}, params, request });
}

const dataTransformFns: Record<string, (val: FormDataEntryValue) => any> = {
  checkbox: Boolean,
};

export async function action({ params, request }: ActionArgs) {
  let start = performance.now();
  const { __gooey_state, __gooey_transforms, ...formData } = Object.fromEntries(
    await request.formData()
  );
  const transforms: Record<string, string> = JSON.parse(
    __gooey_transforms.toString()
  );
  for (let [k, v] of Object.entries(transforms)) {
    let fn = dataTransformFns[v];
    formData[k] = fn(formData[k]);
  }
  console.log(formData);
  const state = {
    ...JSON.parse(__gooey_state.toString()),
    ...formData,
  };
  let ret = await _loader({ state, params, request });
  console.log("total took", performance.now() - start, "ms");
  return ret;
}

async function _loader({
  state,
  params,
  request,
}: {
  state: Record<string, any>;
  params: Record<string, any>;
  request: Request;
}) {
  const pathlib = require("path");

  const url = new URL(request.url);
  const filePath = params["*"];
  const path =
    "/__/gooey-ui/" + Array.of(filePath).join("/") + url.search + url.hash;

  // concat base url and path
  const response = await fetch(pathlib.join(process.env["SERVER_HOST"], path), {
    method: "POST",
    redirect: "follow",
    body: JSON.stringify({ state }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  // follow redirects back to the client
  if (response.status == 307) {
    const url = new URL(response.headers.get("location") ?? "");
    return redirect(url.pathname + url.search + url.hash);
  } else if (!response.ok) {
    throw response;
  }

  return await response.json();
}

export const shouldRevalidate: ShouldRevalidateFunction = (args) => {
  if (args.formMethod === "POST") {
    return false;
  }
  return args.defaultShouldRevalidate;
};

export default function App() {
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const data = fetcher.data ?? loaderData;

  function handleChange(event: FormEvent<HTMLFormElement>) {
    fetcher.submit(event.currentTarget);
  }

  return (
    <>
      <fetcher.Form
        action={"/" + params["*"]}
        method="POST"
        onChange={handleChange}
      >
        <RenderedChildren children={data.children} />
        <input
          type="hidden"
          name="__gooey_state"
          value={JSON.stringify(data.state)}
        />
        <input
          type="hidden"
          name="__gooey_transforms"
          value={JSON.stringify(getTransforms({ children: data.children }))}
        />
      </fetcher.Form>
    </>
  );
}
