import sys
import threading
import time
import sounddevice as sd
import numpy as np
import queue
from typing import Callable
import requests


class SoundTranscribe:
    def __init__(
        self,
        sound_callback: Callable[[any], None] | None,
        send_text: Callable[[str], None] | None,
        add_row: Callable[[], None] | None,
        send_translation: Callable[[str], None] | None,
    ):
        """声音转录
        sound_callback: input stream的返回数据in_data
        send_text: 转译的文本
        add_row: 未识别到声音换行
        send_translation: 翻译文本
        """
        self.sound_callback = sound_callback
        self.send_text = send_text
        self.add_row = add_row
        self.send_translation = send_translation
        self.no_sound = 0  # 无声次数
        self.running = False  # 是否运行
        self.current_devices = None  # 当前使用设备
        self.transcribe_thread = None  # 音频转文本线程
        self.stop_event = threading.Event()
        self.devices = sd.query_devices()

        # 参数配置
        self.RATE = 16000  # 采样率
        self.BLOCK_SIZE = 1024  # 分块大小
        self.CHANNELS = 1  # 单声道
        self.BLOCK_DURATION = 3  # 每段音频块持续时间（秒）
        self.D_TYPE = np.float32  # numpy.dtype
        self.VOLUME_THRESHOLD = 0.005  # 音量阈值（根据需要调整）
        self.audio_queue = queue.Queue()  # 源音频队列
        self.stream = sd.InputStream(
            callback=self.audio_callback,
            channels=self.CHANNELS,
            samplerate=self.RATE,
            blocksize=self.BLOCK_SIZE,
            dtype=self.D_TYPE,
        )

    def monitor_devices(self):
        """监控设备信息"""
        devices = sd.query_devices()
        for i, device in enumerate(devices):
            print(f"Index: {i}, Name: {device['name']}, Type: {device['hostapi']}")
        default_input_device = sd.default.device[0]
        default_output_device = sd.default.device[1]
        print(f"Default input device: {default_input_device}")
        print(f"Default output device: {default_output_device}")

    def get_devices(self):
        """获取设备"""
        self.devices = sd.query_devices()
        return self.devices

    def set_stream(self, device):
        """设置流媒体"""
        self.close_sound()
        self.stream = sd.InputStream(
            device=device,
            callback=self.audio_callback,
            channels=self.CHANNELS,
            samplerate=self.RATE,
            blocksize=self.BLOCK_SIZE,
            dtype=self.D_TYPE,
        )
        with self.stream:
            while True:
                sd.sleep(int(self.BLOCK_DURATION * 1000))

    def compute_rms(self, audio_data):
        """计算音频数据的均方根值（RMS）"""
        return np.sqrt(np.mean(np.square(audio_data)))

    def audio_callback(self, indata, frames, time, status):
        """音频流回调函数"""
        self.audio_queue.put(indata.copy())  # 放入队列
        self.sound_callback(indata)

    def transcribe_audio(
        self,
    ):
        """音频转录函数"""
        while self.running:
            audio_data = []
            for _ in range(int(self.RATE * self.BLOCK_DURATION / self.BLOCK_SIZE)):
                audio_data.append(self.audio_queue.get())
            audio_data = (
                np.concatenate(audio_data, axis=0).flatten().astype(self.D_TYPE)
            )

            # 检测音量，如果低于阈值则跳过转录
            # rms_value = self.compute_rms(audio_data)
            # if rms_value < self.VOLUME_THRESHOLD:
            #     print("Sound is too low, skipping transcription.")
            #     if self.no_sound < 1:
            #         self.add_row()
            #         self.no_sound += 1
            #     continue  # 声音小，跳过此段音频的转录

            try:
                data_bytes = audio_data.tobytes()
                files = {
                    "audio": ("audio.wav", data_bytes, "application/octet-stream"),
                    "timestamp": (None, str(time.time())),
                }
                url = "http://localhost:9090/python/soundDevice"
                response = requests.post(url, files=files)
                json_data = response.json()
                text = json_data["text"]
                translation = json_data["translation"]
                if text != "" and text != "嗯":
                    self.send_text(text)
                    self.send_translation(translation)
                    self.no_sound = 0
                else:
                    if self.no_sound < 1:
                        self.add_row()
                        self.no_sound += 1
            except Exception as e:
                print(e)

    def sound_transcribe(self):
        """开始转译"""
        self.running = True
        # 创建转录线程并监听
        self.stop_event.clear()
        self.transcribe_thread = threading.Thread(target=self.transcribe_audio)
        self.transcribe_thread.daemon = True
        self.transcribe_thread.start()

        # 监听系统音频（通过虚拟音频设备作为输入）
        try:
            with self.stream:
                while self.running:
                    sd.sleep(int(self.BLOCK_DURATION * 1000))
        except KeyboardInterrupt:
            # 关闭音频流
            sd.stop()
            sys.exit()
            self.stop_event.set()

    def close_sound(self):
        """关闭监听"""
        self.running = False
        self.stream.close()
        while not self.audio_queue.empty():
            self.audio_queue.get_nowait()
        sd.stop()
        self.stop_event.set()


def callbackText(text):
    pass


def callbackRow():
    pass


if __name__ == "__main__":
    sound = SoundTranscribe(callbackText, callbackText, callbackRow, callbackText)
    # sound.sound_transcribe()
    sound.monitor_devices()
