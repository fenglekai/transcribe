import os
import soundfile as sf


class FunasrParaformer:
    def __init__(self):
        from funasr import AutoModel
        source_model = "/home/bobby/.cache/modelscope/hub/iic/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online"

        self.model = AutoModel(model=source_model, disable_update=True)
        self.chunk_size = [0, 10, 5]  # [0, 10, 5] 600ms, [0, 8, 4] 480ms
        self.encoder_chunk_look_back = (
            4  # number of chunks to lookback for encoder self-attention
        )
        self.decoder_chunk_look_back = (
            1  # number of encoder chunks to lookback for decoder cross-attention
        )

        self.chunk_stride = self.chunk_size[1] * 960  # 600ms
        self.cache = {}

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
            print(res)

        return join_res


if __name__ == "__main__":
    funasr = FunasrParaformer()
    wav_file = os.path.join(funasr.model.model_path, "example/asr_example.wav")
    speech, sample_rate = sf.read(wav_file)
    funasr.paraformer(speech)
