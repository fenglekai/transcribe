import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import type { LogEvent } from "@ffmpeg/ffmpeg";

const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.9/dist/esm";
const ffmpeg = new FFmpeg();

const fileLoad = (blob: Blob): Promise<FileReader> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader);
    };
    reader.readAsArrayBuffer(blob);
  });
};

const mergeVideo = async (data: Blob[]) => {
  ffmpeg.on("log", ({ message: msg }: LogEvent) => {
    console.log(msg);
  });
  if (!ffmpeg.loaded) {
    console.log("load ffmpeg-core");
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ),
    });
  }

  let concatStr = "";
  for (let i = 0; i < data.length; i++) {
    const blob = data[i];
    const reader = await fileLoad(blob);
    if (reader.result instanceof ArrayBuffer) {
      const buffer = new Uint8Array(reader.result);
      await ffmpeg.writeFile(`input${i}.webm`, buffer);
      concatStr += `file 'input${i}.webm'\n`;
    }
  }
  await ffmpeg.writeFile("videos.txt", `${concatStr}`);
  console.log(concatStr);
  

  await ffmpeg.exec([
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    "videos.txt",
    "-c",
    "copy",
    "output.webm",
  ]);

  const output = await ffmpeg.readFile("output.webm");
  return output;
};

export default mergeVideo;
