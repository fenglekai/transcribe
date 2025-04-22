import { useState, useCallback, useEffect, useRef } from "react";
import { Card, Col, Row, Select } from "antd";
import { mediaDevicesType, WatchMediaDevices } from "../hook/AudioRTC";
import { useWorker } from "../hook/useWorker";

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

  const textCardRef = useRef<HTMLDivElement>(null);

  const handleStop = () => {
    webWorker.postMessage({ clean: true });
    watchMediaDevices.stopWatch();
  };

  const setTranscribe = useCallback(
    (event: {
      data: {
        status: boolean;
        text: string;
        translation: string;
        error: unknown;
      };
    }) => {
      const data = event.data;
      if (data.status) {
        setMessage((msg) => {
          // 处理data为空的情况
          if (!data.text || /\s/.test(data.text)) {
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
            msg.length = 0;
            return msg;
          }
          return msg.concat({
            key: msg.length,
            text: data.text,
          });
        });
        if (textCardRef.current) {
          textCardRef.current.scrollTo({
            top: textCardRef.current.scrollHeight,
            behavior: "auto",
          });
        }
        // setTranslationRender((preTranslation) =>
        //   preTranslation.concat({
        //     key: preTranslation.length.toString(),
        //     text: message.translation,
        //   })
        // );
      } else {
        console.error(`WebWorker异常: ${data.error}`);
        handleStop();
        props.errorCallback && props.errorCallback();
      }
    },
    [props]
  );

  const webWorker = useWorker(setTranscribe);

  const handleTranslationChange = (value: string) => {
    setTranslationType(value);
  };

  const handleSelect = async () => {
    try {
      await watchMediaDevices.selectDisplayMedia((blob) => {
        webWorker.postMessage({ wavBlob: blob, translationType });
      });
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
      webWorker.postMessage({ clean: true });
      webWorker.postMessage({ start: true });
      handleSelect();
    } else {
      handleStop();
    }
  }, [props.watch, webWorker]);

  return (
    <Row gutter={12}>
      <Col span={24}>
        <Select
          disabled={props.watch}
          defaultValue="zh2en"
          style={{ width: 120, marginBottom: 20 }}
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
            return <p style={{ margin: 0 }}>{item.text}</p>;
          })}
          <p style={{ margin: 0 }}>
            {message.map((item) => {
              return <span key={item.key}>{item.text}</span>;
            })}
          </p>
        </Card>
      </Col>
      <Col span={12}>
        <Card style={{ height: 260, overflow: "auto" }}>
          <p style={{ margin: 0 }}>
            {translationRender.map((item) => (
              <span key={item.key}>{item.text}</span>
            ))}
          </p>
        </Card>
      </Col>
    </Row>
  );
}
