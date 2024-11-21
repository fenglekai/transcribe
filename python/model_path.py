import os
# dev
whisper_path = "medium"
funasr_path = "/home/bobby/.cache/modelscope/hub/iic/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online"
nlp_path = "/home/bobby/.cache/modelscope/hub/iic/nlp_csanmt_translation_zh2en"

# prod
# script_directory = os.path.dirname(os.path.abspath(__file__))
# whisper_path = f"{script_directory}/models/whisper/medium"
# funasr_path = f"{script_directory}/models/hub/iic/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online"
# nlp_path = f"{script_directory}/models/hub/iic/nlp_csanmt_translation_zh2en"