import { fetchSpeedToText, fetchTranslation } from "./service";
import WebSocketService from "../utils/websocket";

let loopStatus = false;
let translationType = "zh2en";
let wavBlob = null;

self.addEventListener("message", async (event) => {
  const { clean, start, wavBlob: wb } = event.data;
  if (start) return startMark();
  if (clean) return cleanMark();
  if (wb) {
    wavBlob = wb;
  }
});

// 开始标识
const startMark = () => {
  loopStatus = true;
  wsService.connect("ws://localhost:9090/web/soundDevice");
  requestAnimationFrame(loop);
};

// 清空标识
const cleanMark = () => {
  loopStatus = false;
  wsService.disconnect();
};

// 错误返回
const errorCallback = (error) => {
  cleanMark();
  self.postMessage({
    status: false,
    error: String(error),
  });
};

// 循环识别请求
const loop = async () => {
  if (!loopStatus) return;
  try {
    if (!wavBlob) {
      return requestAnimationFrame(loop);
    }

    wsService.sendMessage(wavBlob);
    wavBlob = null;
    wsService.ws.onmessage = (event) => {
      const res = event.data;
      try {
        const json = JSON.parse(res);
        self.postMessage({
          status: true,
          text: json[0].text,
        });
      } catch (error) {
        console.error(error);
      }
    };
  } catch (error) {
    errorCallback(error);
  }
  requestAnimationFrame(loop);
};

// 语音识别
const wsService = WebSocketService.getInstance();

const transcribe = async (wavBlob) => {
  const res = await fetchSpeedToText(wavBlob);
  const { text } = res.data;
  return text;
};

// 翻译
const translationText = async (text) => {
  if (!text) {
    console.warn("没有获取到文本");
    return "";
  }
  const res = await fetchTranslation(translationType, text);
  const { translation } = res.data;
  return translation;
};
