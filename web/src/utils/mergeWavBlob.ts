// 获取音频文件的 ArrayBuffer
async function getAudioBuffer(audioContext: AudioContext, blob: Blob) {
  const arrayBuffer = await blob.arrayBuffer();

  return await audioContext.decodeAudioData(arrayBuffer);
}

// 合并音频缓冲区
function mergeAudioBuffers(
  audioContext: AudioContext,
  audioBuffers: AudioBuffer[]
) {
  const sampleRate = audioBuffers[0].sampleRate;
  const numberOfChannels = Math.max(
    ...audioBuffers.map(
      (buffer: { numberOfChannels: any }) => buffer.numberOfChannels
    )
  );
  const totalLength = audioBuffers.reduce(
    (total, buffer) => total + buffer.length,
    0
  );

  const mergedBuffer = audioContext.createBuffer(
    numberOfChannels,
    totalLength,
    sampleRate
  );
  let offset = 0;

  audioBuffers.forEach(
    (buffer: {
      numberOfChannels: number;
      getChannelData: (arg0: number) => any;
      length: number;
    }) => {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = mergedBuffer.getChannelData(channel);
        const sourceData = buffer.getChannelData(channel);
        channelData.set(sourceData, offset);
      }
      offset += buffer.length;
    }
  );

  return mergedBuffer;
}

// 将合并后的音频缓冲区转换为 WAV 文件
function audioBufferToWav(buffer: AudioBuffer) {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const numFrames = buffer.length;
  const bytesPerSample = 2; // 16-bit PCM
  const bytesPerSecond = sampleRate * numChannels * bytesPerSample;
  const dataLength = numFrames * numChannels * bytesPerSample;
  const headerLength = 44; // WAV header length
  const totalLength = headerLength + dataLength;

  const bufferData = new ArrayBuffer(totalLength);
  const view = new DataView(bufferData);

  // Write the WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF"); // ChunkID
  view.setUint32(4, totalLength - 8, true); // ChunkSize
  writeString(8, "WAVE"); // Format
  writeString(12, "fmt "); // Subchunk1ID
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, bytesPerSecond, true); // ByteRate
  view.setUint16(32, numChannels * bytesPerSample, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, "data"); // Subchunk2ID
  view.setUint32(40, dataLength, true); // Subchunk2Size

  // Write the audio data
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < numFrames; i++) {
      const value = Math.max(-1, Math.min(1, channelData[i]));
      const int16Value = value < 0 ? value * 0x8000 : value * 0x7fff;
      view.setInt16(
        headerLength + i * 2 * numChannels + channel * 2,
        int16Value,
        true
      );
    }
  }

  return new Blob([bufferData], { type: "audio/wav" });
}

async function mergeAudios(blobs: Blob[]) {
  const audioContext = new AudioContext();
  const audioBuffers = await Promise.all(
    blobs.map((blob) => getAudioBuffer(audioContext, blob))
  );
  const mergedBuffer = mergeAudioBuffers(audioContext, audioBuffers);
  const wavBlob = audioBufferToWav(mergedBuffer);

  return wavBlob;
}

export default mergeAudios;
