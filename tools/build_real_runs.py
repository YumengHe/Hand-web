"""扫描 playstation 的真手转圆柱记录，生成 data/real_runs.json（学习站 task-rotate.html 的历史记录表读它）。

用法（在 Hand 仓库根目录）：
    conda run -n hand python Hand-web/tools/build_real_runs.py

输入：
- playstation/.cache/rotate_logs/rotate_sharpa_MMDD_HHMMSS.csv（+ 同名 .json、.mp4，旧记录没有 json）
  CSV 20 Hz，state==3 为策略运行；f0–f4 = 拇/食/中/无名/小，已乘 force_scale 并过阈值，原始力 = f ÷ force_scale。
- playstation/web/rotate_model_names.json：模型文件名 → 显示名。
- Hand-web/data/real_runs_notes.json：人工填的圈数、结果判定、备注，以及旧记录缺的参数（fill）。
- external/sharpa-rl-lab-il3/logs/night_1125/t3/compare.json（可选）：hand-sim 算的拇-中指尖距。

输出只含数字、文件名和人工备注；不写绝对路径、主机名、hand_sn。

录像：每条进表记录的录像压小放进 Hand-web/media/runs/<id>.mp4（+ <id>.jpg 封面），json 里存站内相对路径。
裁到手的区域（原片 640×480 → 340×300），15 fps，H.264 crf 32，无音轨，+faststart。
增量：已压好且不比源录像旧的不重做；源录像被 playstation 清理掉后，已压好的保留、json 照常指向它。
ffmpeg 取环境变量 RECORD_FFMPEG，否则 env_isaaclab3 里 imageio_ffmpeg 自带的，再否则 PATH 里的；都没有就跳过录像，表照常生成。
playstation 每次真手运行结束后自动跑本脚本（超时 120 秒），stdout 最后一行显示在它的页面上。

指标定义（页面说明里也有一份）：
- run_s：策略运行时长（json 的 end.run_s，没有就取 CSV 最后一行的 t）。
- gait_hz：步态主频。从第 2 秒起，每 5 秒一段，22 个关节角去均值后做频谱，取 0.5 Hz 以上能量最大的频率，各段取中位数。
- amp_mrad：动作幅度，每个控制步（50 ms）关节角变化的绝对值平均，单位 mrad。
- pinky_low_frac / pinky_low_max_s：小指掌根（Isaac 第 2 列 q2）< 0.06 rad 的时间占比、最长连续秒数。
- force_raw：各指原始力，有接触（f > 0）时的中位数，N；触觉系数未知时为 null。
- contact：各指有接触（f > 0）的时间占比。
- drop_t：疑似掉落，取两条规则里早的那个：① 5 个指尖力全为 0 连续 ≥ 2 秒的第一个时刻；② 中指、无名指力同时归零并一直持续到结束（≥ 2 秒）而拇指还有力（圆柱倒进手心），取归零的时刻。
- stop_t：疑似停住。从第 2 秒起，3 秒滑窗的动作幅度 < 本次第 2–10 秒中位数的 30%，取第一个时刻。
- auto：自动判定。run_s < 5 → 太短；有 drop_t → 掉了；pinky_low_max_s ≥ 5 → 卡住；有 stop_t → 停住；否则 一直转。
"""
import csv, glob, json, os, re, shutil, subprocess, sys, time
import numpy as np

T0 = time.time()

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(HERE)
HAND = os.path.dirname(WEB)
LOGS = os.path.join(HAND, 'playstation', '.cache', 'rotate_logs')
NAMES = os.path.join(HAND, 'playstation', 'web', 'rotate_model_names.json')
NOTES = os.path.join(WEB, 'data', 'real_runs_notes.json')
COMPARE = os.path.join(HAND, 'external', 'sharpa-rl-lab-il3', 'logs', 'night_1125', 't3', 'compare.json')
OUT = os.path.join(WEB, 'data', 'real_runs.json')
MEDIA = os.path.join(WEB, 'media', 'runs')
CROP = 'crop=340:300:80:90'   # 手和圆柱，留了余量（相机 2026-11-26 晚上挪过一次，新旧位置都框得住）；不含右边的屏幕。相机再挪要重新核对
FFMPEG_DIR = os.path.expanduser('~/miniconda3/envs/env_isaaclab3/lib/python3.12/site-packages/imageio_ffmpeg/binaries')


def find_ffmpeg():
    p = os.environ.get('RECORD_FFMPEG')
    if p and os.path.exists(p):
        return p
    c = sorted(glob.glob(os.path.join(FFMPEG_DIR, 'ffmpeg-*')))
    return c[-1] if c else shutil.which('ffmpeg')


