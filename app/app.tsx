import type {
  ShouldRevalidateFunction,
  V2_MetaFunction,
} from "@remix-run/react";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { getTransforms, RenderedChildren } from "~/base";
import type { ActionArgs, LinksFunction, LoaderArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import type { FormEvent } from "react";
import React, { useEffect, useRef } from "react";
import process from "process";
import path from "path";
import { handleRedirectResponse } from "~/handleRedirect";
import { useEventSourceNullOk } from "~/event-source";
import { useDebouncedCallback } from "use-debounce";
import custom from "~/styles/custom.css";
import app from "~/styles/app.css";

export const meta: V2_MetaFunction = ({ data }) => {
  return data.meta ?? [];
};

export const links: LinksFunction = () => {
  //   const old = `
  //       <link
  //       href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css"
  //       rel="stylesheet"
  //       integrity="sha384-rbsA2VBKQhggwzxH7pPCaAqO46MgnOM80zW1RWuH61DGLwZJEdK2Kadq2F9CUG65"
  //       crossorigin="anonymous"
  //     />
  //     <script
  //       src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"
  //       integrity="sha384-kenU1KFdBIe4zVF0s0G1M5b4hcpxyD9F7jL+jjXkk+Q2h455rYXK/7HAuoJl+0I4"
  //       crossorigin="anonymous"
  //     ></script>
  //     <link rel="preconnect" href="https://fonts.googleapis.com" />
  //     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  //     <link
  //       href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
  //       rel="stylesheet"
  //     />
  //     <link href="custome.css" rel="stylesheet" />
  // `;

  return [
    // {
    //   rel: "stylesheet",
    //   href: "https://unpkg.com/modern-css-reset@1.4.0/dist/reset.min.css",
    // },
    {
      rel: "stylesheet",
      href: "https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css",
      integrity:
        "sha384-rbsA2VBKQhggwzxH7pPCaAqO46MgnOM80zW1RWuH61DGLwZJEdK2Kadq2F9CUG65",
      crossOrigin: "anonymous",
    },
    { rel: "stylesheet", href: custom },
    { rel: "stylesheet", href: app },
  ];
};

export async function loader({ params, request }: LoaderArgs) {
  return await callServer({ body: {}, params, request });
}

export async function action({ params, request }: ActionArgs) {
  // parse form data
  const { __gooey_gui_request_body, ...inputs } = Object.fromEntries(
    await request.formData()
  );
  // parse request body
  const {
    transforms,
    state,
    ...body
  }: {
    transforms: Record<string, string>;
    state: Record<string, any>;
  } & Record<string, any> = JSON.parse(__gooey_gui_request_body.toString());
  // apply transforms
  for (let [field, inputType] of Object.entries(transforms)) {
    let toJson = formFieldToJson[inputType];
    if (!toJson) continue;
    inputs[field] = toJson(inputs[field]);
  }
  // update state with new form data
  body.state = { ...state, ...inputs };
  return callServer({ body, params, request });
}

async function callServer({
  body,
  params,
  request,
}: {
  body: Record<string, any>;
  params: Record<string, any>;
  request: Request;
}) {
  const requestUrl = new URL(request.url);
  const serverUrl = new URL(process.env["SERVER_HOST"]!);
  serverUrl.pathname = path.join(serverUrl.pathname, params["*"] ?? "");
  serverUrl.search = requestUrl.search;

  request.headers.set("Content-Type", "application/json");

  const response = await fetch(serverUrl, {
    method: "POST",
    redirect: "manual",
    body: JSON.stringify(body),
    headers: request.headers,
  });

  const redirectUrl = handleRedirectResponse({ response });
  if (redirectUrl) {
    return redirect(redirectUrl, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });
  }

  if (!response.ok) throw response;
  return response;
}

const formFieldToJson: Record<string, (val: FormDataEntryValue) => any> = {
  checkbox: Boolean,
  number: parseIntFloat,
  range: parseIntFloat,
  select: (val) => JSON.parse(val.toString()),
};

function parseIntFloat(val: FormDataEntryValue): number {
  let strVal = val.toString();
  const intVal = parseInt(strVal);
  const floatVal = parseFloat(strVal);
  if (floatVal == intVal) {
    return intVal;
  } else if (isNaN(floatVal)) {
    return 0;
  } else {
    return floatVal;
  }
}

export const shouldRevalidate: ShouldRevalidateFunction = (args) => {
  if (
    args.formMethod === "POST" &&
    args.currentUrl.toString() === args.nextUrl.toString()
  ) {
    return false;
  }
  return args.defaultShouldRevalidate;
};

function useRealtimeChannels({ channels }: { channels: string[] }) {
  let url;
  if (channels.length) {
    const params = new URLSearchParams(
      channels.map((name) => ["channels", name])
    );
    url = `/__/realtime/?${params}`;
  }
  return useEventSourceNullOk(url);
}

export default function App() {
  const [searchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const { children, state, channels } = actionData ?? loaderData;
  const formRef = useRef<HTMLFormElement>(null);
  const realtimeEvent = useRealtimeChannels({ channels });
  const fetcher = useFetcher();

  useEffect(() => {
    if (realtimeEvent && fetcher.state === "idle" && formRef.current) {
      submit(formRef.current);
    }
  }, [fetcher.state, realtimeEvent, submit]);

  const debouncedSubmit = useDebouncedCallback(submit, 500);

  const handleChange = (event: FormEvent<HTMLFormElement>) => {
    let target = event.target;
    // ignore hidden inputs
    if (target instanceof HTMLInputElement && target.type === "hidden") return;
    // debounce based on input type - generally text inputs are slow, everything else is fast
    if (target instanceof HTMLElement && target.hasAttribute("slow_debounce")) {
      debouncedSubmit(event.currentTarget);
    } else {
      submit(event.currentTarget);
    }
  };

  const transforms = getTransforms({ children });

  return (
    <>
      <Form
        ref={formRef}
        id={"gooey-form"}
        action={"?" + searchParams}
        method="POST"
        onChange={handleChange}
        noValidate
      >
        <div className="container mt-5">
          <RenderedChildren children={children} />
        </div>
        <input
          type="hidden"
          name="__gooey_gui_request_body"
          value={JSON.stringify({ state, transforms })}
        />
      </Form>
    </>
  );
}
