import asyncio
import time
import numpy as np
import uvicorn
import io
import librosa
import zhconv

from fastapi import FastAPI, File, Form, UploadFile
from pydantic import BaseModel
from whisper_model import WhisperModel
from funasr_paraformer import FunasrParaformer
from nlp_translation import NlpTranslation
from model_path import whisper_path, translation_zh2en_path, translation_en2zh_path


app = FastAPI()

whisper = WhisperModel(model_name=whisper_path)

funasr = FunasrParaformer()
zh2en = NlpTranslation(translation_zh2en_path)
en2zh = NlpTranslation(translation_en2zh_path)


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


@app.post("/web/soundDevice")
async def sound_device(timestamp: str = Form(), audio: UploadFile = File()):
    bt = audio.file.read()
    memory_file = io.BytesIO(bt)
    data, sample_rate = librosa.load(memory_file)
    resample_data = librosa.resample(data, orig_sr=sample_rate, target_sr=16000)

    transcribe_start_time = time.time()
    # 语音识别
    text = await funasr.queue_paraformer(resample_data)
    transcribe_end_time = time.time()

    return {
        "status": "ok",
        "text": text,
        "transcribe_time": transcribe_end_time - transcribe_start_time,
    }


@app.post("/python/soundDevice")
async def sound_device(timestamp: str = Form(), audio: UploadFile = File()):
    bt = audio.file.read()
    resample_data = np.frombuffer(bt, dtype=np.float32)

    transcribe_start_time = time.time()
    # 语音识别
    text = await funasr.queue_paraformer(resample_data)
    translation = ""
    if text != "":
        translation = await zh2en.queue_translation(text)
    transcribe_end_time = time.time()

    return {
        "status": "ok",
        "text": text,
        "translation": translation,
        "transcribe_time": transcribe_end_time - transcribe_start_time,
    }


class TranslationBody(BaseModel):
    type: str = None
    text: str = None


@app.post("/translation")
async def sound_device(item: TranslationBody):
    type = item.type
    text = item.text
    if type == None or text == None:
        return {"status": "error", "message": "没有收到参数"}
    transcribe_start_time = time.time()
    # 翻译
    translation = text
    if text != "":
        if type == "zh2en":
            translation = await zh2en.queue_translation(text)
        if type == "en2zh":
            translation = await en2zh.queue_translation(text)
    transcribe_end_time = time.time()

    return {
        "status": "ok",
        "text": text,
        "translation": translation,
        "transcribe_time": transcribe_end_time - transcribe_start_time,
    }


@app.on_event("startup")
async def startup_event():
    # 在应用启动时创建并启动异步任务
    asyncio.create_task(funasr.task_loop(funasr.queue))
    asyncio.create_task(zh2en.task_loop(zh2en.queue))
    asyncio.create_task(en2zh.task_loop(en2zh.queue))


uvicorn.run(app, host="0.0.0.0", port=9090)
