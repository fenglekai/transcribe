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
        sendText: Callable[[str], None],
        addRow: Callable[[], None],
        sendTranslation: Callable[[str], None],
    ):
        self.sendText = sendText  # 发送文本
        self.addRow = addRow  # 新增行
        self.sendTranslation = sendTranslation  # 新增行
        self.no_sound = 0  # 无声次数
        self.running = False  # 是否运行
        self.current_devices = None  # 当前使用设备
        self.transcribe_thread = None  # 音频转文本线程
        self.stop_event = threading.Event()
        # 参数配置
        self.RATE = 16000  # 采样率
        self.BLOCK_SIZE = 1024  # 分块大小
        self.CHANNELS = 1  # 单声道
        self.BLOCK_DURATION = 3  # 每段音频块持续时间（秒）
        self.D_TYPE = np.float32  # numpy.dtype
        self.VOLUME_THRESHOLD = 0.005  # 音量阈值（根据需要调整）
        self.audio_queue = queue.Queue()  # 源音频队列

    def monitor_devices(self):
        devices = sd.query_devices()
        for i, device in enumerate(devices):
            print(f"Index: {i}, Name: {device['name']}, Type: {device['hostapi']}")
        default_input_device = sd.default.device[0]
        default_output_device = sd.default.device[1]
        print(f"Default input device: {default_input_device}")
        print(f"Default output device: {default_output_device}")

    def compute_rms(self, audio_data):
        """计算音频数据的均方根值（RMS）"""
        return np.sqrt(np.mean(np.square(audio_data)))

    # 音频流回调函数
    def audio_callback(self, indata, frames, time, status):
        self.audio_queue.put(indata.copy())  # 放入队列

    # 音频转录函数
    def transcribe_audio(
        self,
    ):
            while self.running:
                audio_data = []
                for _ in range(int(self.RATE * self.BLOCK_DURATION / self.BLOCK_SIZE)):
                    audio_data.append(self.audio_queue.get())
                audio_data = (
                    np.concatenate(audio_data, axis=0).flatten().astype(self.D_TYPE)
                )

                # 检测音量，如果低于阈值则跳过转录
                rms_value = self.compute_rms(audio_data)
                if rms_value < self.VOLUME_THRESHOLD:
                    print("Sound is too low, skipping transcription.")
                    if self.no_sound < 1:
                        self.addRow()
                        self.no_sound += 1
                    continue  # 声音小，跳过此段音频的转录

                try:
                    data_bytes = audio_data.tobytes()
                    files = {
                        "audio": ("audio.wav", data_bytes, "application/octet-stream"),
                        "timestamp": (None, str(time.time())),
                    }
                    url = "http://localhost:9090/soundDevice"
                    headers = {"Content-Type": "application/octet-stream"}
                    response = requests.post(
                        url,
                        files=files
                    )
                    json_data = response.json()
                    text = json_data['text']
                    translation = json_data['translation']
                    if text != "" and text != "嗯":
                        self.sendText(text)
                        self.sendTranslation(translation)
                        self.no_sound = 0
                except Exception as e:
                    print(e)

    def sound_transcribe(self):
        self.running = True
        # 创建转录线程并监听
        self.stop_event.clear()
        self.transcribe_thread = threading.Thread(target=self.transcribe_audio)
        self.transcribe_thread.daemon = True
        self.transcribe_thread.start()

        # 监听系统音频（通过虚拟音频设备作为输入）
        stream = sd.InputStream(
            callback=self.audio_callback,
            channels=self.CHANNELS,
            samplerate=self.RATE,
            blocksize=self.BLOCK_SIZE,
            dtype=self.D_TYPE,
        )
        with stream:
            try:
                while self.running:
                    sd.sleep(int(self.BLOCK_DURATION * 1000))
            except KeyboardInterrupt:
                # 关闭音频流
                sd.stop()
                sys.exit()
                self.stop_event.set()

    def close_sound(self):
        self.running = False
        qsize = self.audio_queue.qsize()
        while not self.audio_queue.empty():
            self.audio_queue.get_nowait()
        sd.stop()
        self.stop_event.set()


def callbackText(text):
    pass


def callbackRow():
    pass


if __name__ == "__main__":
    sound = SoundTranscribe(callbackText, callbackRow)
    # sound.sound_transcribe()
    sound.monitor_devices()
