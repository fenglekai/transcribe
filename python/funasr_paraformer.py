from funasr import AutoModel
import os
import soundfile as sf


source_model = "/home/bobby/.cache/modelscope/hub/iic/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online"

model = AutoModel(model=source_model, disable_update=True)
chunk_size = [0, 10, 5]  # [0, 10, 5] 600ms, [0, 8, 4] 480ms
encoder_chunk_look_back = 4  # number of chunks to lookback for encoder self-attention
decoder_chunk_look_back = (
    1  # number of encoder chunks to lookback for decoder cross-attention
)

chunk_stride = chunk_size[1] * 960  # 600ms
cache = {}


def paraformer(speech):
    total_chunk_num = int(len((speech) - 1) / chunk_stride + 1)
    join_res = ""
    for i in range(total_chunk_num):
        speech_chunk = speech[i * chunk_stride : (i + 1) * chunk_stride]
        is_final = i == total_chunk_num - 1
        res = model.generate(
            input=speech_chunk,
            cache=cache,
            is_final=is_final,
            chunk_size=chunk_size,
            encoder_chunk_look_back=encoder_chunk_look_back,
            decoder_chunk_look_back=decoder_chunk_look_back,
        )
        join_res += res[0]["text"]
        print(res)

    return join_res


if __name__ == "__main__":
    wav_file = os.path.join(model.model_path, "example/asr_example.wav")
    speech, sample_rate = sf.read(wav_file)
    paraformer(speech)
