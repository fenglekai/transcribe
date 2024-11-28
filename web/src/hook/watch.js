import { fetchSpeedToText, fetchTranslation } from "./service";

class OutputText {
  text;
  translation;
  translationType;
  addRow;
  blobList;

  constructor() {
    this.text = "";
    this.translation = "";
    this.translationType = "";
    this.addRow = true;
    this.blobList = [];
  }

  addText(value) {
    this.text += value;
  }
  addTranslation(value) {
    this.translation += value;
  }
  cleanTextContent() {
    this.text = "";
  }
  cleanTranslationContent() {
    this.translation = "";
  }
  setTranslationType(value) {
    if (typeof value === "string") {
      this.translationType = value;
    } else {
      throw Error("设置translationType类型错误");
    }
  }
  setAddRow(value) {
    if (typeof value === "boolean") {
      this.addRow = value;
    } else {
      throw Error("设置addRow类型错误");
    }
  }
  appendBlob(blob) {
    if (blob instanceof Blob) {
      this.blobList.push(blob);
    } else {
      throw Error("设置blobList类型错误");
    }
  }
  getBlobListLength() {
    return this.blobList.length;
  }
  getBlob() {
    if (this.blobList.length > 0) {
      return this.blobList.shift();
    }
    throw Error("队列中没有音频");
  }
}

const outputText = new OutputText();
let frame;

self.addEventListener("message", async (event) => {
  const { wavBlob, translationType, clean, addRow } = event.data;
  // 清空标识
  if (clean) {
    outputText.cleanTextContent();
    outputText.cleanTranslationContent();
    cancelAnimationFrame(frame);
    return;
  }
  // 换行标识
  if (addRow && outputText.addRow) {
    outputText.addText("\n\n");
    outputText.addTranslation("\n\n");
    outputText.setAddRow(false);
    return;
  }
  if (!wavBlob) return;
  outputText.setAddRow(true);
  outputText.setTranslationType(translationType);
  outputText.appendBlob(wavBlob);
});

const loop = async () => {
  if (outputText.getBlobListLength() > 0) {
    const wavBlob = outputText.getBlob();
    const text = await transcribe(wavBlob);
    await translation(text);
    self.postMessage({
      status: true,
      text: outputText.text,
      translation: outputText.translation,
    });
  }
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);

const transcribe = async (wavBlob) => {
  try {
    const res = await fetchSpeedToText(wavBlob);
    const { text } = res.data;
    outputText.addText(text);
    const blobUrl = URL.createObjectURL(wavBlob);
    URL.revokeObjectURL(blobUrl);
    return text;
  } catch (error) {
    self.postMessage({
      status: false,
      error,
    });
  }
};

const translation = async (text) => {
  if (!text) return console.error("没有获取文本");
  const res = await fetchTranslation(outputText.translationType, text);
  const { translation } = res.data;
  outputText.addTranslation(translation);
};
