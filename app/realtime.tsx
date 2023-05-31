import type { LoaderArgs } from "@remix-run/node";
import { eventStream } from "remix-utils";
import { redis } from "~/redis.server";

export async function loader({ params, request }: LoaderArgs) {
  const url = new URL(request.url);
  const channels = url.searchParams.getAll("channels");

  if (!channels.length) {
    return new Response(null, { status: 204 });
  }

  return eventStream(request.signal, (send) => {
    let isActive = true;
    const subscriber = redis.duplicate();
    subscriber.connect();
    subscriber.on("error", (err) => console.error(err));
    subscriber.on("connect", async () => {
      console.log("Connected to redis", channels);
      // attempt to fix the slow joiner syndrome
      if (await redis.exists(channels)) onMsg();
    });
    subscriber.subscribe(channels, (msg, channel) => {
      onMsg();
    });
    function onMsg() {
      if (!isActive) return;
      send({ event: "event", data: Date.now().toString() });
    }
    return () => {
      isActive = false;
      subscriber.unsubscribe();
    };
  });
}
