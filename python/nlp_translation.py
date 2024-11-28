from transformers import AutoTokenizer, AutoModelForSeq2SeqLM


class NlpTranslation:
    def __init__(self, nlp_path=None):
        self.tokenizer = AutoTokenizer.from_pretrained(nlp_path, local_files_only=True)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(nlp_path, local_files_only=True)

    def translation(self, input_sequence=None):
        if isinstance(input_sequence, str):
            input_sequence = [input_sequence]
        translated = self.model.generate(**self.tokenizer(input_sequence, return_tensors="pt", padding=True))
        res = [self.tokenizer.decode(t, skip_special_tokens=True) for t in translated]
        return res[0]


if __name__ == "__main__":
    nlp = NlpTranslation()
    # input_sequence = "声明补充说，沃伦的同事都深感震惊，并且希望他能够投案自首。"
    input_sequence = "The statement added that all of Warren's colleagues were deeply shocked and hoped that he would be able to turn himself in."
    res = nlp.translation(input_sequence)
    print(res)
