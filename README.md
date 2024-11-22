
<div>
     <h1 align=center>Transcribe</h1>
     <p>fork: <a href="https://github.com/Mumujianguang/whisper-demo-for-web">whisper-demo-for-web</a></p>
     <p>基于 WebRCT + whisper 的语音识别 demo</p>
     <p>基于flet + modelscope 的实时语言识别与翻译</p>
<div>


## TODO

- 实时识别时，保存历史音频使用Whisper优化识别内容
- Flet客户端可以选择音频设备再监听（Electron/Node是否有选择音频设备的库）
- 语言角色识别



## 技术栈
web
- 构建工具：```vite```
- 框架：```React```
- 组件库：```antd```
- 语音采集：```recordrtc```, ```webm-to-wav-converter```
- 客户端生成：```flet```

python
- 服务器框架：```uvicorn```，```fastapi```
- 音频处理：```librosa```，```numpy```
- 字词转换：```zhconv```
- 语音采集：```soundfile```，```sounddevice```


## 运行

### 前端环境
```
cd ./web
pnpm install
pnpm run dev
```

### 服务端环境
```
cd ./python
pip install -r requirements.txt
python main.py
```

### 客户端环境
```
cd ./python
pip install -r requirements.txt
flet run flet_main.py
```

## 预览
在浏览器中访问 http://localhost:5173/

## 常见问题
1. 找不到动态链接库，我使用的是miniforge3，所以需要手动指定lib

     ```
     export LD_LIBRARY_PATH="/home/user/miniforge3/lib:$LD_LIBRARY_PATH"
     ```

     