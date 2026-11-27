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
    { key: 'vla', name: '模仿学习与基础模型' },
    { key: 'model', name: '基于模型的规划和控制' }
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
    vla: '让机器人看人示范来学动作，以及训练能“看图、听懂指令、直接输出动作”的大模型。',
    model: '不靠试错学习，而是写出手和物体的物理模型（接触、摩擦、运动学），再用优化或规划算出手指该怎么动。早年的手内操作大多是这一路。'
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
  var TASK_NAME = { rubik: '魔方' };
  TASKS.forEach(function (t) { TASK_NAME[t.key] = t.name; });
  // 细标签从 data/subtasks.json 读：key、name、plain、parent（所属粗任务）
  var SUBS = [], SUB = {};
  var RUBIK = ['rubik_hand', 'rubik_robot', 'rubik_algo'];
  var REL = [
    { key: 'high', name: '高' },
    { key: 'mid', name: '中' },
    { key: 'low', name: '低' },
    { key: 'none', name: '没标' }
  ];
  // 没标的篇数在数据读进来后填
  var relPlain = function (n) { return '调研时按和我们“手里转圆柱”任务的接近程度标的高 / 中 / 低。较早收录的 ' + n + ' 篇没标，归在“没标”。'; };
  var REL_PLAIN = '';
  var TASK_PLAIN = {
    rotate: '不把东西放下，只靠手指把手里的物体转个方向，比如转方块、转笔、转球。只需要一只固定在桌上的手，不用机械臂。我们现在就能做，“入门五步”的第五步就是这个任务。',
    grasp: '看到一个物体，决定手指放在哪、怎么握，然后把它抓起来。多数工作需要机械臂把手送到物体旁边；只算“握法”的那部分可以在电脑里做。',
    tool: '用剪刀、螺丝刀、锤子，拧瓶盖，拧魔方，开合带关节的东西。难在既要握稳，又要让工具的一部分能动。有些只用手就能做，有些要机械臂。',
    bimanual: '一只手做不了、要两只手配合的任务，比如一只手扶着瓶子另一只手拧盖子，或者两只手之间递东西。我们有两只 Sharpa，但第二只是左手还是右手还没确认，两只都是右手的话有些任务做不了。',
    daily: '拿起放下、倒水、开门、叠毛巾这类一连串动作的生活任务。通常一篇文章做好几个，重点是方法通用，而不是某一个任务。基本都需要机械臂。',
    none: '综述、造手、造传感器这类文章。它们不解决某个具体任务，文中的任务只是用来展示“这东西能用”。',
    rubik: '所有和魔方有关的文章：用灵巧手拧魔方、机器人解魔方系统、只算解法的算法。分属三个粗任务，这里合在一起看。'
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

  var $ = function (id) { return document.getElementById(id); };
  var store = {
    get: function (k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  var papers = [];
  var state = { q: '', cat: 'all', task: 'all', sub: 'all', rel: 'all', mount: 'all', sort: 'new', onlyStar: false };
  var REL_RANK = { high: 0, mid: 1, low: 2 };
  var isArxiv = function (p) { return /^\d{4}\.\d{4,5}$/.test(p.id); };
  var paperUrl = function (p) { return isArxiv(p) ? 'https://arxiv.org/abs/' + p.id : p.url; };
  var byDateDesc = function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; };
  var relRank = function (p) { return p.relevance in REL_RANK ? REL_RANK[p.relevance] : 3; };

  // ---- 星标：papers.json 的 star 是默认值，用户点过的存在 hand.stars（{id: true/false}），两个页面共用 ----
  var stars = store.get('hand.stars', {});
  var oldSaved = store.get('hand.saved', null);  // 以前的“收藏”并入星标
  if (oldSaved) {
    Object.keys(oldSaved).forEach(function (id) { if (!(id in stars)) stars[id] = true; });
    store.set('hand.stars', stars);
    try { localStorage.removeItem('hand.saved'); } catch (e) { /* ignore */ }
  }
  var isStarred = function (p) { return p.id in stars ? !!stars[p.id] : !!p.star; };
  // 星标的永远在前，组内按 cmp 排
  var starFirst = function (cmp) {
    return function (a, b) { return (isStarred(b) - isStarred(a)) || cmp(a, b); };
  };
  // 点一下切换星标，再调 onToggle（各页面自己重排）；重排后把焦点还给这颗星
  function starButton(p, onToggle) {
    var on = isStarred(p);
    var b = el('button', { type: 'button', class: 'starbtn', 'data-id': p.id, 'aria-pressed': String(on),
      'aria-label': (on ? '取消星标：' : '加星标：') + p.short, title: on ? '取消星标' : '加星标（排在最前）', text: on ? '★' : '☆' });
    b.addEventListener('click', function () {
      stars[p.id] = !on;
      store.set('hand.stars', stars);
      onToggle();
      var again = document.querySelector('.starbtn[data-id="' + p.id.replace(/"/g, '\\"') + '"]');
      if (again) again.focus();
    });
    return b;
  }
  var starredIds = function (list) { return list.filter(isStarred).map(function (p) { return p.id; }); };

  // task-rotate.html 的“相关文献”表复用这些；下面是文献库页面自己的逻辑
  window.HandPapers = { el: el, getJSON: getJSON, paperUrl: paperUrl, byDateDesc: byDateDesc, relRank: relRank, REL: REL,
    isStarred: isStarred, starFirst: starFirst, starButton: starButton };
  if (!$('list')) return;

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
      if (state.task !== 'all' && !p._task[state.task]) return false;
      if (state.sub !== 'all' && p.subtasks.indexOf(state.sub) === -1) return false;
      if (state.rel !== 'all' && (p.relevance || 'none') !== state.rel) return false;
      if (state.mount !== 'all' && p.mount !== state.mount) return false;
      if (state.onlyStar && !isStarred(p)) return false;
      return ts.every(function (t) { return p._hay.indexOf(t) !== -1; });
    });
    out.sort(starFirst(function (a, b) {
      if (state.sort === 'title') return a.title.localeCompare(b.title);
      if (state.sort === 'rel') {
        return relRank(a) - relRank(b) || byDateDesc(a, b);
      }
      var d = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      return state.sort === 'old' ? d : -d;
    }));
    return out;
  }

  // ---- render ----
  function card(p, ts) {
    var abs = paperUrl(p);
    var titleLink = el('a', { href: abs, target: '_blank', rel: 'noopener' });
    titleLink.appendChild(highlight(p.title, ts));

    var zh = el('p', { class: 'zh' });
    zh.appendChild(highlight(p.zh, ts));

    var did = el('p', { class: 'did' }, [el('b', { text: '做了什么任务' })]);
    p.subtasks.forEach(function (k) {
      var s = SUB[k];
      var b = el('button', { type: 'button', class: 'tasktag', text: s.name, title: s.plain });
      b.addEventListener('click', function () { state.task = RUBIK.indexOf(k) !== -1 ? 'rubik' : s.parent; state.sub = k; render(); });
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
    if (p.abstract) absP.appendChild(highlight(p.abstract, ts));
    else absP.textContent = '数据里没有这篇的英文摘要。';

    var node = el('article', { class: 'paper', id: 'p-' + p.id, style: '--c: var(--c-' + p.cat + ')' }, [
      el('div', { class: 'meta' }, [
        starButton(p, render),
        el('span', { class: 'tag' }, [el('span', { class: 'dot' }), CAT_NAME[p.cat]]),
        el('span', { class: 'date', text: p.date }),
        isArxiv(p) ? el('span', { class: 'aid', text: 'arXiv:' + p.id }) : null,
        p.venue && !/^arxiv/i.test(p.venue) ? el('span', { class: 'aid', text: p.venue }) : null,
        p.relevance === 'high' ? el('span', { class: 'rel', text: '和转圆柱高度相关', title: REL_PLAIN }) : null
      ]),
      el('h3', null, [el('span', { class: 'short', text: p.short }), titleLink]),
      el('p', { class: 'authors', text: authorLine(p.authors) }),
      did,
      mount,
      zh,
      el('details', null, [el('summary', { text: '英文摘要' }), absP]),
      el('div', { class: 'actions' }, [
        isArxiv(p) ? el('a', { href: abs, target: '_blank', rel: 'noopener', text: 'arXiv' }) : el('a', { href: abs, target: '_blank', rel: 'noopener', text: '原文' }),
        isArxiv(p) ? el('a', { href: 'https://arxiv.org/pdf/' + p.id, target: '_blank', rel: 'noopener', text: 'PDF' }) : null,
        el('a', { href: 'https://scholar.google.com/scholar?q=' + encodeURIComponent(p.title), target: '_blank', rel: 'noopener', text: 'Scholar' })
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
    Array.prototype.forEach.call($('relchips').children, function (c) {
      c.setAttribute('aria-pressed', String(c.dataset.rel === state.rel));
    });
    renderSubChips();
    var snote = $('subnote');
    snote.hidden = !SUB[state.sub];
    snote.textContent = SUB[state.sub] ? '“' + SUB[state.sub].name + '”是什么：' + SUB[state.sub].plain : '';
    var rnote = $('relnote');
    rnote.hidden = state.rel === 'all';
    rnote.textContent = REL_PLAIN;
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
    papers.forEach(function (p) { Object.keys(p._task).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
    var chips = $('taskchips');
    [{ key: 'all', name: '全部' }].concat(TASKS, [{ key: 'rubik', name: '魔方' }]).forEach(function (c) {
      var b = el('button', { type: 'button', class: 'chip', 'data-task': c.key, 'aria-pressed': 'false' }, [
        c.name,
        el('span', { class: 'n', text: String(counts[c.key] || 0) })
      ]);
      b.addEventListener('click', function () { state.task = c.key; state.sub = 'all'; render(); });
      chips.appendChild(b);
    });
  }

  // 第二级：当前粗任务下的细标签；没选粗任务时显示“在手里转东西”这一族
  function renderSubChips() {
    var fam = state.task === 'all' ? 'rotate' : state.task;
    var keys = fam === 'rubik' ? RUBIK : SUBS.filter(function (s) { return s.parent === fam; }).map(function (s) { return s.key; });
    $('sublabel').textContent = '“' + TASK_NAME[fam] + '”细分';
    var chips = $('subchips');
    chips.textContent = '';
    var base = papers.filter(function (p) { return state.task === 'all' || p._task[state.task]; });
    var counts = { all: base.length };
    base.forEach(function (p) { p.subtasks.forEach(function (k) { counts[k] = (counts[k] || 0) + 1; }); });
    ['all'].concat(keys).forEach(function (k) {
      var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': String(state.sub === k), title: SUB[k] ? SUB[k].plain : '' }, [
        k === 'all' ? '全部' : SUB[k].name,
        el('span', { class: 'n', text: String(counts[k] || 0) })
      ]);
      b.addEventListener('click', function () { state.sub = k; render(); });
      chips.appendChild(b);
    });
  }

  function renderRelChips() {
    var counts = { all: papers.length };
    papers.forEach(function (p) { var r = p.relevance || 'none'; counts[r] = (counts[r] || 0) + 1; });
    var chips = $('relchips');
    [{ key: 'all', name: '全部' }].concat(REL).forEach(function (c) {
      var b = el('button', { type: 'button', class: 'chip', 'data-rel': c.key, 'aria-pressed': 'false' }, [
        c.name,
        el('span', { class: 'n', text: String(counts[c.key] || 0) })
      ]);
      b.addEventListener('click', function () { state.rel = c.key; render(); });
      chips.appendChild(b);
    });
  }

  function renderStats() {
    var years = papers.map(function (p) { return +p.date.slice(0, 4); });
    var recent = years.filter(function (y) { return y >= 2025; }).length;
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

  // ---- wire up ----
  $('q').addEventListener('input', function (e) { state.q = e.target.value; render(); });
  $('sort').addEventListener('change', function (e) { state.sort = e.target.value; render(); });
  $('copyStars').addEventListener('click', function () {
    var b = this, text = JSON.stringify(starredIds(papers));
    var done = function () { b.textContent = '已复制 ' + starredIds(papers).length + ' 篇'; setTimeout(function () { b.textContent = '复制星标清单'; }, 2000); };
    var fallback = function () {
      var t = el('textarea', { readonly: '', style: 'position:fixed;opacity:0' });
      t.value = text; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); done(); } catch (e) { window.prompt('复制这段：', text); }
      t.remove();
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  });
  $('onlyStar').addEventListener('change', function (e) { state.onlyStar = e.target.checked; render(); });

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

  function getJSON(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); });
  }
  Promise.all([getJSON('data/papers.json'), getJSON('data/subtasks.json')])
    .then(function (res) {
      papers = res[0];
      SUBS = res[1];
      SUBS.forEach(function (s) { SUB[s.key] = s; });
      papers.forEach(function (p) {
        // 粗任务：tasks 里写的，加上细标签所属的粗任务；魔方单独一类
        p._task = {};
        p.tasks.forEach(function (t) { p._task[t] = 1; });
        p.subtasks.forEach(function (k) { p._task[SUB[k].parent] = 1; if (RUBIK.indexOf(k) !== -1) p._task.rubik = 1; });
        p._hay = [p.title, p.short, p.authors.join(' '), p.zh, p.abstract || '', p.id, p.venue || '', p.hand || '', CAT_NAME[p.cat], p.did,
          Object.keys(p._task).map(function (t) { return TASK_NAME[t]; }).join(' '), p.subtasks.map(function (k) { return SUB[k].name; }).join(' '),
          MOUNT_NAME[p.mount] || '', p.mount_note || ''].join(' ').toLowerCase();
      });
      REL_PLAIN = relPlain(papers.filter(function (p) { return !(p.relevance in REL_RANK); }).length);
      renderStats(); renderChips(); renderTaskChips(); renderMountChips(); renderRelChips(); render();
      // 从别的页面带着 #p-xxxx 跳过来时，卡片是刚渲染出来的，需要手动滚过去
      var target = location.hash && document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    })
    .catch(function (err) {
      $('empty').hidden = false;
      $('empty').textContent = '论文数据加载失败（' + err.message + '）。请确认是通过 serve.sh 启动的服务访问本页。';
    });

})();
