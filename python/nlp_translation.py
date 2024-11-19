# Chinese-to-English

# 温馨提示: 使用pipeline推理及在线体验功能的时候，尽量输入单句文本，如果是多句长文本建议人工分句，否则可能出现漏译或未译等情况！！！

from modelscope.pipelines import pipeline
from modelscope.utils.constant import Tasks
from model_path import nlp_path


class NlpTranslation:
    def __init__(self):
        self.pipeline_ins = pipeline(
            task=Tasks.translation, model=nlp_path, disable_update=True
        )

    def csanmt_translation(self, input_sequence):
        outputs = self.pipeline_ins(input=input_sequence)
        return outputs["translation"]


if __name__ == "__main__":
    nlp = NlpTranslation()
    input_sequence = "声明补充说，沃伦的同事都深感震惊，并且希望他能够投案自首。"
    res = nlp.csanmt_translation(input_sequence)
    print(
        res["translation"]
    )  # 'The statement added that Warren's colleagues were deeply shocked and expected him to turn himself in.'
