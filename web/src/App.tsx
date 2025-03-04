import { useState } from "react";
import "./App.css";
import RecordButton, { Result } from "./components/RecordButton";
import UploadButton from "./components/UploadButton";
import RealTimeWatch from "./components/RealTimeWatch";
import { Divider, List, Typography, Collapse, Tabs } from "antd";
import type { TabsProps } from 'antd';

function AudioRTC() {
  const [list, setList] = useState<Result[]>([]);
  const onResult = (result: Result) => {
    setList((prev) => [...prev, result]);
  };

  return (
    <>
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
                              title={<span>{segment.seek}</span>}
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
    </>
  );
}

function App() {

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: '实时识别',
      children: <RealTimeWatch />,
    },
    {
      key: '2',
      label: '录音识别',
      children: <AudioRTC />,
    },

  ];

  return (
    <div className="App">
      <Tabs defaultActiveKey="1" items={items} animated />
      
      
    </div>
  );
}

export default App;
