import sys
import time
import numpy as np
import uvicorn
import io
import librosa
import zhconv

from fastapi import FastAPI, File, Form, UploadFile
from whisper_model import WhisperModel
from funasr_paraformer import FunasrParaformer
from nlp_translation import NlpTranslation

app = FastAPI()

whisper = WhisperModel(model_name="medium")

funasr = FunasrParaformer()
nlp = NlpTranslation()


@app.post("/audioToText")
def audio_to_text(timestamp: str = Form(), audio: UploadFile = File()):
    # 读取字节流
    bt = audio.file.read()

    # 转为 BinaryIO
    memory_file = io.BytesIO(bt)

    # 获取音频数据
    data, sample_rate = librosa.load(memory_file)

    # 按照 16000 的采样率重采样
    resample_data = librosa.resample(data, orig_sr=sample_rate, target_sr=16000)

    transcribe_start_time = time.time()
    # 语音识别
    result = whisper.transcribe(resample_data)
    transcribe_end_time = time.time()

    convert_start_time = time.time()
    # 繁体转简体
    text = zhconv.convert(result["text"], "zh-hans")
    convert_end_time = time.time()

    print(text)

    return {
        "status": "ok",
        "text": text,
        "result": result,
        "transcribe_time": transcribe_end_time - transcribe_start_time,
        "convert_time": convert_end_time - convert_start_time,
    }


@app.post("/soundDevice")
def sound_device(timestamp: str = Form(), audio: UploadFile = File()):
    bt = audio.file.read()
    restored_array = np.frombuffer(bt, dtype=np.float32)

    transcribe_start_time = time.time()
    # 语音识别
    text = funasr.paraformer(restored_array)
    translation = nlp.csanmt_translation(text)
    transcribe_end_time = time.time()

    convert_start_time = time.time()
    # 繁体转简体
    text = zhconv.convert(text, "zh-hans")
    convert_end_time = time.time()

    print(text)

    return {
        "status": "ok",
        "text": text,
        "translation": translation,
        "transcribe_time": transcribe_end_time - transcribe_start_time,
        "convert_time": convert_end_time - convert_start_time,
    }


uvicorn.run(app, host="0.0.0.0", port=9090)