import { useState } from "react";
import { Button, Upload } from "antd";
import type { GetProp, UploadFile, UploadProps } from "antd";
import AudioAI from "../hook/AudioAI";

type Result = {
  text: string;
  result: null;
  transcribe_time?: number;
};

type Props = {
  onResult?: (result: Result) => void;
};

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

const audioAI = new AudioAI();

export default function UploadButton(props: Props) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append("files[]", file as FileType);
    });
    setUploading(true);
    try {
      const response = await audioAI.toText(fileList[0] as FileType);
      props.onResult?.(response);
      setFileList([]);
    } catch (error) {
      props.onResult?.({ text: `${error}`, result: null });
    } finally {
      setUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      setFileList([file]);

      return false;
    },
    fileList,
    maxCount: 1,
  };

  return (
    <>
      <Upload {...uploadProps}>
        <Button>选择文件</Button>
      </Upload>
      <Button
        type="primary"
        onClick={handleUpload}
        disabled={fileList.length === 0}
        loading={uploading}
        style={{ marginTop: 16 }}
      >
        {uploading ? "上传中" : "开始上传"}
      </Button>
    </>
  );
}
