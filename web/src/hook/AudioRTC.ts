import RecordRTC from "recordrtc";
import getWaveBlob from "../utils/wavBlobUtil";
import mergeAudios from "../utils/mergeWavBlob";

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
  sourceVideoBlob: Blob[];
  recordedChunks: Blob[];
  audioBlob: Blob | undefined;

  constructor(type: mediaDevicesType = "display") {
    this.type = type;
    this.sourceVideoBlob = [];
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
        video: true,
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
   * @param callback 回传Blob数据
   */
  async selectDisplayMedia(callback: (blob: Blob) => void) {
    this.mediaStream = await this.getTypeMediaDevices();
    this.mediaRecorder = new MediaRecorder(this.mediaStream, {
      mimeType: "video/webm; codecs=opus,vp8",
    });
    // 数据可用（录屏结束）时的回调
    this.mediaRecorder.ondataavailable = async (event) => {
      if (this.type === "display") {
        this.sourceVideoBlob.push(event.data);
      }
      // 转换webm -> wav
      try {
        const wavBlob = await getWaveBlob(event.data, false);
        this.recordedChunks.push(wavBlob);
        callback(wavBlob);
      } catch (error) {
        console.error(error)
      }
    };
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
    // this.mediaRecorder.start(600);
  }

  /**
   * 停止监听
   */
  async stopWatch() {
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
    if (this.recordedChunks.length > 0) {
      this.audioBlob = await mergeAudios(this.recordedChunks);
    }
    this.recordedChunks.length = 0;
  }

  async saveAudioFile() {
    if (!this.audioBlob) return;
    const url = URL.createObjectURL(this.audioBlob);
    // 创建一个 a 标签并设置属性
    const a = document.createElement("a");
    a.href = url;
    a.download = "tabs_audio.wave"; // 设置下载文件的文件名
    a.click(); // 触发点击事件，开始下载
    // 释放 URL 对象
    a.remove();
    URL.revokeObjectURL(url);
  }
}
