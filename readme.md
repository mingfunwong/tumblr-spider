# tumblr-spider

Tumblr 视频下载。
![image](https://github.com/mingfunwong/tumblr-spider/raw/master/demo.jpg)

## Install

```
$ git clone https://github.com/mingfunwong/tumblr-spider.git
$ cd ./tumblr-spider
$ npm install
```

## Usage

### Windows

double click `run.cmd`

### Linux

`$ node index`

## Settings

1. 编辑 `user.txt` 文件加入你要下载视频的用户名，一行一个。
2. 编辑 `index.js` 的 THREADS 可以设置同时下载线程数，默认是 2。
3. 视频下载到 `./video` 目录。
4. 中国大陆无法直接访问 Tumblr，需要自备梯子。

## License

MIT © [mingfunwong](http://github.com/mingfunwong)
