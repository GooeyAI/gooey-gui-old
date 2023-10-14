import json
import threading
import typing
import uuid

from fastapi import FastAPI, Depends
from pydantic import BaseModel
from starlette.requests import Request

from gooey_ui.pubsub import (
    realtime_push,
    realtime_clear_subs,
    add_subscription,
    get_subscriptions,
    redis_client,
)

threadlocal = threading.local()

session_state: dict[str, typing.Any]


def __getattr__(name):
    if name == "session_state":
        return get_session_state()
    else:
        raise AttributeError(name)


def get_query_params() -> dict[str, str]:
    try:
        return threadlocal.query_params
    except AttributeError:
        threadlocal.query_params = {}
        return threadlocal.query_params


def set_query_params(params: dict[str, str]):
    threadlocal.query_params = params


def get_session_state() -> dict[str, typing.Any]:
    try:
        return threadlocal.session_state
    except AttributeError:
        threadlocal.session_state = {}
        return threadlocal.session_state


def set_session_state(state: dict[str, typing.Any]):
    threadlocal.session_state = state


Style = dict[str, str | None]
ReactHTMLProps = dict[str, typing.Any]


class RenderTreeNode(BaseModel):
    name: str
    props: ReactHTMLProps = {}
    children: list["RenderTreeNode"] = []

    def mount(self) -> "RenderTreeNode":
        threadlocal._render_root.children.append(self)
        return self


class NestingCtx:
    def __init__(self, node: RenderTreeNode = None):
        self.node = node or threadlocal._render_root
        self.parent = None

    def __enter__(self):
        try:
            self.parent = threadlocal._render_root
        except AttributeError:
            pass
        threadlocal._render_root = self.node

    def __exit__(self, exc_type, exc_val, exc_tb):
        threadlocal._render_root = self.parent

    def empty(self):
        """Empty the children of the node"""
        self.node.children = []
        return self


async def _request_json(request: Request):
    return await request.json()


def route(app: FastAPI, path: str):
    def decorator(fn):
        return app.post(path)(route_fn(fn))

    return decorator


def route_fn(fn):
    def wrapper(request: Request, json_data: dict = Depends(_request_json)):
        state = json_data.get("state", {})
        return runner(fn, state, dict(request.query_params))

    return wrapper


def runner(
    fn: typing.Callable,
    state: dict[str, typing.Any] = None,
    query_params: dict[str, str] = None,
) -> dict:
    set_session_state(state or {})
    set_query_params(query_params or {})
    realtime_clear_subs()
    threadlocal.use_state_count = 0
    while True:
        try:
            root = RenderTreeNode(name="root")
            try:
                with NestingCtx(root):
                    fn()
            except StopException:
                pass
            return dict(
                children=root.children,
                state=get_session_state(),
                channels=get_subscriptions(),
            )
        except RerunException:
            continue


def experimental_rerun():
    raise RerunException()


def use_state(initval, *, key=None):
    if key is None:
        threadlocal.use_state_count += 1
        key = f"use_state/{threadlocal.use_state_count}"

    session_state = get_session_state()
    channel = session_state.setdefault("__redis_channels", {}).setdefault(
        key, f"gooey_ui/use_state/{uuid.uuid1()}"
    )
    add_subscription(channel)

    if redis_client.exists(channel):
        if value := redis_client.get(channel):
            retval = session_state[key] = json.loads(value)
        else:
            retval = None
    else:
        retval = session_state.setdefault(key, initval)

    def set_state(val):
        realtime_push(channel, val)

    return retval, set_state


def stop():
    raise StopException()


class StopException(Exception):
    pass


class RerunException(Exception):
    pass


class UploadedFile:
    pass
