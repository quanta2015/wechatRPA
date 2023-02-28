# 使用说明


### 1. 基本RPA机器人 设置

1. 将虚拟机的分辨率设置到 `1680*998`
2. 将 windows 的放大倍率设置到 `100%`
3. 打开 微信客户端，并且点击右上角的放大到全屏
4. 点击订阅号，并且将订阅号列表的宽度拖动到最大
5. 点击订阅号某个新闻，并且将弹出的窗口拖动到右下角`边缘紧贴屏幕`。


### 2. 爬取每日新闻任务

```
cd d:\wechatRPA
node task.mjs
```

#### 3. 批量关注微信公众号
1. 运行下面程序关注新的公众号 N 个
2. 修改页面参数 (原来公众号总数 + 新增公众号数量)/14 + 1
3. 手工将运行过程中出错的图标通过 ocr 添加到数据库

```
cd d:\wechatRPA
node add.mjs
```

#### 4. 批量添加历史新闻
```
cd d:\wechatRPA
node history.mjs
```

#### 5. 导出现有关注订阅号列表
```
cd d:\wechatRPA
node list.mjs
```

#### 6. 重建图标数据库
```
cd d:\wechatRPA
node icon.mjs
```

#### 7. 修改图标数据库

1. 将 `err` 目录下的 `text` `json` `img` 中的文件改名，命名方式以 `数据列表长度+1`。
2. 将改名后的 `icon` 文件根据类型（服务号/订阅号）拷贝到 `icon/json/[0|1]` 下面【0：订阅号 1：服务号】。
3. 将 `text` 文件夹下的图片复制到 `PaddleOcr/text` 目录中。
4. 打开 `powershell` 窗口，输入命令 `run.bat` 或者 `python3 tools/infer/predict_system.py`。
5. 打开 `inference_results/results.txt `， 将内容复制并且粘贴到 `db.js` 对应的公众号数据列表。



