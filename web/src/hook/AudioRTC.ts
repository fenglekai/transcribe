import RecordRTC from "recordrtc";
import getWaveBlob from "../utils/wavBlobUtil";

export default class AudioRTC {
  stream!: MediaStream;

  recorder!: RecordRTC;

  /**
   * 开始录制
   */
  async startRecording() {
    if (!this.recorder) {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.recorder = new RecordRTC(this.stream, {
        type: "audio",
      });
    }

    this.recorder.startRecording();
  }

  /**
   * 结束录制
   * @returns
   */
  stopRecording(): Promise<Blob> {
    if (!this.recorder) {
      return Promise.reject("Recorder is not initialized");
    }
    this.stream.getTracks().forEach((track) => track.stop());
    return new Promise((resolve) => {
      this.recorder.stopRecording(() => {
        const blob = this.recorder.getBlob();

        resolve(blob);
      });
    });
  }

  /**
   * 获取 blob
   * @returns
   */
  getWaveBlob() {
    const blob = this.recorder.getBlob();

    return getWaveBlob(blob, false);
  }
}

export type mediaDevicesType = "display" | "microphone";

export class WatchMediaDevices {
  type!: mediaDevicesType;
  mediaStream!: MediaStream;
  mediaRecorder!: MediaRecorder;
  streamInterval!: string | number | NodeJS.Timeout;
  recordedChunks: Blob[];

  constructor(type: mediaDevicesType = "display") {
    this.type = type;
    this.recordedChunks = [];
  }

  /**
   * 获取音频队列长度
   * @returns recordedChunks数组长度
   */
  getChunksLength() {
    return this.recordedChunks.length;
  }

  /**
   * 获取音频块
   * @returns wavBlob
   */
  getRecordedChunks() {
    if (this.recordedChunks.length > 0) {
      return this.recordedChunks.shift();
    }
    throw Error("队列中没有音频");
  }

  /**
   * 根据type选择监听对象
   * @returns MediaStream 媒体流
   */
  async getTypeMediaDevices() {
    let stream;
    if (this.type === "display") {
      stream = await navigator.mediaDevices.getDisplayMedia({
        audio: { echoCancellation: true },
      });
    } else {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true },
      });
    }
    return stream;
  }

  /**
   * 触发显示媒体选择
   * @param callback 调用返回，sound是否有声音
   */
  async selectDisplayMedia(callback: (blob: Blob) => void) {
    this.mediaStream = await this.getTypeMediaDevices();
    this.mediaRecorder = new MediaRecorder(this.mediaStream, {
      mimeType: "video/webm; codecs=pcm",
    });
    // 数据可用（录屏结束）时的回调
    this.mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        // 转换webm -> wav
        const wavBlob = await getWaveBlob(event.data, false);
        // this.recordedChunks.push(wavBlob);
        callback(wavBlob);
      }
    };
    this.mediaRecorder.start();
    // 设置定时器，每600ms发送一次数据
    const sendToServer = async () => {
      try {
        if (this.mediaRecorder) {
          this.mediaRecorder.stop();
          this.mediaRecorder.start();
        }
      } catch (error) {
        this.stopWatch();
      }
    };
    this.streamInterval = setInterval(sendToServer, 600);
  }

  /**
   * 停止监听
   */
  stopWatch() {
    clearInterval(this.streamInterval);
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state === "recording") {
        this.mediaRecorder.stop();
      }
    }
    this.recordedChunks.length = 0;
  }
}
