import RecordRTC from "recordrtc";
import { getWaveBlob } from "webm-to-wav-converter";

// 分析声音波形
const hasSound = async (
  blob: Blob,
  callback: (hasSoundFlag: boolean) => void
) => {
  let hasSoundFlag = false;
  const audioContext = new AudioContext();
  // 将 Blob 转换为 AudioBuffer
  const reader = new FileReader();
  reader.onload = async (event) => {
    if (!event.target) return;
    if (!(event.target.result instanceof ArrayBuffer)) return;
    try {
      const audioBuffer = await audioContext.decodeAudioData(
        event.target.result
      );
      // 获取音频数据
      const channelData = audioBuffer.getChannelData(0);

      // 判断音频是否有波动
      const threshold = 0.01;
      for (let i = 0; i < channelData.length; i++) {
        if (Math.abs(channelData[i]) > threshold) {
          hasSoundFlag = true;
          break;
        }
      }
      callback(hasSoundFlag);
    } catch (error) {
      console.error("音频解码失败:", error);
    }
  };
  reader.onerror = (error) => {
    console.error("文件读取失败:", error);
  };
  reader.readAsArrayBuffer(blob);
};

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

export class WatchChromeTag {
  mediaStream!: MediaStream;
  mediaRecorder!: MediaRecorder;
  streamInterval!: string | number | NodeJS.Timeout;
  recordedChunks: Blob[];

  constructor() {
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
   * 触发显示媒体选择
   * @param callback 调用返回，sound是否有声音，wavBlob音频流
   */
  async selectDisplayMedia(callback: (sound: boolean, wavBlob: Blob) => void) {
    this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
      audio: { echoCancellation: true },
      video: {
        width: 320,
        height: 240,
        frameRate: 30,
      },
    });
    this.mediaRecorder = new MediaRecorder(this.mediaStream, {
      mimeType: "video/webm; codecs=pcm",
    });
    // 数据可用（录屏结束）时的回调
    this.mediaRecorder.ondataavailable = async (event) => {
      // 转换webm -> wav
      const wavBlob = await getWaveBlob(event.data, false);
      await hasSound(wavBlob, (sound) => {
        callback(sound, wavBlob);
        if (sound && wavBlob.size > 0) {
          console.log("has sound");
          this.recordedChunks.push(wavBlob);
        }
      });
    };
    this.mediaRecorder.start();
    // 设置定时器，每3秒发送一次数据
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
    this.streamInterval = setInterval(sendToServer, 3000);
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
