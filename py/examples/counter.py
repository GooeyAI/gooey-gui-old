from time import sleep

from fastapi import FastAPI

import gooey_ui as gui

app = FastAPI()


@gui.route(app, "/counter")
def poems():
    count, set_count = gui.use_state(0)

    start_counter = gui.button("Start Counter")
    if start_counter:
        for i in range(10):
            set_count(i)
            sleep(1)

    gui.write(f"### Count: {count}")

    text = gui.text_input("Type Something here...")
    gui.write("**You typed:** " + text)
