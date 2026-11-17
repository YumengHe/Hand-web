# 灵巧手文献库

多指灵巧手（dexterous hand）方向的论文索引站点。纯静态页面，无构建步骤、无依赖。

## 启动

```bash
./serve.sh              # http://<host>:9004
PORT=9005 ./serve.sh    # 换端口
```

后台常驻：

```bash
nohup ./serve.sh > /tmp/hand-web.log 2>&1 &
```

## 结构

- `index.html` / `style.css` / `app.js`：文献库（搜索、按任务/按方法筛选、排序、收藏/已读）
- `compare.html`：无极 2 和 Sharpa Wave 两只手的区别
- `setup.html`：Sharpa 开箱、固定、接线、连电脑、关机
- `start.html`：只用手的入门五步（带打勾进度）
- `units.html`：单位（Hz、ms、度/弧度、速度/加速度）和 Sharpa Wave 的物理限制（关节范围、速度、力矩），带 Hz 换算和平滑过渡计算器
- `data/papers.json`：全部论文数据，页面唯一的数据来源

## 添加论文

在 `data/papers.json` 里追加一条：

```json
{
  "id": "2309.06440",
  "short": "LEAP Hand",
  "title": "...",
  "authors": ["..."],
  "date": "2023-09-12",
  "cat": "hardware",
  "star": false,
  "zh": "一句话中文导读",
  "tasks": ["rotate"],
  "mount": "fixed",
  "did": "大白话：这篇让手做了什么任务",
  "abstract": "英文摘要"
}
```

`cat` 取值：`survey` `rl` `grasp` `teleop` `human` `hardware` `tactile` `vla`。
`tasks` 取值（可多个）：`rotate` `grasp` `tool` `bimanual` `daily` `none`，含义见 `app.js` 里的 `TASKS`。
`mount`（要不要机械臂）取值：`fixed`（手固定，只动手指）`mixed`（有的实验要臂、有的不要）`arm`（需要机械臂或人形机器人）`none`（没用真手做任务）。可选的 `mount_note` 写一句依据，比如“已核对原文：……”，会显示在卡片上。
`id` 是 arXiv 编号，链接由它生成。“入门路线”的顺序在 `app.js` 顶部的 `ROUTE` 里。
