import time
import flet as ft
import numpy as np
import sounddevice as sd
from sound import SoundTranscribe


class FletMain:
    def __init__(self):
        self.page = None
        self.button_status = False
        self.sound_transcribe = SoundTranscribe(
            self.set_volume,
            self.add_text,
            self.add_row,
            self.add_translation,
        )
        self.devices = self.sound_transcribe.get_devices()
        self.device_list = ft.Dropdown(
            label="选择设备",
            options=[
                ft.dropdown.Option(index, d["name"])
                for index, d in enumerate(self.devices)
            ],
            on_change=self.handle_select_device,
            disabled=self.button_status,
        )
        self.volume_bar = ft.ProgressBar(width=200, value=0)
        self.device_select = ft.Row(
            [
                ft.Container(
                    content=self.device_list,
                    margin=10,
                    padding=10,
                    alignment=ft.alignment.center,
                    height=100,
                    border_radius=10,
                ),
                ft.Container(
                    content=ft.CupertinoButton(
                        content=ft.Text(
                            "刷新设备",
                        ),
                        opacity_on_click=0.3,
                        on_click=self.refresh_device,
                    ),
                    margin=10,
                    padding=10,
                    alignment=ft.alignment.center,
                    height=100,
                    border_radius=10,
                ),
                ft.Container(
                    content=self.volume_bar,
                    margin=10,
                    padding=10,
                    alignment=ft.alignment.center,
                    height=100,
                    border_radius=10,
                ),
            ]
        )
        self.text_count = ""
        self.translation_text_count = ""

        self.list_view = ft.ListView(
            expand=1,
            spacing=10,
            auto_scroll=True,
            height=300,
        )
        self.sound_text = ft.Text(selectable=True)
        self.list_view.controls.append(self.sound_text)
        self.sound_container = ft.Container(
            expand=1,
            content=self.list_view,
            margin=10,
            padding=10,
            border=ft.border.all(1, ft.colors.GREY_300),
            border_radius=4,
            alignment=ft.alignment.top_left,
        )
        self.translation_text = ft.Text(selectable=True)
        self.translation_list_view = ft.ListView(
            expand=1,
            spacing=10,
            auto_scroll=True,
            height=300,
        )
        self.translation_list_view.controls.append(self.translation_text)
        self.translation_container = ft.Container(
            expand=1,
            content=self.translation_list_view,
            margin=10,
            padding=10,
            border=ft.border.all(1, ft.colors.GREY_300),
            border_radius=4,
            alignment=ft.alignment.top_left,
        )
        self.row = ft.Row(
            controls=[self.sound_container, self.translation_container],
        )
        # self.on_load()
        ft.app(self.flet_page)

    def flet_page(self, page: ft.Page):
        """Flet Page"""
        self.page = page
        page.title = "Less write realtime speech recognition"
        page.horizontal_alignment = ft.CrossAxisAlignment.CENTER
        page.auto_scroll = True
        page.scroll = ft.ScrollMode.HIDDEN

        # 窗口关闭事件
        page.window.prevent_close = True
        page.window.on_event = self.handle_window_event

        page.floating_action_button = ft.FloatingActionButton(
            icon=ft.icons.PLAY_ARROW,
            on_click=self.handle_play,
            bgcolor=ft.colors.CYAN_300,
        )
        page.add(self.device_select)
        page.add(self.row)

    def on_load(self):
        """页面加载完成后执行的逻辑"""
        print("on_load")
        print(sd.default.device[0])
        device_info = self.devices[sd.default.device[0]]
        self.sound_transcribe.set_stream(device_info["index"])

    def handle_window_event(self, e):
        if e.data == "close":
            # 用户尝试关闭窗口，弹出确认对话框
            print("close")
            self.sound_transcribe.close_sound()
            self.page.window.destroy()

    def set_volume(self, in_data, percent=1):
        """设置音量条"""
        try:
            volume_norm = np.linalg.norm(in_data) * percent
            self.volume_bar.value = min(1.0, volume_norm)
            self.volume_bar.update()
        except Exception as e:
            pass

    def handle_select_device(self, e):
        """选择设备事件"""
        self.sound_transcribe.close_sound()
        index = int(self.device_list.value)
        device_info = self.devices[index]
        self.sound_transcribe.set_stream(device_info["index"])
        self.volume_bar.value = 0
        self.page.update()
        time.sleep(1)

    def refresh_device(self, e):
        """刷新设备事件"""
        self.devices = self.sound_transcribe.get_devices()
        self.device_list.options = [
            ft.dropdown.Option(index, d["name"]) for index, d in enumerate(self.devices)
        ]
        self.device_list.update()
        time.sleep(1)

    def handle_play(self, e):
        """触发监听事件"""
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

    def add_text(self, text):
        """触发音频转译添加文本"""
        self.text_count += text
        self.sound_text.value = self.text_count
        self.sound_text.update()

    def add_row(self):
        """触发未监听到音频添加换行"""
        self.text_count = ""
        self.sound_text = ft.Text(selectable=True)
        self.list_view.controls.append(self.sound_text)
        self.translation_text_count = ""
        self.translation_text = ft.Text(selectable=True)
        self.translation_list_view.controls.append(self.translation_text)
        self.page.update()

    def add_translation(self, text):
        """触发翻译"""
        self.translation_text_count += text
        self.translation_text.value = self.translation_text_count
        self.translation_text.update()


if __name__ == "__main__":
    FletMain()
