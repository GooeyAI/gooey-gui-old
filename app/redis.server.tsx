import { createClient } from "redis";
import settings from "~/settings";

declare global {
  var redis: ReturnType<typeof createClient>;
}
if (typeof global.redis === "undefined") {
  global.redis = createClient({
    url: settings.REDIS_URL,
  });
  global.redis.connect();
}

export default global.redis;
