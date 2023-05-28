import type { LoaderArgs } from "@remix-run/node";
import { eventStream } from "remix-utils";

import { createClient } from "redis";

const client = createClient({
  url: process.env["REDIS_URL"],
});

export async function loader({ params, request }: LoaderArgs) {
  const url = new URL(request.url);
  const channels = url.searchParams.getAll("channels");
  return eventStream(request.signal, (send) => {
    let isActive = true;
    const subscriber = client.duplicate();
    subscriber.connect();
    subscriber.on("error", (err) => console.error(err));
    subscriber.on("connect", () => console.log("Connected to redis", channels));
    subscriber.subscribe(channels, (msg, channel) => {
      if (!isActive) return;
      send({
        event: "event",
        data: JSON.stringify([channel, JSON.parse(msg)]),
      });
    });
    return () => {
      isActive = false;
      subscriber.unsubscribe();
    };
  });
}
