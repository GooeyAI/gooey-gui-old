const settings = {
  SERVER_HOST: process.env.SERVER_HOST || "http://127.0.0.1:8000",
  RENDER_PROXY_HOST: process.env.RENDER_PROXY_HOST,
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  SENTRY_DSN: process.env.SENTRY_DSN,
  SENTRY_SAMPLE_RATE: parseFloat(process.env.SENTRY_SAMPLE_RATE ?? "0.1"),
  SENTRY_RELEASE: process.env.SENTRY_RELEASE,
};

export default settings;
