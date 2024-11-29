import asyncio
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM


class NlpTranslation:
    def __init__(self, nlp_path=None):
        self.queue = asyncio.Queue()
        self.tokenizer = AutoTokenizer.from_pretrained(nlp_path, local_files_only=True)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(
            nlp_path, local_files_only=True
        )
        # asyncio.create_task(self.task_loop(self.queue))

    async def task_loop(self, queue: asyncio.Queue):
        while True:
            (input_sequence, response_q) = await queue.get()

            res = self.translation(input_sequence)
            await response_q.put(res)

    async def queue_translation(self, input_sequence=None):
        response_q = asyncio.Queue()
        await self.queue.put((input_sequence, response_q))
        output = await response_q.get()
        return output
    
    def translation(self, input_sequence=None):
        if isinstance(input_sequence, str):
            input_sequence = [input_sequence]
        translated = self.model.generate(
            **self.tokenizer(input_sequence, return_tensors="pt", padding=True)
        )
        res = [
            self.tokenizer.decode(t, skip_special_tokens=True) for t in translated
        ]

        return res[0]


async def main():
    nlp = NlpTranslation(nlp_path="Helsinki-NLP/opus-mt-zh-en")
    # input_sequence = "声明补充说，沃伦的同事都深感震惊，并且希望他能够投案自首。"
    # input_sequence = "The statement added that all of Warren's colleagues were deeply shocked and hoped that he would be able to turn himself in."
    input_sequence = "我"
    res = await nlp.queue_translation(input_sequence)
    print(res)


if __name__ == "__main__":
    asyncio.run(main())
