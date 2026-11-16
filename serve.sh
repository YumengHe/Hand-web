#!/usr/bin/env bash
# 在 9004 端口启动静态站点（可用 PORT=xxxx 覆盖）。
cd "$(dirname "$0")" || exit 1
exec python3 -m http.server "${PORT:-9004}" --bind "${HOST:-0.0.0.0}"
