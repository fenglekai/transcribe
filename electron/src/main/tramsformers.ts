import {
  AudioPipelineInputs,
  AutomaticSpeechRecognitionOutput,
  AutomaticSpeechRecognitionPipeline,
  pipeline
} from '@huggingface/transformers'

class Transformer {
  classifier!: AutomaticSpeechRecognitionPipeline

  async initClassifier(): Promise<AutomaticSpeechRecognitionPipeline> {
    this.classifier = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny')
    return this.classifier
  }

  async transcribe(
    audio: AudioPipelineInputs
  ): Promise<AutomaticSpeechRecognitionOutput | AutomaticSpeechRecognitionOutput[]> {
    const result = await this.classifier(audio)
    return result
  }
}

export default Transformer
