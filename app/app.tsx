import type {
  FetcherWithComponents,
  ShouldRevalidateFunction,
  V2_MetaFunction,
} from "@remix-run/react";
import { useFetcher, useLoaderData, useSearchParams } from "@remix-run/react";
import { getTransforms, RenderedChildren } from "~/base";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import type { FormEvent } from "react";
import React, { useEffect, useRef } from "react";
import process from "process";
import { useEventSource } from "remix-utils";
import path from "path";
import { handleRedirectResponse } from "~/handleRedirect";

export const meta: V2_MetaFunction = ({ data }) => {
  return data.meta ?? [];
};

// export const links: LinksFunction = () => {
//   return [
//     {
//       rel: "stylesheet",
//       href: "https://unpkg.com/modern-css-reset@1.4.0/dist/reset.min.css",
//     },
//   ];
// };

export async function loader({ params, request }: LoaderArgs) {
  return await _loader({ body: {}, params, request });
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
  return await _loader({ body, params, request });
}

async function _loader({
  body,
  params,
  request,
}: {
  body: Record<string, any>;
  params: Record<string, any>;
  request: Request;
}) {
  const requestUrl = new URL(request.url);
  const backendUrl = new URL(process.env["SERVER_HOST"]!);
  backendUrl.pathname = path.join(backendUrl.pathname, params["*"] ?? "");
  backendUrl.search = requestUrl.search;

  request.headers.set("Content-Type", "application/json");

  const response = await fetch(backendUrl, {
    method: "POST",
    redirect: "manual",
    body: JSON.stringify(body),
    headers: request.headers,
  });
  if (!response.ok) throw response;

  const redirectUrl = handleRedirectResponse({ response });
  if (redirectUrl) {
    return redirect(redirectUrl, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });
  }

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
  // if (args.currentParams)
  if (args.formMethod === "POST") {
    return false;
  }
  return args.defaultShouldRevalidate;
};

function useRealtimeEvents({ channels }: { channels: string[] }) {
  const params = new URLSearchParams(
    channels.map((name) => ["channels", name])
  );
  return useEventSource(`/__/realtime/?${params}`, { event: "event" });
}

function useSubmitFormNoCancel({
  fetcher,
  onSubmit,
}: {
  fetcher: FetcherWithComponents<typeof action>;
  onSubmit: () => void;
}) {
  const submitIsPendingRef = useRef(false);
  useEffect(() => {
    if (fetcher.state !== "idle" || !submitIsPendingRef.current) return;
    submitIsPendingRef.current = false;
    onSubmit();
  }, [fetcher, fetcher.state, submitIsPendingRef]);
  return () => {
    if (fetcher.state === "submitting") {
      submitIsPendingRef.current = true;
    } else {
      onSubmit();
    }
  };
}

export default function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const { children, state, channels, query_params } =
    fetcher.data ?? loaderData;
  const formRef = useRef<HTMLFormElement>(null);
  const hooksEvent = useRealtimeEvents({ channels });

  useEffect(() => {
    let currentUrl = new URL(window.location.href);
    let newSearchParams = new URLSearchParams(query_params);
    if (currentUrl.searchParams.toString() == newSearchParams.toString())
      return;
    setSearchParams(newSearchParams);
  }, [query_params]);

  const submitFormNoCancel = useSubmitFormNoCancel({
    fetcher,
    onSubmit() {
      submitForm(formRef.current);
    },
  });
  useEffect(() => {
    // if (hooksEvent) submitForm(formRef.current);
    if (hooksEvent) submitFormNoCancel();
  }, [hooksEvent]);

  const submitForm = (form: HTMLFormElement | null) => {
    if (form) fetcher.submit(form, { replace: true });
  };
  // const submitFormFast = useDebouncedCallback(submitForm, 250);
  // const submitFormSlow = useDebouncedCallback(submitForm, 1000);

  const handleChange = (event: FormEvent<HTMLFormElement>) => {
    let target = event.target;
    // ignore hidden inputs
    if (target instanceof HTMLInputElement && target.type === "hidden") return;
    submitFormNoCancel();
    // // debounce based on input type - generally text inputs are slow, everything else is fast
    // if (target instanceof HTMLElement && target.hasAttribute("slowdebounce")) {
    //   submitFormSlow(event.currentTarget);
    // } else {
    //   submitFormFast(event.currentTarget);
    // }
  };

  return (
    <>
      <fetcher.Form
        ref={formRef}
        id={"gooey-form"}
        action={"?" + searchParams}
        method="POST"
        onChange={handleChange}
        noValidate
      >
        <RenderedChildren children={children} />
        <input
          type="hidden"
          name="__gooey_gui_request_body"
          value={JSON.stringify({
            state,
            transforms: getTransforms({ children: children }),
          })}
        />
      </fetcher.Form>
    </>
  );
}
