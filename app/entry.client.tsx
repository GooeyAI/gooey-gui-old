import { RemixBrowser, useLocation, useMatches } from "@remix-run/react";
import { hydrate } from "react-dom";
import * as Sentry from "@sentry/remix";
import { useEffect } from "react";
import { HttpClient } from "@sentry/integrations";

if (window.ENV.SENTRY_DSN) {
  Sentry.init({
    dsn: window.ENV.SENTRY_DSN,
    integrations: [
      new Sentry.BrowserTracing({
        // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
        // tracePropagationTargets: ["localhost", /^https:\/\/gooey\.ai\/.*/],
        routingInstrumentation: Sentry.remixRouterInstrumentation(
          useEffect,
          useLocation,
          useMatches,
        ),
      }),
      new Sentry.Replay(),
      new HttpClient(),
    ],
    release: window.ENV.SENTRY_RELEASE,
    // Performance Monitoring
    tracesSampleRate: window.ENV.SENTRY_SAMPLE_RATE, // Capture X% of the transactions, reduce in production!
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    // This option is required for capturing headers and cookies.
    sendDefaultPii: true,
    transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),
  });
}

hydrate(<RemixBrowser />, document);
