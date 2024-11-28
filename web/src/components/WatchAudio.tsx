import { useState, useCallback, useEffect } from "react";
import { Input, Select } from "antd";
import { mediaDevicesType, WatchMediaDevices } from "../hook/AudioRTC";
import { useWorker } from "../hook/useWorker";

const { TextArea } = Input;

let watchFrame: number;

export default function WatchAudio(props: {
  type: mediaDevicesType;
  watch: boolean;
  errorCallback?: (error: unknown) => void;
}) {
  const [watchMediaDevices] = useState(new WatchMediaDevices(props.type));
  const [textRender, setTextRender] = useState("");
  const [translationRender, setTranslationRender] = useState("");
  const [translationType, setTranslationType] = useState("zh2en");
  const webWorker = useWorker((event) => {
    const message = event.data;
    if (message.status) {
      setTextRender(message.text);
      setTranslationRender(message.translation);
    }
  });

  const handleStop = useCallback(() => {
    watchMediaDevices.stopWatch();
    cancelAnimationFrame(watchFrame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTranslationChange = (value: string) => {
    setTranslationType(value);
  };

  const handleSelect = async () => {
    try {
      await watchMediaDevices.selectDisplayMedia((sound) => {
        if (!sound) {
          webWorker.postMessage({ addRow: true });
        }
      });
    } catch (error) {
      console.warn(error);
    }
  };

  const watchLoop = () => {
    if (watchMediaDevices.getChunksLength() > 0) {
      
      const wavBlob = watchMediaDevices.getRecordedChunks();
      webWorker.postMessage({
        wavBlob,
        translationType,
      });
    }
    watchFrame = requestAnimationFrame(watchLoop);
  };
  watchFrame = requestAnimationFrame(watchLoop);

  useEffect(() => {
    if (props.watch) {
      setTextRender("");
      setTranslationRender("");
      webWorker.postMessage({ clean: true });
      handleSelect();
    } else {
      handleStop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleStop, props.watch, webWorker]);

  return (
    <>
      <TextArea
        value={textRender}
        placeholder={props.type === "display" ? "标签页音频" : "麦克风"}
        autoSize={{ minRows: 12, maxRows: 15 }}
      />
      <div style={{ marginTop: "20px" }}>
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
        <TextArea
          style={{ marginTop: "12px" }}
          value={translationRender}
          placeholder="实时翻译"
          autoSize={{ minRows: 12, maxRows: 15 }}
        />
      </div>
    </>
  );
}
