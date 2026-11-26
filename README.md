# 灵巧手学习站

灵巧手（Sharpa Wave、无极 2）的学习笔记和论文索引站点。纯静态页面，无构建步骤、无依赖。

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

- `index.html`：首页，只放各页面的入口
- `papers.html` / `app.js`：文献库（搜索、按任务/按方法筛选、排序、星标/已读）
- `style.css`：所有页面共用的样式
- `compare.html`：无极 2 和 Sharpa Wave 两只手的区别
- `setup.html`：Sharpa 开箱、固定、接线、连电脑、关机
- `start.html`：只用手的入门五步（带打勾进度）
- `task-rotate.html`：任务 1，手里转圆柱（sharpa-rl-lab）：流程、观测和动作、奖励、真手准备、我们的进度
- `units.html`：单位（Hz、ms、度/弧度、速度/加速度）和 Sharpa Wave 的物理限制（关节范围、速度、力矩），带 Hz 换算和平滑过渡计算器
- `data/papers.json`：全部论文数据，页面唯一的数据来源
- `data/subtasks.json`：细分任务标签表（`key`、`name`、`plain`、`parent`），卡片上的任务标签和第二级筛选都从这里读

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
  "subtasks": ["rot_axis"],
  "mount": "fixed",
  "did": "大白话：这篇让手做了什么任务",
  "abstract": "英文摘要"
}
```

`cat` 取值：`survey` `rl` `grasp` `teleop` `human` `hardware` `tactile` `vla` `model`（基于模型的规划和控制）。
`star`：默认星标（`true` 的排在最前）。用户在页面上点的星存在浏览器 localStorage（`hand.stars`，文献库和任务页共用），覆盖这里的默认值；要固定下来，用文献库的“复制星标清单”拿到 id 列表，再改这个字段。
`tasks` 取值（可多个）：`rotate` `grasp` `tool` `bimanual` `daily` `none`，含义见 `app.js` 里的 `TASKS`。
`subtasks`（必填，可多个）：细分任务，取值必须是 `data/subtasks.json` 里的 `key`。筛选时，一篇论文也算进它细标签所属（`parent`）的粗任务。魔方的三个标签 `rubik_hand` `rubik_robot` `rubik_algo` 另外合成一个“魔方”入口。
`mount`（要不要机械臂）取值：`fixed`（手固定，只动手指）`mixed`（有的实验要臂、有的不要）`arm`（需要机械臂或人形机器人）`none`（没用真手做任务）。可选的 `mount_note` 写一句依据，比如“已核对原文：……”，会显示在卡片上。
`id`：有 arXiv 编号就写编号，链接由它生成；没有的写 `doi-` 加 DOI（小写，非字母数字和点换成 `-`），同时必须写 `url`（DOI 链接），卡片的“原文”链接指向它。
可选字段：`venue`（发表在哪，显示在卡片上）、`relevance`（和我们转圆柱的相关度：`high` `mid` `low`，不写就算“没标”）、`hand`、`real`、`sensing`、`verified_from`（标题作者从哪核对的）。`date` 可以只写年份 `YYYY`。
