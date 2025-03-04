from model_path import sense_voice_path

class SenenVoiceParaformer:
    def __init__(self):
        from funasr import AutoModel

        self.model = AutoModel(model=sense_voice_path, trust_remote_code=True, device="cuda:0")

    def paraformer(self, speech):
        res = self.model.generate(
            input=speech,
            cache={},
            language="auto", # "zn", "en", "yue", "ja", "ko", "nospeech"
            use_itn=True,
            batch_size=64, 
        )
        print(res)
        return res