def compress(ff, src, rid, t_poster):
    """压一段录像和封面；返回 True 表示新压了。失败时删掉半成品。"""
    mp4 = os.path.join(MEDIA, rid + '.mp4')
    jpg = os.path.join(MEDIA, rid + '.jpg')
    tmp = mp4 + '.tmp.mp4'
    try:
        subprocess.run([ff, '-loglevel', 'error', '-y', '-i', src, '-an', '-vf', CROP + ',fps=15',
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '32', '-pix_fmt', 'yuv420p',
                        '-movflags', '+faststart', tmp], check=True, timeout=60)
        os.replace(tmp, mp4)
        for t in (t_poster, 0):   # 太短的录像在第 0 秒取封面
            subprocess.run([ff, '-loglevel', 'error', '-y', '-ss', str(t), '-i', mp4, '-frames:v', '1',
                            '-q:v', '5', jpg], timeout=20)
            if os.path.exists(jpg) and os.path.getmtime(jpg) >= os.path.getmtime(mp4):
                return True
        return False
    except Exception:
        if os.path.exists(tmp):
            os.remove(tmp)
        return False
FINGERS = ['拇', '食', '中', '无名', '小']


def load(path, default):
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return default


def r(x, n=2):
    return None if x is None else round(float(x), n)


def first_run(mask, n):
    """mask 里第一个连续 n 个 True 的起点下标，没有返回 None。"""
    c = 0
    for i, v in enumerate(mask):
        c = c + 1 if v else 0
        if c >= n:
            return i - n + 1
    return None


def longest(mask):
    best = c = 0
    for v in mask:
        c = c + 1 if v else 0
        best = max(best, c)
    return best


def metrics(path, fs):
    with open(path, newline='') as f:
        rows = [x for x in csv.DictReader(f) if x.get('state', '3') == '3']
    if len(rows) < 2:
        return None
    t = np.array([float(x['t']) for x in rows])
    F = np.array([[float(x[f'f{i}']) for i in range(5)] for x in rows])
    q = np.array([[float(x[f'q{i}']) for i in range(22)] for x in rows])
    dt = float(np.median(np.diff(t)))
    out = {'csv_s': r(t[-1], 1)}
    # 步态主频
    hz = []
    for s in np.arange(2.0, t[-1] - 4.0, 5.0):
        k = (t >= s) & (t < s + 5)
        if k.sum() < 40:
            continue
        x = q[k] - q[k].mean(0)
        sp = (np.abs(np.fft.rfft(x, axis=0, n=1024)) ** 2).sum(1)
        fr = np.fft.rfftfreq(1024, dt)
        sp[fr < 0.5] = 0
        hz.append(fr[sp.argmax()])
    out['gait_hz'] = r(np.median(hz), 2) if hz else None
    # 动作幅度
    dq = np.abs(np.diff(q, axis=0)).mean(1)          # 每步 22 个关节的平均 |Δq|
    tt = t[1:]
    run = tt >= 2.0
    out['amp_mrad'] = r(dq[run].mean() * 1000, 1) if run.any() else None
    # 小指掌根
    low = q[:, 2] < 0.06
    out['pinky_low_frac'] = r(low.mean(), 3)
    out['pinky_low_max_s'] = r(longest(low) * dt, 1)
    # 力
    on = F > 0
    out['contact'] = [r(on[:, i].mean(), 2) for i in range(5)]
    if fs:
        out['force_raw'] = [r(np.median(F[on[:, i], i]) / fs, 1) if on[:, i].any() else None for i in range(5)]
    else:
        out['force_raw'] = None
    # 疑似掉落：5 指全 0 连续 ≥ 2 s
    i = first_run(~on.any(1), int(round(2.0 / dt)))
    cand = [t[i]] if i is not None else []
    # 疑似掉落（倒进手心）：中指、无名指同时归零并一直到结束（≥ 2 s），拇指还有力
    mr = np.where(on[:, 2] | on[:, 3])[0]
    k = (mr[-1] + 1) if len(mr) else 0
    if k < len(t) and t[-1] - t[k] >= 2.0 and on[k:, 0].any():
        cand.append(t[k])
    out['drop_t'] = r(min(cand), 1) if cand else None
    # 疑似停住：3 s 滑窗动作幅度 < 第 2–10 s 中位数的 30%
    base = dq[(tt >= 2) & (tt < 10)]
    out['stop_t'] = None
    if len(base) > 20:
        w = int(round(3.0 / dt))
        sm = np.convolve(dq, np.ones(w) / w, mode='valid')
        ok = (tt[:len(sm)] >= 2.0) & (sm < 0.3 * np.median(base))
        j = first_run(ok, 1)
        if j is not None:
            out['stop_t'] = r(tt[j], 1)
    return out


def auto_verdict(m, run_s):
    if run_s is not None and run_s < 5:
        return '太短'
    if m is None:
        return None
    if m['drop_t'] is not None:
        return '掉了'
    if m['pinky_low_max_s'] >= 5:
        return '卡住'
    if m['stop_t'] is not None:
        return '停住'
    return '一直转'


