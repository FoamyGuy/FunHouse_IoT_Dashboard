# SPDX-FileCopyrightText: 2023 Tim Cocks for Adafruit Industries
#
# SPDX-License-Identifier: Unlicense

import json
import time
from time import monotonic
import board
import microcontroller
import neopixel
import socketpool
import wifi
from adafruit_dps310.basic import DPS310
from analogio import AnalogIn
from simpleio import map_range
from adafruit_httpserver import Server, Request, Response, FileResponse, Websocket, GET
import adafruit_dotstar as dotstar
import adafruit_ahtx0
from adafruit_templateengine import render_string
from digitalio import DigitalInOut, Direction, Pull
from adafruit_debouncer import Debouncer
import touchio

class WebsocketDataCache:
    def __init__(self):
        self.cache = []


class HardwareInterface:
    def __init__(self):
        self.i2c = board.I2C()
        self.dps310_sensor = DPS310(self.i2c)
        self.aht20_sensor = adafruit_ahtx0.AHTx0(self.i2c)
        self.light_sensor = AnalogIn(board.LIGHT)

        self.btn_down = DigitalInOut(board.BUTTON_DOWN)
        self.btn_down.direction = Direction.INPUT
        self.btn_down.pull = Pull.DOWN
        self.btn_down_debounced = Debouncer(self.btn_down)

        self.btn_up = DigitalInOut(board.BUTTON_UP)
        self.btn_up.direction = Direction.INPUT
        self.btn_up.pull = Pull.DOWN
        self.btn_up_debounced = Debouncer(self.btn_up)

        self.btn_select = DigitalInOut(board.BUTTON_SELECT)
        self.btn_select.direction = Direction.INPUT
        self.btn_select.pull = Pull.DOWN
        self.btn_select_debounced = Debouncer(self.btn_select)

        self.touch_6 = touchio.TouchIn(board.CAP6)
        self.touch_6_debounced = Debouncer(self.touch_6)

        self.touch_7 = touchio.TouchIn(board.CAP7)
        self.touch_7_debounced = Debouncer(self.touch_7)

        self.touch_8 = touchio.TouchIn(board.CAP8)
        self.touch_8_debounced = Debouncer(self.touch_8)



class SensorTask:
    def __init__(self, data_cache, hardware_interface):
        self.data_cache = data_cache
        self.hardware = hardware_interface
        self.last_read_time = 0
        self.delay = 1.0

    def poll(self):
        now = monotonic()
        if self.last_read_time + self.delay < now:
            # print("time for sensor reading")
            light_val = self.hardware.light_sensor.value
            # print("light reading: {}".format(light_val))
            self.data_cache.cache.append({
                "type": "sensor_reading",
                "data": {
                    "temperature": "%.2f C" % self.hardware.aht20_sensor.temperature,
                    "humidity": "%.2f %%" % self.hardware.aht20_sensor.relative_humidity,
                    "pressure": "{pressure:.2f} kPa".format(pressure=(self.hardware.dps310_sensor.pressure / 10.0)),
                    "light": "%.2f %%" % map_range(light_val, 0, 65535, 0.0, 100.0)
                }
            })
            self.last_read_time = now
        # await asyncio.sleep(1)


class ButtonsTask:
    def __init__(self, websocket_data_cache, hardware_interface):
        self.websocket_data_cache = websocket_data_cache
        self.hardware = hardware_interface
        f = open("templates/event_row.html")
        self.event_row_template = f.read()
        f.close()

    def event_obj(self, type, btn_name, action):
        return {
            "type": "button",
            "data": {
                "time": time.monotonic(),
                "pin": btn_name,
                "action": action
            }
        }


    def event_row(self, event_obj):
        return {
            "type": "event",
            "data": {
                "event_row_html": render_string(self.event_row_template, event_obj)
            }
        }

    def poll(self):
        self.hardware.btn_down_debounced.update()
        self.hardware.btn_up_debounced.update()
        self.hardware.btn_select_debounced.update()
        self.hardware.touch_6_debounced.update()
        self.hardware.touch_7_debounced.update()
        self.hardware.touch_8_debounced.update()

        # print(self.hardware.btn_down_debounced.value)
        if self.hardware.btn_down_debounced.fell:
            self.websocket_data_cache.cache.append(self.event_row(self.event_obj("button", "DOWN_BUTTON", "fell")))
        elif self.hardware.btn_down_debounced.rose:
            self.websocket_data_cache.cache.append(self.event_row(self.event_obj("button", "DOWN_BUTTON", "rose")))

        if self.hardware.btn_up_debounced.fell:
            self.websocket_data_cache.cache.append(self.event_row(self.event_obj("button", "UP_BUTTON", "fell")))
        elif self.hardware.btn_up_debounced.rose:
            self.websocket_data_cache.cache.append(self.event_row(self.event_obj("button", "UP_BUTTON", "rose")))

        if self.hardware.btn_select_debounced.fell:
            self.websocket_data_cache.cache.append(self.event_row(self.event_obj("button", "SELECT_BUTTON", "fell")))
        elif self.hardware.btn_select_debounced.rose:
            self.websocket_data_cache.cache.append(self.event_row(self.event_obj("button", "SELECT_BUTTON", "rose")))

        if self.hardware.touch_6_debounced.fell:
            self.websocket_data_cache.cache.append(self.event_row(self.event_obj("touch", "CAP6_TOUCH", "fell")))
        elif self.hardware.touch_6_debounced.rose:
            self.websocket_data_cache.cache.append(self.event_row(self.event_obj("touch", "CAP6_TOUCH", "rose")))

        if self.hardware.touch_7_debounced.fell:
            self.websocket_data_cache.cache.append(self.event_row(self.event_obj("touch", "CAP7_TOUCH", "fell")))
        elif self.hardware.touch_7_debounced.rose:
            self.websocket_data_cache.cache.append(self.event_row(self.event_obj("touch", "CAP7_TOUCH", "rose")))

        if self.hardware.touch_8_debounced.fell:
            self.websocket_data_cache.cache.append(self.event_row(self.event_obj("touch", "CAP8_TOUCH", "fell")))
        elif self.hardware.touch_8_debounced.rose:
            self.websocket_data_cache.cache.append(self.event_row(self.event_obj("touch", "CAP8_TOUCH", "rose")))


