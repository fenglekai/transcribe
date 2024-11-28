import { useState } from "react";
import { Button, Col, Row } from "antd";
import WatchAudio from "./WatchAudio";

export default function WatchButton() {
  const [watch, setWatch] = useState(false);

  return (
    <>
      <Button color="primary" disabled={watch} onClick={() => setWatch(true)}>
        开始监听
      </Button>
      <Button
        danger
        disabled={!watch}
        style={{ marginLeft: "12px" }}
        onClick={() => setWatch(false)}
      >
        终止
      </Button>
      <div style={{ marginTop: "12px" }}>
        <Row gutter={12}>
          <Col span={12}>
            <WatchAudio type="microphone" watch={watch} errorCallback={() => setWatch(false)}></WatchAudio>
          </Col>
          <Col span={12}>
            <WatchAudio type="display" watch={watch} errorCallback={() => setWatch(false)}></WatchAudio>
          </Col>
        </Row>
      </div>
    </>
  );
}
