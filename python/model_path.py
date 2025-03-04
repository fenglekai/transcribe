import os
# dev
whisper_path = "medium"
funasr_path = "/home/iaisd/.cache/modelscope/hub/iic/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online"
sense_voice_path = "/home/iaisd/.cache/modelscope/hub/iic/SenseVoiceSmall"
# translation_zh2en_path = "/home/iaisd/.cache/modelscope/hub/iic/nlp_csanmt_translation_zh2en"
# translation_en2zh_path = "/home/iaisd/.cache/modelscope/hub/iic/nlp_csanmt_translation_en2zh"
translation_zh2en_path = "/home/iaisd/.cache/huggingface/hub/models--Helsinki-NLP--opus-mt-zh-en/snapshots/cf109095479db38d6df799875e34039d4938aaa6"
translation_en2zh_path = "/home/iaisd/.cache/huggingface/hub/models--Helsinki-NLP--opus-mt-en-zh/snapshots/408d9bc410a388e1d9aef112a2daba955b945255"

# prod
# script_directory = os.path.dirname(os.path.abspath(__file__))
# whisper_path = f"{script_directory}/models/whisper/medium"
# funasr_path = f"{script_directory}/models/hub/iic/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online"
# nlp_path = f"{script_directory}/models/hub/iic/nlp_csanmt_translation_zh2en"