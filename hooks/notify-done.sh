#!/bin/bash
# Stop hook: звук + голосовое оповещение об окончании работы.
#
# Оповещение подавляется, когда главная сессия завершила ход не потому,
# что работа закончена, а чтобы дождаться фонового агента или фоновой
# bash-задачи: сессия будет снова вызвана по их завершении, и «done»
# прозвучит уже на настоящем финале.

input="$(cat)"

transcript="$(
  printf '%s' "$input" | /usr/bin/python3 -c \
    'import sys, json; print(json.load(sys.stdin).get("transcript_path", ""))' 2>/dev/null
)"

if [ -n "$transcript" ] && [ -f "$transcript" ] && /usr/bin/python3 - "$transcript" <<'PY'
import sys, json

try:
    lines = open(sys.argv[1], encoding="utf-8").read().splitlines()
except OSError:
    sys.exit(1)  # прочитать не смогли — не подавляем оповещение

events = []
for ln in lines:
    ln = ln.strip()
    if not ln:
        continue
    try:
        o = json.loads(ln)
    except ValueError:
        continue
    if o.get("type") in ("assistant", "user", "system"):
        events.append(o)


def content_of(o):
    msg = o.get("message")
    return msg.get("content") if isinstance(msg, dict) else None


def is_pure_tool_result(o):
    c = content_of(o)
    if not isinstance(c, list):
        return False
    return bool(c) and all(
        isinstance(x, dict) and x.get("type") == "tool_result" for x in c
    )


def is_real_user_turn(o):
    return o.get("type") == "user" and not is_pure_tool_result(o)


# Окно текущего хода: всё после последней настоящей реплики пользователя.
start = -1
for i, o in enumerate(events):
    if is_real_user_turn(o):
        start = i
turn = events[start + 1:]

BG_MARKERS = (
    "moved to the background",
    "You will be notified when it completes",
    "running in the background",
    "Subagents run in the background",
)

# Индекс последнего запуска фоновой работы в текущем ходе.
launch_idx = None
for i, o in enumerate(turn):
    if o.get("type") == "assistant":
        c = content_of(o)
        if isinstance(c, list) and any(
            isinstance(x, dict)
            and x.get("type") == "tool_use"
            and x.get("name") in ("Agent", "Task")
            for x in c
        ):
            launch_idx = i
    elif is_pure_tool_result(o):
        blob = json.dumps(content_of(o), ensure_ascii=False)
        if any(m in blob for m in BG_MARKERS):
            launch_idx = i

if launch_idx is None:
    sys.exit(1)  # фоновых запусков в этом ходе не было — оповещаем

# Продолжилась ли работа после запуска: новый tool_use у ассистента либо
# не-tool_result сообщение (уведомление о завершении фонового агента,
# system-reminder и т.п.). Если да — ход дошёл до настоящего финала.
for o in turn[launch_idx + 1:]:
    if o.get("type") == "assistant":
        c = content_of(o)
        if isinstance(c, list) and any(
            isinstance(x, dict) and x.get("type") == "tool_use" for x in c
        ):
            sys.exit(1)
    elif o.get("type") in ("user", "system") and not is_pure_tool_result(o):
        sys.exit(1)

sys.exit(0)  # фоновая работа ещё не завершена — молчим
PY
then
  exit 0
fi

afplay /System/Library/Sounds/Glass.aiff
afplay "$(dirname "$0")/assets/finished.wav" &
