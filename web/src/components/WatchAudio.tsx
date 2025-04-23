import { useState, useEffect, useRef } from "react";
import { Button, Card, Col, Row, Select } from "antd";
import { mediaDevicesType, WatchMediaDevices } from "../hook/AudioRTC";
import WebSocketService from "../utils/websocket";

export interface DataItem {
  key: number;
  text: string;
}

export default function WatchAudio(props: {
  type: mediaDevicesType;
  watch: boolean;
  errorCallback?: () => void;
}) {
  const [watchMediaDevices] = useState(new WatchMediaDevices(props.type));
  const [textRender, setTextRender] = useState<DataItem[]>([]);
  const [message, setMessage] = useState<DataItem[]>([]);
  const [translationRender, setTranslationRender] = useState<DataItem[]>([]);
  const [translationType, setTranslationType] = useState("zh2en");
  const [videoUrl, setVideoUrl] = useState("");

  const textCardRef = useRef<HTMLDivElement>(null);
  const translationCardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const transcribeWs = new WebSocketService();
  const tranlationWs = new WebSocketService();

  const handleVideoDownload = () => {
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = "tabs_audio.webm";
    a.click();
    a.remove();
  };

  const handleStop = async () => {
    transcribeWs.disconnect();
    tranlationWs.disconnect();
    await watchMediaDevices.stopWatch();
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    if (watchMediaDevices.sourceVideoBlob.length > 0 && videoRef.current) {
      const mediaSource = new MediaSource();
      const newAudioUrl = URL.createObjectURL(mediaSource);
      console.log(newAudioUrl)
      setVideoUrl(newAudioUrl);
      videoRef.current.src = newAudioUrl;
      // 监听 sourceopen 事件
      mediaSource.addEventListener("sourceopen", () => {
        console.log("MediaSource is open");
        let sourceBuffer: SourceBuffer;
        const len = watchMediaDevices.sourceVideoBlob.length;
        let i = 0;
        // 添加 SourceBuffer
        const mimeType = "video/webm; codecs=opus,vp8";
        if (mediaSource.addSourceBuffer) {
          sourceBuffer = mediaSource.addSourceBuffer(mimeType);
          sourceBuffer.mode = "sequence"; // 设置为 sequence 模式
          sourceBuffer.appendWindowStart = 0;
          sourceBuffer.appendWindowEnd = Infinity;
        } else {
          console.error("MediaSource.addSourceBuffer is not supported");
          return;
        }

        // 监听 updateend 事件，表示数据已成功追加
        sourceBuffer.addEventListener("updateend", () => {
          console.log("SourceBuffer updateend");
          if (i < len - 1) {
            i++;
            loadSource(i);
          } else {
            mediaSource.endOfStream(); // 结束流
          }
        });

        // 监听 error 事件
        sourceBuffer.addEventListener("error", (event) => {
          console.error("SourceBuffer error:", event);
        });

        // 加载media源
        function loadSource(index: number) {
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
              const result = new Uint8Array(reader.result);
              sourceBuffer.appendBuffer(result);
            }
          };
          reader.readAsArrayBuffer(watchMediaDevices.sourceVideoBlob[index]);
        }
        loadSource(i);
      });
    }
  };

  const setTranscribe = (text: string) => {
    setMessage((msg) => {
      // 处理data为空的情况
      if (!text || /\s/.test(text)) {
        let combineText = "";
        msg.forEach((item) => {
          combineText += item.text;
        });
        setTextRender((preText) => {
          if (
            preText.length > 0 &&
            !preText[preText.length - 1].text &&
            !combineText
          )
            return preText;
          preText.push({
            key: preText.length,
            text: combineText,
          });
          return preText;
        });
        tranlationWs.sendMessage(
          JSON.stringify({ type: translationType, text: combineText })
        );
        msg.length = 0;
        return msg;
      }
      return msg.concat({
        key: msg.length,
        text: text,
      });
    });
  };

  const handleTranslationChange = (value: string) => {
    setTranslationType(value);
  };

  const handleSelect = async () => {
    try {
      await watchMediaDevices.selectDisplayMedia((blob) => {
        transcribeWs.sendMessage(blob);
      });
      transcribeWs.connect("ws://localhost:9090/web/soundDevice");
      tranlationWs.connect("ws://localhost:9090/web/translation");
      if (transcribeWs.ws) {
        transcribeWs.ws.onmessage = (event) => {
          const res = event.data;
          try {
            const json = JSON.parse(res);
            setTranscribe(json[0].text);
            if (textCardRef.current) {
              textCardRef.current.scrollTo({
                top: textCardRef.current.scrollHeight,
                behavior: "auto",
              });
            }
          } catch (error) {
            console.error(error);
          }
        };
      }
      if (tranlationWs.ws) {
        tranlationWs.ws.onmessage = (event) => {
          const res = event.data;
          try {
            const json = JSON.parse(res);
            setTranslationRender((preTranslation) =>
              preTranslation.concat({
                key: preTranslation.length,
                text: json["translation"],
              })
            );
            if (translationCardRef.current) {
              translationCardRef.current.scrollTo({
                top: translationCardRef.current.scrollHeight,
                behavior: "auto",
              });
            }
          } catch (error) {
            console.error(error);
          }
        };
      }
    } catch (error) {
      console.warn(error);
      props.errorCallback && props.errorCallback();
    }
  };

  useEffect(() => {
    if (props.watch) {
      textRender.length = 0;
      translationRender.length = 0;
      setTextRender(textRender);
      setTranslationRender(translationRender);
      handleSelect();
    } else {
      handleStop();
    }
  }, [props.watch]);

  return (
    <Row gutter={[12, 12]}>
      <Col
        span={24}
        style={{
          display: watchMediaDevices.audioBlob ? "flex" : "none",
          alignItems: "center",
        }}
      >
        {props.type === "display" ? (
          <>
            <video ref={videoRef} controls width={"50%"}></video>
            <Button
              type="primary"
              style={{ marginLeft: 20 }}
              onClick={handleVideoDownload}
            >
              下载视频
            </Button>
          </>
        ) : null}

        <Button
          type="primary"
          style={{ marginLeft: props.type === "display" ? 20 : 0 }}
          onClick={() => watchMediaDevices.saveAudioFile()}
        >
          下载音频
        </Button>
      </Col>
      <Col span={24}>
        <Select
          disabled={props.watch}
          defaultValue="zh2en"
          style={{ width: 120 }}
          onChange={handleTranslationChange}
          options={[
            { value: "zh2en", label: "中文 -> 英文" },
            { value: "en2zh", label: "英文 -> 中文" },
          ]}
        />
      </Col>

      <Col span={12}>
        <Card ref={textCardRef} style={{ height: 260, overflow: "auto" }}>
          {textRender.map((item) => {
            return (
              <p key={item.key} style={{ margin: 0 }}>
                {item.text}
              </p>
            );
          })}
          <p style={{ margin: 0 }}>
            {message.map((item) => {
              return <span key={item.key}>{item.text}</span>;
            })}
          </p>
        </Card>
      </Col>
      <Col span={12}>
        <Card
          ref={translationCardRef}
          style={{ height: 260, overflow: "auto" }}
        >
          {translationRender.map((item) => (
            <p key={item.key} style={{ margin: 0 }}>
              {item.text}
            </p>
          ))}
        </Card>
      </Col>
    </Row>
  );
}
