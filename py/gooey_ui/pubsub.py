import json
import os
import threading
import typing
from time import time

import redis
from fastapi.encoders import jsonable_encoder

T = typing.TypeVar("T")

threadlocal = threading.local()
redis_client = redis.Redis.from_url(
    os.environ.get("REDIS_URL") or "redis://localhost:6379"
)


def realtime_clear_subs():
    threadlocal.channels = set()


def get_subscriptions() -> list[str]:
    try:
        return threadlocal.channels
    except AttributeError:
        threadlocal.channels = set()
        return threadlocal.channels


def add_subscription(channel: str):
    try:
        threadlocal.channels.add(channel)
    except AttributeError:
        threadlocal.channels = {channel}
    return threadlocal.channels


def realtime_pull(channel: str) -> typing.Any:
    add_subscription(channel)
    if value := redis_client.get(channel):
        return json.loads(value)
    return None


def realtime_push(channel: str, value: typing.Any = "ping"):
    msg = json.dumps(jsonable_encoder(value))
    redis_client.set(channel, msg)
    redis_client.publish(channel, json.dumps(time()))
    print(f"publish {channel!r}")
