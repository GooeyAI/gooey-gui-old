require("dotenv/config");

const PROXY_URLS = process.env.PROXY_URLS?.trim().split(/\s+/) || [];
const RENDER_PROXY_URLS =
  process.env.RENDER_PROXY_URLS?.trim().split(/\s+/) || [];

/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  ignoredRouteFiles: ["**/.*", "**/*.module.css"],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "build/index.js",
  // publicPath: "/build/",
  serverModuleFormat: "cjs",
  future: {
    v2_errorBoundary: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },
  serverDependenciesToBundle: [
    /uppy/,
    /marked/,
    /nanoid/,
    /exifr/,
    /firebase-admin/,
    /glideapps/,
  ],
  routes(defineRoutes) {
    return defineRoutes((route) => {
      // A common use for this is catchall _routes.
      // - The first argument is the React Router path to match against
      // - The second is the relative filename of the route handler
      for (const path of PROXY_URLS) {
        route(path, "proxy.tsx", { id: path });
      }
      route("/__/*", "proxy.tsx", { id: "__hidden" });
      for (const path of RENDER_PROXY_URLS) {
        route(path, "renderProxy.tsx", { id: path });
      }
      route("/__/realtime/*", "realtime.tsx");
      try {
        route("/", "app.tsx", { id: "index" });
      } catch {
        // ignore if duplicate
      }
      route("*", "app.tsx");
    });
  },
};
