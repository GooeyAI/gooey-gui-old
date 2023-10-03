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
import React from "react";
import { globalProgressStyles, useGlobalProgress } from "~/global-progres-bar";
import { HydrationUtils } from "~/useHydrated";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  ...globalProgressStyles(),
];

export default function App() {
  useGlobalProgress();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <HydrationUtils />
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <div id="portal" />
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
