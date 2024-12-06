const AudioRecorder = require('node-audiorecorder')
import { AudioPipelineInputs } from '@huggingface/transformers'
import Transformer from './tramsformers'

class Audio {
  // 配置选项
  options = {
    program: 'rec', // 使用 'rec' 程序
    device: null, // 使用默认设备
    bits: 16, // 采样大小
    channels: 1, // 单声道
    encoding: 'signed-integer', // 编码类型
    rate: 16000, // 采样率
    type: 'wav', // 文件类型
    silence: 2, // 停止录制前的静音持续时间
    thresholdStart: 0.5, // 开始录制的静音阈值
    thresholdStop: 0.5, // 停止录制的静音阈值
    keepSilence: true // 是否保留录音中的静音部分
  }
  stream!: AudioPipelineInputs
  transformer = new Transformer()

  async createRecorder(): Promise<AudioPipelineInputs | null> {
    try {
      await this.transformer.initClassifier()
    } catch (error) {
      console.log(error)
      return null
    }
    // 创建一个音频录制器实例
    const audioRecorder = new AudioRecorder(this.options, console)

    // 开始录制
    audioRecorder.start()

    // 停止录制
    // audioRecorder.stop();

    // 获取录音流
    this.stream = audioRecorder.stream()
    this.transformer.transcribe(this.stream)
    // 你可以将录音流保存到文件或进行其他处理
    return this.stream
  }
}

export default Audio