def main():
    vjobs = []
    names = load(NAMES, {})
    notes = load(NOTES, {})
    compare = load(COMPARE, {})
    runs = []
    for fn in sorted(os.listdir(LOGS)):
        mt = re.fullmatch(r'rotate_sharpa_(\d{4})_(\d{6})\.csv', fn)
        if not mt:
            continue
        rid = f'{mt.group(1)}_{mt.group(2)}'
        meta = load(os.path.join(LOGS, fn[:-4] + '.json'), {})
        note = notes.get(rid, {})
        fill = note.get('fill', {})
        model = meta.get('model') or fill.get('model')
        obj = (meta.get('object') or {}).get('id') or fill.get('object')
        fs = meta.get('force_scale', fill.get('force_scale'))
        if not model and fs is None:
            continue  # 模型和参数都不知道的旧记录不进表（用户 2026-11-26）
        m = metrics(os.path.join(LOGS, fn), fs)
        end = meta.get('end') or {}
        run_s = end.get('run_s') if end.get('run_s') is not None else (m or {}).get('csv_s')
        md, hm = mt.group(1), mt.group(2)
        start = meta.get('start') or f'{md[:2]}-{md[2:]} {hm[:2]}:{hm[2:4]}:{hm[4:]}'
        video = meta.get('video') or {}
        vsrc = os.path.join(LOGS, video['file']) if video.get('file') else None
        if not (vsrc and os.path.exists(vsrc)):
            vsrc = None
        vjobs.append((rid, vsrc, video.get('csv_offset_s')))
        cmp = compare.get(rid.split('_')[1]) if rid.startswith('1125_') else None
        d_tm = None
        if cmp and cmp.get('win'):
            w = {tuple(x['t']): x for x in cmp['win']}
            if (0, 5) in w and (12, 20) in w:
                d_tm = [r(w[(0, 5)]['d_thumb_middle_mm'], 1), r(w[(12, 20)]['d_thumb_middle_mm'], 1)]
        auto = auto_verdict(m, run_s)
        runs.append({
            'id': rid,
            'start': start,
            'model': names.get(model, os.path.basename(model)) if model else None,
            'object': obj,
            'force_scale': r(fs, 3) if fs is not None else None,
            'current_coef': meta.get('current_coef', fill.get('current_coef')),
            'grasp_offset': meta.get('grasp_offset', fill.get('grasp_offset')),
            'filled': sorted(k for k in fill if k != 'src' and k not in meta) or None,   # 哪些参数是人工补的
            'fill_src': fill.get('src'),
            'auto_stop_s': meta.get('auto_stop_s') or None,
            'run_s': r(run_s, 1),
            'end_reason': end.get('reason'),
            'metrics': m,
            'thumb_middle_mm': d_tm,
            'auto': auto,
            'verdict': note.get('verdict') or auto,
            'verdict_auto': not note.get('verdict'),
            'turns': note.get('turns'),
            'note': note.get('note'),
            'video': None,
            'video_run_s': None,
        })
    # 录像：压小放进 media/runs/（增量）
    os.makedirs(MEDIA, exist_ok=True)
    ff = find_ffmpeg()
    new = fail = 0
    byid = {x['id']: x for x in runs}
    for rid, vsrc, off in vjobs:
        mp4 = os.path.join(MEDIA, rid + '.mp4')
        if vsrc and ff and (not os.path.exists(mp4) or os.path.getmtime(mp4) < os.path.getmtime(vsrc)
                            or not os.path.exists(os.path.join(MEDIA, rid + '.jpg'))):
            if compress(ff, vsrc, rid, (off or 0) + 5):
                new += 1
            else:
                fail += 1
        if os.path.exists(mp4):
            byid[rid]['video'] = 'media/runs/' + rid + '.mp4'
            byid[rid]['video_run_s'] = off
    runs.sort(key=lambda x: x['id'], reverse=True)
    out = {
        'source': 'playstation/.cache/rotate_logs/rotate_sharpa_*.csv（+ .json）',
        'fingers': FINGERS,
        'baseline': {'force_scale': 0.667, 'current_coef': 0.3, 'grasp_offset': 2},
        'runs': runs,
    }
    with open(OUT + '.tmp', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    os.replace(OUT + '.tmp', OUT)   # playstation 可能同时在跑，整份替换
    nv = sum(1 for x in runs if x['video'])
    msg = f'学习站历史表 {len(runs)} 条（{nv} 条有录像），新压 {new} 段录像'
    if fail:
        msg += f'，{fail} 段压缩失败'
    if not ff:
        msg += '；没找到 ffmpeg，跳过录像'
    print(msg + f'，用时 {time.time() - T0:.0f} 秒')


if __name__ == '__main__':
    sys.exit(main())
