import { useState } from "react";
import "./App.css";
import RecordButton, { Result } from "./components/RecordButton";
import UploadButton from "./components/UploadButton";
import WatchAudio from "./components/WatchAudio";
import { Divider, List, Typography, Collapse } from "antd";

function App() {
  const [list, setList] = useState<Result[]>([]);

  const onResult = (result: Result) => {
    setList((prev) => [...prev, result]);
  };

  return (
    <div className="App">
      <RecordButton onResult={onResult} />
      <Divider orientation="left">上传文件</Divider>
      <UploadButton onResult={onResult} />

      <Divider orientation="left">识别记录</Divider>
      <List
        bordered
        dataSource={list}
        renderItem={(item, index) => (
          <List.Item style={{ justifyContent: "flex-start" }}>
            {/* 序号 */}
            <span>[{index + 1}]</span>
            {/* 耗时 */}
            <Typography.Text mark style={{ margin: "0 6px" }}>
              识别耗时：{item.transcribe_time}s
            </Typography.Text>
            {/* 内容 */}
            {/* <span style={{ margin: '0 6px' }}>{item.text}</span> */}
            <Collapse
              items={[
                {
                  key: "1",
                  label: item.text,
                  children: (
                    <>
                      <span>识别语言：{item.result?.language}</span>
                      <List
                        itemLayout="horizontal"
                        dataSource={item.result?.segments}
                        renderItem={(segment) => (
                          <List.Item>
                            <List.Item.Meta
                              title={
                                <span>{segment.seek}</span>
                              }
                              description={segment.text}
                            />
                            <span>开始时间：{segment.start.toFixed(2)}</span>
                            <span>结束时间：{segment.end.toFixed(2)}</span>
                          </List.Item>
                        )}
                      />
                    </>
                  ),
                },
              ]}
            />
          </List.Item>
        )}
      />
      <Divider orientation="left">实时监听</Divider>
      <WatchAudio />
    </div>
  );
}

export default App;