class ServerTask:
    def __init__(self, websocket_data_cache, hardware_interface):

        self.hardware = hardware_interface
        # self.dots = dotstar.DotStar(board.DOTSTAR_CLOCK, board.DOTSTAR_DATA, 5, brightness=0.1)

        self.pool = socketpool.SocketPool(wifi.radio)
        server = Server(self.pool, debug=True, root_path="templates")
        self.websocket_data_cache = websocket_data_cache

        self.websocket_send_interval = 0.3

        self.websocket: Websocket = None
        self.next_message_time = monotonic()

        @server.route("/client", GET)
        def client(request: Request):
            initial_data = {
                "temperature": "%.2f" % self.hardware.aht20_sensor.temperature,
                "humidity": "%.2f" % self.hardware.aht20_sensor.relative_humidity,
                "pressure": "{pressure:.2f}".format(pressure=(self.hardware.dps310_sensor.pressure / 10.0)),
                "light": "%.2f" % map_range(self.hardware.light_sensor.value, 0, 65535, 0.0, 100.0)
            }

            f = open("templates/funhouse_iot_dashboard.html", "r")
            _resp_template = f.read()
            f.close()

            return Response(request, render_string(_resp_template, initial_data), content_type="text/html")
            # return FileResponse(request, "funhouse_iot_dashboard.html", content_type="text/html")

        @server.route("/connect-websocket", GET)
        def connect_client(request: Request):
            # global websocket  # pylint: disable=global-statement

            if self.websocket is not None:
                self.websocket.close()  # Close any existing connection

            self.websocket = Websocket(request)

            return self.websocket

        self.server = server
        self.server.start(str(wifi.radio.ipv4_address))

    def poll(self):

        try:
            self.server.poll()
        except OSError:
            print("OSError Attempting server.poll()")


        # Check for incoming messages from client
        # if self.websocket is not None:
        #     if (data := self.websocket.receive(True)) is not None:
        #         r, g, b = int(data[1:3], 16), int(data[3:5], 16), int(data[5:7], 16)
        #         self.dots.fill((r, g, b))

        # Send a message every second
        if self.websocket is not None and self.next_message_time < monotonic():
            try:
                if len(self.websocket_data_cache.cache) > 0:
                    for data_item in self.websocket_data_cache.cache:
                        self.websocket.send_message(json.dumps(data_item))
                    self.websocket_data_cache.cache.clear()
                else:
                    # cpu_temp = round(microcontroller.cpu.temperature, 2)

                    self.websocket.send_message(json.dumps({"type": "ping"}))

                self.next_message_time = monotonic() + self.websocket_send_interval
            except RuntimeError:
                # websocket got closed
                print("RuntimeError sending on ws")
                self.websocket = None
            except OSError:
                print("OSError sending on ws")
                self.websocket = None
            except BrokenPipeError:
                print("BrokenPipeError sending on ws")
                self.websocket = None

        # Clear the data cache if there isn't a websocket connection
        if self.websocket is None:
            self.websocket_data_cache.cache.clear()
        # await asyncio.sleep(0)


def main():
    data_cache = WebsocketDataCache()

    hardware = HardwareInterface()
    sensor_task = SensorTask(data_cache, hardware)
    button_task = ButtonsTask(data_cache, hardware)
    server_task = ServerTask(data_cache, hardware)

    while True:
        button_task.poll()
        sensor_task.poll()
        server_task.poll()


main()
