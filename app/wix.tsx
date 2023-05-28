import type { LoaderArgs } from "@remix-run/node";
import path from "path";

export async function loader({ request }: LoaderArgs) {
  const requestUrl = new URL(request.url);
  const wixUrl = new URL(process.env["WIX_SITE_URL"]!);
  wixUrl.pathname = path.join(wixUrl.pathname, requestUrl.pathname);
  wixUrl.search = requestUrl.search;
  return await fetch(wixUrl, {
    headers: {
      ...request.headers,
      host: wixUrl.host,
    },
  });
}
