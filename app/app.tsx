import type {ShouldRevalidateFunction} from "@remix-run/react";
import {useFetcher, useLoaderData, useParams} from "@remix-run/react";
import {getTransforms, RenderedChildren} from "~/base";
import type {ActionArgs, LoaderArgs} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import type {FormEvent} from "react";
import React from "react";
import process from "process";
import {useDebouncedCallback} from "use-debounce";

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

const formDataToJson: Record<string, (val: FormDataEntryValue) => any> = {
  checkbox: Boolean,
  number: parseNum,
  range: parseNum,
};

function parseNum(val: FormDataEntryValue): number {
  let strVal = val.toString();
  const floatVal = parseFloat(strVal);
  const intVal = parseInt(strVal);
  if (floatVal == intVal) {
    return intVal;
  } else {
    return floatVal;
  }
}

export async function action({ params, request }: ActionArgs) {
  const { __gooey_state, __gooey_transforms, ...formData } = Object.fromEntries(
    await request.formData()
  );
  const transforms: Record<string, string> = JSON.parse(
    __gooey_transforms.toString()
  );
  for (let [k, v] of Object.entries(transforms)) {
    let fn = formDataToJson[v];
    if (!fn) continue;
    formData[k] = fn(formData[k]);
  }
  console.log(formData);
  const state = {
    ...JSON.parse(__gooey_state.toString()),
    ...formData,
  };
  let ret = await _loader({ state, params, request });
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

  const submitFormFast = useDebouncedCallback((form: HTMLFormElement) => {
    fetcher.submit(form);
  }, 250);
  const submitFormSlow = useDebouncedCallback((form: HTMLFormElement) => {
    fetcher.submit(form);
  }, 1000);

  const handleChange = (event: FormEvent<HTMLFormElement>) => {
    let target = event.target;
    // ignore hidden inputs
    if (target instanceof HTMLInputElement && target.type === "hidden") return;
    // debounce based on input type - generally text inputs are slow, everything else is fast
    if (target instanceof HTMLElement && target.hasAttribute("slowdebounce")) {
      submitFormSlow(event.currentTarget);
    } else {
      submitFormFast(event.currentTarget);
    }
  };

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
