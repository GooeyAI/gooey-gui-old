import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node"; // Depends on the runtime you choose
import { cssBundleHref } from "@remix-run/css-bundle";
import React, { useEffect } from "react";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export default function App() {
  // let everyone know when the page is done hydrating
  useEffect(() => {
    // @ts-ignore
    if (typeof window === "undefined" || window.hydrated) return;
    // @ts-ignore
    window.hydrated = true;
    window.dispatchEvent(new Event("hydrated"));
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

// export function ErrorBoundary() {
//   const error = useRouteError();
//
//   // when true, this is what used to go to `CatchBoundary`
//   if (isRouteErrorResponse(error)) {
//     return (
//       <div>
//         <p>Status: {error.status}</p>
//         <p dangerouslySetInnerHTML={{ __html: error.data }}></p>
//       </div>
//     );
//   }
//
//   return (
//     <div>
//       <h1>Uh oh ...</h1>
//       <p>Something went wrong.</p>
//       <pre>Code: {typeof error}</pre>
//     </div>
//   );
// }
