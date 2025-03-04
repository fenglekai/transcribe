import { useState, useCallback, useEffect } from "react";
import { Card, Col, Row, Select } from "antd";
import { mediaDevicesType, WatchMediaDevices } from "../hook/AudioRTC";
import { useWorker } from "../hook/useWorker";

export interface DataItem {
  key: string;
  text: string;
}

export default function WatchAudio(props: {
  type: mediaDevicesType;
  watch: boolean;
  errorCallback?: () => void;
}) {
  const [watchMediaDevices] = useState(new WatchMediaDevices(props.type));
  const [textRender, setTextRender] = useState<DataItem[]>([]);
  const [translationRender, setTranslationRender] = useState<DataItem[]>([]);
  const [translationType, setTranslationType] = useState("zh2en");

  const handleStop = useCallback(() => {
    webWorker.postMessage({ clean: true });
    watchMediaDevices.stopWatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTranscribe = useCallback(
    (event: {
      data: {
        status: boolean;
        text: string;
        translation: string;
        error: unknown;
      };
    }) => {
      const message = event.data;
      if (message.status) {
        setTextRender((preText) =>
          preText.concat({ key: preText.length.toString(), text: message.text })
        );
        // setTranslationRender((preTranslation) =>
        //   preTranslation.concat({
        //     key: preTranslation.length.toString(),
        //     text: message.translation,
        //   })
        // );
      } else {
        console.error(`WebWorker异常: ${message.error}`);
        handleStop();
        props.errorCallback && props.errorCallback();
      }
    },
    [handleStop, props]
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleStop, props.watch, webWorker]);

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
        <Card style={{ height: 260, overflow: "auto" }}>
          <p style={{ margin: 0 }}>
            {textRender.map((item) => {
              if (!item.text) {
                return '\n'
              }
              return <span key={item.key}>{item.text}</span>
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
