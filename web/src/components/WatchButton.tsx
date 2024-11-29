import { useState } from "react";
import { Button, Col, Row } from "antd";
import WatchAudio from "./WatchAudio";

export default function WatchButton() {
  const [watchMicrophone, setWatchMicrophone] = useState(false);
  const [watchDisplay, setWatchDisplay] = useState(false);

  return (
    <>
      <Row gutter={12}>
        <Col span={12}>
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
          <div style={{ marginTop: "12px" }}>
            <WatchAudio
              type="microphone"
              watch={watchMicrophone}
              errorCallback={() => setWatchMicrophone(false)}
            ></WatchAudio>
          </div>
        </Col>
        <Col span={12}>
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
        </Col>
      </Row>
    </>
  );
}
