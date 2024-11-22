import { useState, useCallback, useEffect } from "react";
import { Button, Col, Row, Input } from "antd";
import { fetchSpeedToText } from "../sdk/service";
import { getWaveBlob } from "webm-to-wav-converter";

const { TextArea } = Input;

let mediaStream: MediaStream | undefined;
let mediaRecorder: MediaRecorder | undefined;
const recordedChunks: Blob[] = [];
let streamInterval: string | number | NodeJS.Timeout | undefined;
let fetchFrame: number;
let text = "";
let translation = "";
let addRowStatus = true;

export default function WatchAudio() {
  const [watch, setWatch] = useState(false);
  const [textRender, setTextRender] = useState("");
  const [translationRender, setTranslationRender] = useState("");

  const handleStart = async () => {
    text = "";
    translation = "";
    addRowStatus = true;
    setWatch(true);
    handleSelectDisplayMedia();
  };

  const handleStop = () => {
    clearInterval(streamInterval);
    cancelAnimationFrame(fetchFrame);
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
    if (mediaRecorder) {
      if (mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
    }
    recordedChunks.length = 0;
    setWatch(false);
  };

  // 获取转换文本
  const fetchTranscribe = useCallback(async () => {
    try {
      if (recordedChunks.length > 0) {
        const wavBlob = recordedChunks.shift();
        const res = await fetchSpeedToText(wavBlob as Blob);
        const { text: t, translation: tlt } = res.data;
        if (watch) {
          text += t;
          translation += tlt;
          addRowStatus = false;
          setTextRender(text)
          setTranslationRender(translation)
        }
      }
      fetchFrame = requestAnimationFrame(fetchTranscribe);
    } catch (error) {
      console.error(error);
    }
  }, [watch]);

  useEffect(() => {
    if (watch) {
      fetchFrame = requestAnimationFrame(fetchTranscribe);
    }
  }, [watch, fetchTranscribe]);

  // 触发显示媒体选择
  const handleSelectDisplayMedia = async () => {
    try {
      mediaStream = await navigator.mediaDevices.getDisplayMedia({
        audio: { echoCancellation: true },
        video: {
          width: 320,
          height: 240,
          frameRate: 30,
        },
      });
      mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: "video/webm; codecs=pcm",
      });
      // 数据可用（录屏结束）时的回调
      mediaRecorder.ondataavailable = async (event) => {
        // 转换webm -> wav
        const wavBlob = await getWaveBlob(event.data, false);
        await hasSound(wavBlob, (sound) => {
          if (!sound) {
            if (!addRowStatus) {
              text += "\n\n";
              translation += "\n\n";
              addRowStatus = true;
            }
            return console.log("not sound");
          }
          console.log("has sound");
          if (wavBlob.size > 0) {
            recordedChunks.push(wavBlob);
          }
        });
      };
      mediaRecorder.start();
      // 设置定时器，每3秒发送一次数据
      const sendToServer = async () => {
        try {
          if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.start();
          }
        } catch (error) {
          handleStop();
        }
      };
      streamInterval = setInterval(sendToServer, 3000);
    } catch (error) {
      console.log(error);
    }
  };

  // 分析声音波形
  const hasSound = async (
    blob: Blob,
    callback: (hasSoundFlag: boolean) => void
  ) => {
    let hasSoundFlag = false;
    const audioContext = new AudioContext();
    // 将 Blob 转换为 AudioBuffer
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (!event.target) return;
      if (!(event.target.result instanceof ArrayBuffer)) return;
      try {
        const audioBuffer = await audioContext.decodeAudioData(
          event.target.result
        );
        // 获取音频数据
        const channelData = audioBuffer.getChannelData(0);

        // 判断音频是否有波动
        const threshold = 0.01;
        for (let i = 0; i < channelData.length; i++) {
          if (Math.abs(channelData[i]) > threshold) {
            hasSoundFlag = true;
            break;
          }
        }
        callback(hasSoundFlag);
      } catch (error) {
        console.error("音频解码失败:", error);
      }
    };
    reader.onerror = (error) => {
      console.error("文件读取失败:", error);
    };
    reader.readAsArrayBuffer(blob);
  };

  return (
    <>
      <Button color="primary" disabled={watch} onClick={handleStart}>
        开始监听
      </Button>
      <Button
        danger
        disabled={!watch}
        style={{ marginLeft: "12px" }}
        onClick={handleStop}
      >
        终止
      </Button>
      <div style={{ marginTop: "12px" }}>
        <Row gutter={16}>
          <Col span={12}>
            <TextArea
              value={textRender}
              placeholder="语言识别"
              autoSize={{ minRows: 12, maxRows: 15 }}
            />
          </Col>
          <Col span={12}>
            <TextArea
              value={translationRender}
              placeholder="翻译"
              autoSize={{ minRows: 12, maxRows: 15 }}
            />
          </Col>
        </Row>
      </div>
    </>
  );
}
