(function () {
  'use strict';

  var CATS = [
    { key: 'survey', name: '综述' },
    { key: 'rl', name: '强化学习与 Sim-to-Real' },
    { key: 'grasp', name: '灵巧抓取' },
    { key: 'teleop', name: '遥操作与数据采集' },
    { key: 'human', name: '从人类数据学习' },
    { key: 'hardware', name: '硬件设计' },
    { key: 'tactile', name: '触觉感知' },
    { key: 'vla', name: '模仿学习与基础模型' }
  ];
  var CAT_NAME = {};
  CATS.forEach(function (c) { CAT_NAME[c.key] = c.name; });

  // 每个方向的大白话说明
  var CAT_PLAIN = {
    survey: '别人替你把一大堆论文读完后写的总结。刚入门先看这个，知道这个领域都在做什么。',
    rl: '让机器人手在电脑里的虚拟世界反复试错、自己练会动作，再把练好的本事搬到真手上。难点是虚拟和现实总有差别。',
    grasp: '研究“这只手该怎么握住这个东西”。多数工作是先用算法算出海量握法，再训练模型看到物体就能给出握法。',
    teleop: '人戴手套或 VR 设备远程操纵机器人手，像操纵木偶。主要目的是录下示范动作，给机器人当教材。',
    human: '直接拿人手干活的视频或动作捕捉数据来教机器人，省掉遥操作。难点是人手和机器人手长得不一样。',
    hardware: '手本身怎么造：用什么电机、怎么传动、多少个关节、成本多少。你们已经有现成的手，这类可以少看。',
    tactile: '给手装上“触觉”，让它能感觉到碰到了什么、用了多大力，然后研究怎么利用这些感觉把活干得更细。',
    vla: '让机器人看人示范来学动作，以及训练能“看图、听懂指令、直接输出动作”的大模型。'
  };

  // 按“做了什么任务”分类
  var TASKS = [
    { key: 'rotate', name: '在手里转东西' },
    { key: 'grasp', name: '抓起来' },
    { key: 'tool', name: '用工具、拧、开合' },
    { key: 'bimanual', name: '两只手配合' },
    { key: 'daily', name: '日常杂活' },
    { key: 'none', name: '不针对具体任务' }
  ];
  var TASK_NAME = {};
  TASKS.forEach(function (t) { TASK_NAME[t.key] = t.name; });
  var TASK_PLAIN = {
    rotate: '不把东西放下，只靠手指把手里的物体转个方向，比如转方块、转笔、转球。只需要一只固定在桌上的手，不用机械臂。我们现在就能做，“入门五步”的第五步就是这个任务。',
    grasp: '看到一个物体，决定手指放在哪、怎么握，然后把它抓起来。多数工作需要机械臂把手送到物体旁边；只算“握法”的那部分可以在电脑里做。',
    tool: '用剪刀、螺丝刀、锤子，拧瓶盖，拧魔方，开合带关节的东西。难在既要握稳，又要让工具的一部分能动。有些只用手就能做，有些要机械臂。',
    bimanual: '一只手做不了、要两只手配合的任务，比如一只手扶着瓶子另一只手拧盖子，或者两只手之间递东西。我们有两只 Sharpa，但第二只是左手还是右手还没确认，两只都是右手的话有些任务做不了。',
    daily: '拿起放下、倒水、开门、叠毛巾这类一连串动作的生活任务。通常一篇文章做好几个，重点是方法通用，而不是某一个任务。基本都需要机械臂。',
    none: '综述、造手、造传感器这类文章。它们不解决某个具体任务，文中的任务只是用来展示“这东西能用”。'
  };

  // 按“手怎么装”分类：要不要机械臂
  var MOUNTS = [
    { key: 'fixed', name: '不需要机械臂' },
    { key: 'mixed', name: '有的要、有的不要' },
    { key: 'arm', name: '需要机械臂或人形机器人' },
    { key: 'none', name: '没用真手做任务' }
  ];
  var MOUNT_NAME = {};
  MOUNTS.forEach(function (m) { MOUNT_NAME[m.key] = m.name; });
  var MOUNT_PLAIN = {
    fixed: '手固定在支架上（或装在不动的臂上），只动手指就能完成。和我们现在把 Sharpa 立在底座上的摆法一样，这些文章里的任务我们现在就能照着做。',
    mixed: '多是造手的文章：有的演示是手单独固定着做的，有的装在机械臂上做。看原文时挑手固定的那部分。',
    arm: '手装在机械臂上，或者是人形机器人的手。臂负责把手送到物体旁边，没有臂做不了。',
    none: '纯仿真、数据集、综述，或者只研究传感器怎么感知。不用真手做任务，也就谈不上要不要臂。'
  };

  // 术语大白话：[中文名, 英文/缩写, 解释]
  var GLOSSARY = [
    ['灵巧手', 'dexterous hand', '像人手一样有好几根手指、每根手指有多个关节的机器人手。对比的是只有两片夹板、只会开合的“夹爪”。'],
    ['自由度', 'DoF', '能独立活动的关节数量。数字越大手越灵活，也越难控制。人手大约有二十多个。'],
    ['策略', 'policy', '机器人的“大脑程序”：输入它看到、感觉到的东西，输出下一步每个关节该怎么动。论文里说“训练一个策略”就是训练这个程序。'],
    ['强化学习', 'RL', '让机器人反复试错。做对了给奖励，做错了没有，试几百万次后它自己摸索出该怎么做。没有人教具体动作。'],
    ['模仿学习', 'IL', '人先示范很多遍，机器人学着照做。和强化学习相反：有人教，不靠自己试错。'],
    ['仿真到现实', 'sim-to-real', '先在电脑里的虚拟世界练（又快又不会弄坏机器），再搬到真机上用。虚拟和现实总有差别，这个差别叫 sim-to-real gap，是这个方向的核心难题。'],
    ['域随机化', 'domain randomization', '在虚拟世界训练时，故意把摩擦力、物体重量、电机力度等随机乱改。机器人见过各种情况后，到了真实世界就不容易出错。'],
    ['教师-学生蒸馏', 'teacher-student', '先训练一个“开卷考试”的老师：它在虚拟世界里能直接知道物体的精确位置等答案。再让只能用真实传感器的学生去模仿老师的动作。'],
    ['手内操作', 'in-hand manipulation', '不把东西放下，只靠手指把手里的物体转个方向或挪个位置。比如单手转笔、单手把钥匙调个头。'],
    ['遥操作', 'teleoperation', '人戴手套或 VR 头显，远程控制机器人手，像操纵木偶。主要用来录示范数据。'],
    ['重定向', 'retargeting', '把人手的姿势“翻译”成机器人手的姿势。因为两者手指长短、关节数量不一样，不能直接照抄。'],
    ['构型', 'embodiment', '机器人的身体长什么样。换一只不同的手就是换了构型，“跨构型”就是同一套方法能用在不同的手上。'],
    ['本体感知', 'proprioception', '机器人对自己身体的感觉：每个关节弯到多少度、电机用了多大力。就像你闭着眼也知道自己手指弯成什么样。'],
    ['触觉', 'tactile', '指尖或手掌上的传感器，能感觉到有没有碰到东西、碰在哪、用了多大力。'],
    ['直驱与腱驱动', 'direct-drive / tendon', '直驱是把电机直接装在关节上。腱驱动是电机装在手掌或前臂，用绳子拉动手指，像人的肌腱。你们的两种手都是电机直接驱动关节这一类。'],
    ['抓取合成', 'grasp synthesis', '用算法算出“这只手握住这个物体时，每根手指该放在哪”。'],
    ['扩散策略', 'diffusion policy', '一种目前很流行的模仿学习方法，借用了 AI 画图的技术来生成动作。知道它是“模仿学习的一种主流做法”就够了。'],
    ['视觉-语言-动作模型', 'VLA', '能看图、听懂文字指令、直接输出机器人动作的大模型。可以粗略理解成“会动手的 ChatGPT”。'],
    ['零样本', 'zero-shot', '练好之后不做任何额外调整就直接用到新情况上。比如“零样本迁移到真机”就是虚拟世界练完直接上真手。']
  ];

  // 入门路线：id + 为什么读它
  var ROUTE = [
    ['2504.03515', '先看综述，建立问题与方法的地图'],
    ['1808.00177', 'Sim-to-real 强化学习的起点'],
    ['2210.04887', '现代手内操作的标准做法'],
    ['2502.20396', '把视觉 sim-to-real 搬上人形机器人的配方'],
    ['2210.02697', '灵巧抓取的数据基础'],
    ['2309.06440', '最常用的开源硬件平台'],
    ['2307.04577', '遥操作与重定向的通用框架'],
    ['2403.07788', '脱离机器人采集人手数据'],
    ['2505.21864', '用外骨骼跨越人-机构型差距'],
    ['2602.16710', '人类视频预训练的规模效应']
  ];

  var $ = function (id) { return document.getElementById(id); };
  var store = {
    get: function (k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  var papers = [];
  var saved = store.get('hand.saved', {});
  var read = store.get('hand.read', {});
  var state = { q: '', cat: 'all', task: 'all', mount: 'all', sort: 'new', onlyStar: false, onlySaved: false, hideRead: false };

  // ---- theme ----
  var theme = store.get('hand.theme', null);
  if (theme) document.documentElement.dataset.theme = theme;
  $('theme').addEventListener('click', function () {
    var cur = document.documentElement.dataset.theme ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store.set('hand.theme', next);
  });

  // ---- helpers ----
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }

  // 把 text 中匹配搜索词的片段用 <mark> 包起来（不经过 innerHTML）
  function highlight(text, terms) {
    var frag = document.createDocumentFragment();
    if (!terms.length) { frag.appendChild(document.createTextNode(text)); return frag; }
    var re = new RegExp('(' + terms.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'ig');
    var last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      frag.appendChild(el('mark', { text: m[0] }));
      last = m.index + m[0].length;
      if (!m[0].length) re.lastIndex++;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    return frag;
  }

  function authorLine(a) {
    return a.length > 6 ? a.slice(0, 5).join(', ') + ' 等 ' + a.length + ' 人' : a.join(', ');
  }

  function terms() {
    return state.q.toLowerCase().split(/\s+/).filter(Boolean);
  }

  function visible() {
    var ts = terms();
    var out = papers.filter(function (p) {
      if (state.cat !== 'all' && p.cat !== state.cat) return false;
      if (state.task !== 'all' && p.tasks.indexOf(state.task) === -1) return false;
      if (state.mount !== 'all' && p.mount !== state.mount) return false;
      if (state.onlyStar && !p.star) return false;
      if (state.onlySaved && !saved[p.id]) return false;
      if (state.hideRead && read[p.id]) return false;
      return ts.every(function (t) { return p._hay.indexOf(t) !== -1; });
    });
    out.sort(function (a, b) {
      if (state.sort === 'title') return a.title.localeCompare(b.title);
      var d = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      return state.sort === 'old' ? d : -d;
    });
    return out;
  }

  // ---- render ----
  function toggleBtn(label, on, handler) {
    var b = el('button', { type: 'button', 'aria-pressed': String(!!on), text: label });
    b.addEventListener('click', handler);
    return b;
  }

  function card(p, ts) {
    var abs = 'https://arxiv.org/abs/' + p.id;
    var titleLink = el('a', { href: abs, target: '_blank', rel: 'noopener' });
    titleLink.appendChild(highlight(p.title, ts));

    var zh = el('p', { class: 'zh' });
    zh.appendChild(highlight(p.zh, ts));

    var did = el('p', { class: 'did' }, [el('b', { text: '做了什么任务' })]);
    p.tasks.forEach(function (t) {
      var b = el('button', { type: 'button', class: 'tasktag', text: TASK_NAME[t], title: '只看这类任务' });
      b.addEventListener('click', function () { state.task = t; render(); });
      did.appendChild(b);
    });
    var didText = el('span');
    didText.appendChild(highlight(p.did, ts));
    did.appendChild(didText);

    var mount = null;
    if (p.mount) {
      var mb = el('button', { type: 'button', class: 'tasktag', text: MOUNT_NAME[p.mount], title: '只看这一类' });
      mb.addEventListener('click', function () { state.mount = p.mount; render(); });
      mount = el('p', { class: 'did' }, [el('b', { text: '要不要机械臂' }), mb, p.mount_note ? el('span', { text: p.mount_note }) : null]);
    }

    var absP = el('p');
    absP.appendChild(highlight(p.abstract, ts));

    var node = el('article', { class: 'paper' + (read[p.id] ? ' read' : ''), id: 'p-' + p.id, style: '--c: var(--c-' + p.cat + ')' }, [
      el('div', { class: 'meta' }, [
        el('span', { class: 'tag' }, [el('span', { class: 'dot' }), CAT_NAME[p.cat]]),
        el('span', { class: 'date', text: p.date }),
        el('span', { class: 'aid', text: 'arXiv:' + p.id }),
        p.star ? el('span', { class: 'star', text: '精选' }) : null
      ]),
      el('h3', null, [el('span', { class: 'short', text: p.short }), titleLink]),
      el('p', { class: 'authors', text: authorLine(p.authors) }),
      did,
      mount,
      zh,
      el('details', null, [el('summary', { text: '英文摘要' }), absP]),
      el('div', { class: 'actions' }, [
        el('a', { href: abs, target: '_blank', rel: 'noopener', text: 'arXiv' }),
        el('a', { href: 'https://arxiv.org/pdf/' + p.id, target: '_blank', rel: 'noopener', text: 'PDF' }),
        el('a', { href: 'https://scholar.google.com/scholar?q=' + encodeURIComponent(p.title), target: '_blank', rel: 'noopener', text: 'Scholar' }),
        el('span', { class: 'sp' }),
        toggleBtn(saved[p.id] ? '★ 已收藏' : '☆ 收藏', saved[p.id], function () {
          if (saved[p.id]) delete saved[p.id]; else saved[p.id] = 1;
          store.set('hand.saved', saved); render();
        }),
        toggleBtn(read[p.id] ? '✓ 已读' : '标为已读', read[p.id], function () {
          if (read[p.id]) delete read[p.id]; else read[p.id] = 1;
          store.set('hand.read', read); render();
        })
      ])
    ]);
    return node;
  }

  function render() {
    var ts = terms();
    var rows = visible();
    var list = $('list');
    list.textContent = '';
    var frag = document.createDocumentFragment();
    rows.forEach(function (p) { frag.appendChild(card(p, ts)); });
    list.appendChild(frag);
    $('empty').hidden = rows.length > 0;
    $('count').textContent = rows.length + ' / ' + papers.length + ' 篇';
    Array.prototype.forEach.call($('chips').children, function (c) {
      c.setAttribute('aria-pressed', String(c.dataset.cat === state.cat));
    });
    Array.prototype.forEach.call($('taskchips').children, function (c) {
      c.setAttribute('aria-pressed', String(c.dataset.task === state.task));
    });
    Array.prototype.forEach.call($('mountchips').children, function (c) {
      c.setAttribute('aria-pressed', String(c.dataset.mount === state.mount));
    });
    var mnote = $('mountnote');
    mnote.hidden = !MOUNT_PLAIN[state.mount];
    mnote.textContent = MOUNT_PLAIN[state.mount] ? '“' + MOUNT_NAME[state.mount] + '”是什么意思：' + MOUNT_PLAIN[state.mount] : '';
    var tnote = $('tasknote');
    tnote.hidden = !TASK_PLAIN[state.task];
    tnote.textContent = TASK_PLAIN[state.task] ? '“' + TASK_NAME[state.task] + '”是什么：' + TASK_PLAIN[state.task] : '';
    var note = $('catnote');
    note.hidden = !CAT_PLAIN[state.cat];
    note.textContent = CAT_PLAIN[state.cat] ? CAT_NAME[state.cat] + '是什么：' + CAT_PLAIN[state.cat] : '';
  }

  function renderGlossary() {
    var box = $('gloss');
    GLOSSARY.forEach(function (g) {
      box.appendChild(el('details', null, [
        el('summary', null, [g[0], el('small', { text: g[1] })]),
        el('p', { text: g[2] })
      ]));
    });
  }

  function renderChips() {
    var counts = { all: papers.length };
    papers.forEach(function (p) { counts[p.cat] = (counts[p.cat] || 0) + 1; });
    var chips = $('chips');
    [{ key: 'all', name: '全部' }].concat(CATS).forEach(function (c) {
      var b = el('button', { type: 'button', class: 'chip', 'data-cat': c.key, 'aria-pressed': 'false', style: '--c: var(--c-' + c.key + ')' }, [
        c.key === 'all' ? null : el('span', { class: 'dot' }),
        c.name,
        el('span', { class: 'n', text: String(counts[c.key] || 0) })
      ]);
      b.addEventListener('click', function () { state.cat = c.key; render(); });
      chips.appendChild(b);
    });
  }

  function renderTaskChips() {
    var counts = { all: papers.length };
    papers.forEach(function (p) { p.tasks.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
    var chips = $('taskchips');
    [{ key: 'all', name: '全部' }].concat(TASKS).forEach(function (c) {
      var b = el('button', { type: 'button', class: 'chip', 'data-task': c.key, 'aria-pressed': 'false' }, [
        c.name,
        el('span', { class: 'n', text: String(counts[c.key] || 0) })
      ]);
      b.addEventListener('click', function () { state.task = c.key; render(); });
      chips.appendChild(b);
    });
  }

  function renderStats() {
    var years = papers.map(function (p) { return +p.date.slice(0, 4); });
    var recent = papers.filter(function (p) { return p.date >= '2025-01-01'; }).length;
    var rows = [
      ['收录论文', papers.length],
      ['研究方向', CATS.length],
      ['2025 年以来', recent],
      ['时间跨度', Math.min.apply(null, years) + '–' + Math.max.apply(null, years)]
    ];
    var dl = $('stats');
    rows.forEach(function (r) {
      dl.appendChild(el('div', null, [el('dt', { text: r[0] }), el('dd', { text: String(r[1]) })]));
    });
  }

  function renderRoute() {
    var byId = {};
    papers.forEach(function (p) { byId[p.id] = p; });
    var ol = $('route');
    ROUTE.forEach(function (r) {
      var p = byId[r[0]];
      if (!p) return;
      var a = el('a', { href: '#p-' + p.id, text: p.short });
      a.addEventListener('click', function () {
        // 确保目标卡片没有被当前筛选隐藏
        state.q = ''; state.cat = 'all'; state.task = 'all'; state.mount = 'all'; state.onlyStar = state.onlySaved = state.hideRead = false;
        $('q').value = '';
        $('onlyStar').checked = $('onlySaved').checked = $('hideRead').checked = false;
        render();
      });
      ol.appendChild(el('li', null, [a, el('small', { text: r[1] + ' · ' + p.date.slice(0, 4) })]));
    });
  }

  // ---- wire up ----
  $('q').addEventListener('input', function (e) { state.q = e.target.value; render(); });
  $('sort').addEventListener('change', function (e) { state.sort = e.target.value; render(); });
  ['onlyStar', 'onlySaved', 'hideRead'].forEach(function (k) {
    $(k).addEventListener('change', function (e) { state[k] = e.target.checked; render(); });
  });

  function renderMountChips() {
    var counts = { all: papers.length };
    papers.forEach(function (p) { if (p.mount) counts[p.mount] = (counts[p.mount] || 0) + 1; });
    var chips = $('mountchips');
    [{ key: 'all', name: '全部' }].concat(MOUNTS).forEach(function (c) {
      var b = el('button', { type: 'button', class: 'chip', 'data-mount': c.key, 'aria-pressed': 'false' }, [
        c.name,
        el('span', { class: 'n', text: String(counts[c.key] || 0) })
      ]);
      b.addEventListener('click', function () { state.mount = c.key; render(); });
      chips.appendChild(b);
    });
  }

  fetch('data/papers.json')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      papers = data;
      papers.forEach(function (p) {
        p._hay = [p.title, p.short, p.authors.join(' '), p.zh, p.abstract, p.id, CAT_NAME[p.cat], p.did, p.tasks.map(function (t) { return TASK_NAME[t]; }).join(' '), MOUNT_NAME[p.mount] || '', p.mount_note || ''].join(' ').toLowerCase();
      });
      renderStats(); renderRoute(); renderChips(); renderTaskChips(); renderMountChips(); render();
      // 从别的页面带着 #p-xxxx 跳过来时，卡片是刚渲染出来的，需要手动滚过去
      var target = location.hash && document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    })
    .catch(function (err) {
      $('empty').hidden = false;
      $('empty').textContent = '论文数据加载失败（' + err.message + '）。请确认是通过 serve.sh 启动的服务访问本页。';
    });

  renderGlossary();
})();
