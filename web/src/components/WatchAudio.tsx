import { useState, useCallback, useEffect } from "react";
import { Button, Col, Row, Input } from "antd";
import { fetchSpeedToText } from "../sdk/service";
import { WatchChromeTag } from "../sdk/AudioRTC";

const { TextArea } = Input;

const watchChromeTag = new WatchChromeTag();

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
    try {
      await watchChromeTag.selectDisplayMedia((sound) => {
        if (!sound) {
          if (!addRowStatus) {
            text += "\n\n";
            translation += "\n\n";
            addRowStatus = true;
          }
          return console.log("not sound");
        }
      });
    } catch (error) {
      handleStop()
    }
  };

  const handleStop = () => {
    cancelAnimationFrame(fetchFrame);
    setWatch(false);
    watchChromeTag.stopWatch()
  };

  // 获取转换文本
  const fetchTranscribe = useCallback(async () => {
    try {
      if (watchChromeTag.getChunksLength() > 0) {
        const wavBlob = watchChromeTag.getRecordedChunks();
        const res = await fetchSpeedToText(wavBlob as Blob);
        const { text: t, translation: tlt } = res.data;
        if (watch) {
          text += t;
          translation += tlt;
          addRowStatus = false;
          setTextRender(text);
          setTranslationRender(translation);
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
