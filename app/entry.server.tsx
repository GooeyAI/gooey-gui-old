import * as Sentry from "@sentry/remix";
import type { DataFunctionArgs, EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";
import settings from "~/settings";

export function handleError(error: unknown, { request }: DataFunctionArgs) {
  Sentry.captureRemixServerException(error, "remix.server", request);
}

if (settings.SENTRY_DSN) {
  Sentry.init({
    dsn: settings.SENTRY_DSN,
    // Integrations:
    //    e.g. new Sentry.Integrations.Prisma({ client: prisma })
    // Performance Monitoring:
    tracesSampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE ?? "0.1"),
  });
}

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  let markup = renderToString(
    <RemixServer context={remixContext} url={request.url} />,
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response("<!DOCTYPE html>" + markup, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
