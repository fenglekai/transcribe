import time
import flet as ft
import numpy as np
import sounddevice as sd
import threading
from sound import SoundTranscribe


class FletMain:
    def __init__(self):
        self.page = None
        self.devices = [
            d
            for d in sd.query_devices()
            if d["max_output_channels"] > 0 or d["max_input_channels"] > 0
        ]
        self.device_detail = ft.Text()
        self.select_device = sd.default.device[0]
        self.device_list = ft.Dropdown(
            label="选择设备",
            options=[
                ft.dropdown.Option(index, d["name"])
                for index, d in enumerate(self.devices)
            ],
            on_change=self.on_select_device,
        )
        self.volume_bar = ft.ProgressBar(width=200, value=0)
        self.device_select = ft.Row(
            [
                ft.Container(
                    content=ft.Text("准备好了吗？开始录音吧!"),
                    margin=10,
                    padding=10,
                    alignment=ft.alignment.center,
                    height=60,
                    border_radius=10,
                ),
                # ft.Container(
                #     content=self.device_list,
                #     margin=10,
                #     padding=10,
                #     alignment=ft.alignment.center,
                #     height=100,
                #     border_radius=10,
                # ),
                # ft.Container(
                #     content=ft.CupertinoButton(
                #         content=ft.Text(
                #             "刷新设备",
                #         ),
                #         opacity_on_click=0.3,
                #         on_click=lambda e: self.refresh_device(e),
                #     ),
                #     margin=10,
                #     padding=10,
                #     alignment=ft.alignment.center,
                #     height=100,
                #     border_radius=10,
                # ),
                # ft.Container(
                #     content=self.device_detail,
                #     margin=10,
                #     padding=10,
                #     alignment=ft.alignment.center,
                #     height=100,
                #     border_radius=10,
                # ),
                # ft.Container(
                #     content=self.volume_bar,
                #     margin=10,
                #     padding=10,
                #     alignment=ft.alignment.center,
                #     height=100,
                #     border_radius=10,
                # ),
            ]
        )
        self.stop_event = threading.Event()
        self.text_count = ""
        self.translation_text_count = ""
        self.button_status = False
        self.list_view = ft.ListView(
            expand=1,
            spacing=10,
            auto_scroll=True,
        )
        self.sound_text = ft.Text(selectable=True)
        self.list_view.controls.append(self.sound_text)
        self.sound_container = ft.Container(
            content=self.list_view,
            margin=10,
            padding=10,
            border=ft.border.all(1, ft.colors.GREY_300),
            border_radius=4,
            alignment=ft.alignment.top_left,
            height=230,
        )
        self.translation_text = ft.Text(selectable=True)
        self.translation_list_view = ft.ListView(
            expand=1,
            spacing=10,
            auto_scroll=True,
            height=230,
        )
        self.translation_list_view.controls.append(self.translation_text)
        self.translation_sound_container = ft.Container(
            content=self.translation_list_view,
            margin=10,
            padding=10,
            border=ft.border.all(1, ft.colors.GREY_300),
            border_radius=4,
            alignment=ft.alignment.top_left,
        )
        self.sound_transcribe = SoundTranscribe(
            self.add_text, self.add_row, self.add_translation
        )

        ft.app(self.flet_page)

    def flet_page(self, page: ft.Page):
        self.page = page
        # self.start_audio_stream()
        page.title = "Less write realtime speech recognition"
        page.horizontal_alignment = ft.CrossAxisAlignment.CENTER
        page.auto_scroll = True
        page.scroll = ft.ScrollMode.HIDDEN

        page.floating_action_button = ft.FloatingActionButton(
            icon=ft.icons.PLAY_ARROW,
            on_click=self.fab_pressed,
            bgcolor=ft.colors.CYAN_300,
        )
        page.add(self.device_select)
        page.add(self.sound_container)
        page.add(self.translation_sound_container)

    def start_audio_stream(self):
        def audio_callback(indata, frames, time, status):
            volume_norm = np.linalg.norm(indata)
            self.volume_bar.value = min(1.0, volume_norm)
            self.page.update()

        def audio_thread():
            with sd.InputStream(
                device=self.select_device,
                channels=1,
                callback=audio_callback,
                blocksize=1024,
                samplerate=16000,
            ):
                while not self.stop_event.is_set():
                    sd.sleep(100)

        self.stop_event.clear()
        threading.Thread(target=audio_thread, daemon=True).start()

    def stop_audio_stream(self):
        sd.stop()
        self.stop_event.set()

    def on_select_device(self, e):
        index = int(self.device_list.value)
        selected_device = self.device_list.options[index]
        device_info = self.devices[index]
        self.select_device = device_info["index"]
        self.device_detail.value = (
            f"Selected Device: {selected_device.text}\n"
            f"Max Input Channels: {device_info['max_input_channels']}\n"
            f"Max Output Channels: {device_info['max_output_channels']}\n"
            f"Sample Rate: {device_info['default_samplerate']}"
        )
        self.volume_bar.value = 0
        self.page.update()
        self.stop_audio_stream()
        time.sleep(1)
        self.start_audio_stream()

    def fab_pressed(self, e):
        if self.button_status == False:
            print("start")
            self.button_status = True
            self.page.floating_action_button.icon = ft.icons.PLAY_DISABLED
            self.page.floating_action_button.update()
            self.sound_transcribe.sound_transcribe()
        else:
            print("end")
            self.button_status = False
            self.page.floating_action_button.icon = ft.icons.PLAY_ARROW
            self.page.floating_action_button.update()
            self.sound_transcribe.close_sound()

    def refresh_device(self, e):
        self.devices = [
            d
            for d in sd.query_devices()
            if d["max_output_channels"] > 0 or d["max_input_channels"] > 0
        ]
        self.device_list.options = [
            ft.dropdown.Option(index, d["name"]) for index, d in enumerate(self.devices)
        ]
        self.device_list.update()
        self.stop_audio_stream()
        time.sleep(1)
        self.start_audio_stream()

    def add_text(self, text):
        self.text_count += text
        self.sound_text.value = self.text_count
        self.sound_text.update()

    def add_row(self):
        self.text_count = ""
        self.sound_text = ft.Text(selectable=True)
        self.list_view.controls.append(self.sound_text)
        self.translation_text_count = ""
        self.translation_text = ft.Text(selectable=True)
        self.translation_list_view.controls.append(self.translation_text)
        self.page.update()

    def add_translation(self, text):
        self.translation_text_count += text
        self.translation_text.value = self.translation_text_count
        self.translation_text.update()


if __name__ == "__main__":
    FletMain()
