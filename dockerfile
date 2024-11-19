FROM python:3.10.14

RUN mkdir /work_home
RUN mkdir -p /work_home/models/modelscope
RUN mkdir -p /work_home/models/whisper
COPY . /work_home

WORKDIR /work_home

RUN cd /work_home/python && pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

CMD ["python python/main.py"]