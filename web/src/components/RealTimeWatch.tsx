import { useState } from "react";
import { Button, Col, Row, Typography } from "antd";
import WatchAudio from "./WatchAudio";
const { Title } = Typography;
export default function WatchButton() {
  const [watchMicrophone, setWatchMicrophone] = useState(false);
  const [watchDisplay, setWatchDisplay] = useState(false);

  return (
    <>
      <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
        麦克风
      </Title>
      <Button
        color="primary"
        disabled={watchMicrophone}
        onClick={() => setWatchMicrophone(true)}
      >
        开始监听
      </Button>
      <Button
        danger
        disabled={!watchMicrophone}
        style={{ marginLeft: "12px" }}
        onClick={() => setWatchMicrophone(false)}
      >
        终止
      </Button>
      <div style={{ marginTop: "12px", marginBottom: "24px" }}>
        <WatchAudio
          type="microphone"
          watch={watchMicrophone}
          errorCallback={() => setWatchMicrophone(false)}
        ></WatchAudio>
      </div>
      <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
        标签页音频
      </Title>
      <Button
        color="primary"
        disabled={watchDisplay}
        onClick={() => setWatchDisplay(true)}
      >
        开始监听
      </Button>
      <Button
        danger
        disabled={!watchDisplay}
        style={{ marginLeft: "12px" }}
        onClick={() => setWatchDisplay(false)}
      >
        终止
      </Button>
      <div style={{ marginTop: "12px" }}>
        <WatchAudio
          type="display"
          watch={watchDisplay}
          errorCallback={() => setWatchDisplay(false)}
        ></WatchAudio>
      </div>
    </>
  );
}
