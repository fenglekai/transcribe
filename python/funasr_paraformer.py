import asyncio
import json
import os
from fastapi import WebSocket
import soundfile as sf
from model_path import funasr_path


class FunasrParaformer:
    def __init__(self):
        from funasr import AutoModel

        self.model = AutoModel(model=funasr_path, disable_update=True)
        self.queue = asyncio.Queue()
        self.chunk_size = [0, 10, 5]  # [0, 10, 5] 600ms, [0, 8, 4] 480ms
        self.encoder_chunk_look_back = (
            4  # number of chunks to lookback for encoder self-attention
        )
        self.decoder_chunk_look_back = (
            1  # number of encoder chunks to lookback for decoder cross-attention
        )

        self.chunk_stride = self.chunk_size[1] * 960  # 600ms
        self.cache = {}

    async def task_loop(self, queue: asyncio.Queue):
        while True:
            (speech, response_q) = await queue.get()

            res = self.paraformer(speech)
            await response_q.put(res)

    async def queue_paraformer(self, speech):
        response_q = asyncio.Queue()
        await self.queue.put((speech, response_q))
        output = await response_q.get()
        return output

    def paraformer(self, speech) -> str:
        total_chunk_num = int(len((speech) - 1) / self.chunk_stride + 1)
        join_res: str = ""
        for i in range(total_chunk_num):
            speech_chunk = speech[i * self.chunk_stride : (i + 1) * self.chunk_stride]
            is_final = i == total_chunk_num - 1
            res = self.model.generate(
                input=speech_chunk,
                cache=self.cache,
                is_final=is_final,
                chunk_size=self.chunk_size,
                encoder_chunk_look_back=self.encoder_chunk_look_back,
                decoder_chunk_look_back=self.decoder_chunk_look_back,
            )
            join_res += res[0]["text"]
        return join_res

    async def ws_paraformer(self, speech, websocket: WebSocket) -> str:
        total_chunk_num = int(len((speech) - 1) / self.chunk_stride + 1)
        for i in range(total_chunk_num):
            speech_chunk = speech[i * self.chunk_stride : (i + 1) * self.chunk_stride]
            is_final = i == total_chunk_num - 1
            res = self.model.generate(
                input=speech_chunk,
                cache=self.cache,
                is_final=is_final,
                chunk_size=self.chunk_size,
                encoder_chunk_look_back=self.encoder_chunk_look_back,
                decoder_chunk_look_back=self.decoder_chunk_look_back,
            )
            await websocket.send_text(json.dumps(res))


async def main():
    funasr = FunasrParaformer()
    wav_file = os.path.join(funasr.model.model_path, "example/asr_example.wav")
    speech, sample_rate = sf.read(wav_file)
    res = await funasr.queue_paraformer(speech)
    print(res)


if __name__ == "__main__":
    asyncio.run(main())
