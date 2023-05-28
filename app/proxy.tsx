import process from "process";
import type { LoaderArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import path from "path";
import { Params } from "@remix-run/react";

export async function loader({ request, params }: LoaderArgs) {
  return await _proxy({ request, params });
}
export async function action({ request, params }: LoaderArgs) {
  return await _proxy({ request, params });
}

async function _proxy({
  request,
  params,
}: {
  params: Params;
  request: Request;
}) {
  const requestUrl = new URL(request.url);
  const proxyUrl = new URL(process.env["SERVER_HOST"]!);
  proxyUrl.pathname = path.join(proxyUrl.pathname, requestUrl.pathname);
  proxyUrl.search = requestUrl.search;

  const response = await fetch(proxyUrl, {
    method: request.method,
    redirect: "manual",
    body: request.body ? await request.arrayBuffer() : null,
    headers: request.headers,
  });

  if (response.status == 307) {
    // get the redirect url
    const redirectUrl = new URL(response.headers.get("location") ?? "/");
    // ensure that the redirect is to the same host as the request
    if (redirectUrl.host == proxyUrl.host) {
      redirectUrl.host = request.headers.get("host") ?? "";
    }
    return redirect(redirectUrl.toString(), {
      status: response.status,
      headers: response.headers,
    });
  }

  return response;
}
