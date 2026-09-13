---
description: Поставить любой собранный build variant APK на устройство в обход INSTALL_BASELINE_PROFILE_FAILED
model: claude-haiku-4-5-20251001
allowed-tools: Bash(adb:*), Bash(find:*), Bash(ls:*), Bash(bash:*), Bash(aapt2:*), AskUserQuestion
argument-hint: "[variant, напр. uatRelease | prodDebug | release]"
disable-model-invocation: true
---

Универсальная установка APK для любого Android-проекта. Запускать из корня проекта (или модуля).
Аргумент `$ARGUMENTS` — имя build variant в любом регистре и с любыми разделителями
(`uatRelease`, `uat-release`, `prod debug`, `release`). Пусто — если собран один release-вариант,
ставится он; иначе скрипт завершается кодом 2 со списком собранных вариантов — в этом случае
спроси пользователя через `AskUserQuestion`, какой вариант ставить (один вопрос, один option на
вариант, без preview), и запусти скрипт ещё раз, подставив выбор в `RAW=` вместо `$ARGUMENTS`.
debug-варианты в автовыбор и в список для вопроса не попадают (бейслайн-профиль, из-за которого
существует эта команда, у них не ставится) — поставить debug можно только явным аргументом.
Без длинных рассуждений — действуй.

Почему не через Android Studio: для release-сборок Studio ставит `adb install-multiple base.apk
base.dm`, где `.dm` — baseline-профиль; на части устройств его установка падает с
`INSTALL_BASELINE_PROFILE_FAILED` и откатывает всё. Здесь ставится одиночный `.apk` без `.dm` —
профиль не участвует. baseline-профиль — только AOT-оптимизация запуска, поведение не меняет.

```bash
set -eu

RAW="$ARGUMENTS"
NORM=$(printf '%s' "$RAW" | tr '[:upper:]' '[:lower:]' | tr -d ' _-')

# --- устройство ---
DEVS=$(adb devices | awk 'NR>1 && $2=="device" {print $1}')
N=$(printf '%s\n' "$DEVS" | grep -c . || true)
if [ "$N" -eq 0 ]; then echo "Нет подключённых устройств (adb devices)."; exit 1; fi
if [ "$N" -gt 1 ] && [ -z "${ANDROID_SERIAL:-}" ]; then
  echo "Несколько устройств — задай ANDROID_SERIAL=<serial>:"
  printf '%s\n' "$DEVS" | sed 's/^/  - /'
  exit 1
fi

# --- собранные варианты (outputs приоритетнее intermediates) ---
list_variants() {
  { find . -type d -path '*/build/outputs/apk' 2>/dev/null
    find . -type d -path '*/build/intermediates/apk' 2>/dev/null; } | while IFS= read -r root; do
    for d1 in "$root"/*/; do
      [ -d "$d1" ] || continue
      if ls "$d1"*.apk >/dev/null 2>&1; then
        printf '%s\t%s\n' "$(basename "$d1")" "$d1"
      else
        for d2 in "$d1"*/; do
          [ -d "$d2" ] || continue
          ls "$d2"*.apk >/dev/null 2>&1 || continue
          printf '%s\t%s\n' "$(basename "$d1")$(basename "$d2")" "$d2"
        done
      fi
    done
  done
}
VARIANTS=$(list_variants | awk -F'\t' '!seen[$1]++')
if [ -z "$VARIANTS" ]; then
  echo "Собранных APK не найдено. Сначала: ./gradlew :<module>:assemble<Variant>"
  exit 1
fi

# --- выбор варианта ---
# release-варианты: только на них ставится бейслайн-профиль, ради которого существует эта
# команда — debug сюда не попадает ни в автовыбор, ни в список для вопроса пользователю.
RELEASE_VARIANTS=$(printf '%s\n' "$VARIANTS" | awk -F'\t' 'tolower($1) !~ /debug/')

if [ -z "$NORM" ]; then
  if [ -z "$RELEASE_VARIANTS" ]; then
    echo "Собраны только debug-варианты (бейслайн-профиль на них не ставится). Собраны:"
    printf '%s\n' "$VARIANTS" | awk -F'\t' '{print "  - " $1}'
    echo "Чтобы всё же поставить один из них, укажи имя явно."
    exit 1
  elif [ "$(printf '%s\n' "$RELEASE_VARIANTS" | grep -c .)" -eq 1 ]; then
    LINE="$RELEASE_VARIANTS"
  else
    echo "Несколько release-вариантов собрано:"
    printf '%s\n' "$RELEASE_VARIANTS" | awk -F'\t' '{print "  - " $1}'
    exit 2
  fi
else
  LINE=$(printf '%s\n' "$VARIANTS" | awk -F'\t' -v n="$NORM" 'tolower($1)==n')
  if [ -z "$LINE" ]; then
    LINE=$(printf '%s\n' "$VARIANTS" | awk -F'\t' -v n="$NORM" 'index(tolower($1),n)==1')
  fi
  if [ -z "$LINE" ]; then
    echo "Вариант '$RAW' не найден. Собраны:"
    printf '%s\n' "$VARIANTS" | awk -F'\t' '{print "  - " $1}'
    exit 1
  fi
  if [ "$(printf '%s\n' "$LINE" | grep -c .)" -gt 1 ]; then
    echo "Неоднозначно '$RAW'. Подходят:"
    printf '%s\n' "$LINE" | awk -F'\t' '{print "  - " $1}'
    exit 1
  fi
fi
VARIANT=$(printf '%s' "$LINE" | awk -F'\t' '{print $1}')
DIR=$(printf '%s' "$LINE" | awk -F'\t' '{print $2}')

# --- applicationId из output-metadata.json ---
APP_ID=""
META="${DIR}output-metadata.json"
if [ -f "$META" ]; then
  APP_ID=$(grep -o '"applicationId"[ :]*"[^"]*"' "$META" | head -n1 | sed 's/.*"\([^"]*\)"$/\1/')
fi

# --- выбор apk-файла (учёт ABI-сплитов) ---
ABI=$(adb shell getprop ro.product.cpu.abi 2>/dev/null | tr -d '\r' || true)
CNT=$(ls "$DIR"*.apk 2>/dev/null | grep -c . || true)
if [ "$CNT" -eq 0 ]; then
  echo "APK не найден в $DIR"; exit 1
elif [ "$CNT" -eq 1 ]; then
  APK=$(ls "$DIR"*.apk)
else
  APK=""
  if [ -n "$ABI" ]; then APK=$(ls "$DIR"*"$ABI"*.apk 2>/dev/null | head -n1 || true); fi
  if [ -z "$APK" ]; then APK=$(ls "$DIR"*universal*.apk 2>/dev/null | head -n1 || true); fi
  if [ -z "$APK" ]; then
    APK=$(ls -t "$DIR"*.apk | head -n1)
    echo "Несколько APK, совпадения по ABI ($ABI) нет — беру свежий: $(basename "$APK")"
  fi
fi

# --- applicationId фолбэк через aapt2 ---
if [ -z "$APP_ID" ]; then
  SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
  AAPT=$(ls "$SDK"/build-tools/*/aapt2 2>/dev/null | sort -V | tail -n1 || true)
  if [ -z "$AAPT" ]; then AAPT=$(command -v aapt2 2>/dev/null || command -v aapt 2>/dev/null || true); fi
  if [ -n "$AAPT" ]; then
    APP_ID=$("$AAPT" dump badging "$APK" 2>/dev/null | sed -n "s/^package: name='\([^']*\)'.*/\1/p")
  fi
fi
if [ -z "$APP_ID" ]; then
  echo "Не удалось определить applicationId (нет output-metadata.json и aapt2)."
  exit 1
fi

echo "Variant: $VARIANT"
echo "APK:     $APK"
echo "App ID:  $APP_ID"

if ! adb install -r -d "$APK"; then
  echo "Не встало поверх — переустановка с нуля"
  adb uninstall "$APP_ID" || true
  adb install -d "$APK"
fi

adb shell monkey -p "$APP_ID" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
echo "Готово: $APP_ID ($VARIANT)"
```

Если скрипт завершился кодом 2 (несколько release-вариантов, аргумент не задан):
- вызови `AskUserQuestion` одним вопросом «Какой вариант поставить?» с header `"Вариант"`,
  перечислив ровно те варианты, что вывел скрипт (по одному option на вариант, без preview);
- запусти скрипт заново целиком, заменив в нём строку `RAW="$ARGUMENTS"` на
  `RAW="<выбор пользователя>"` — так он поставит именно выбранный APK.

Замечания:
- Ровно одно устройство, или задай `ANDROID_SERIAL` (его `adb` подхватывает автоматически).
- `applicationId` берётся из `output-metadata.json` рядом с APK — суффиксы flavor/buildType
  нигде не захардкожены; фолбэк — `aapt2` из Android SDK.
- Ищутся все модули: `*/build/outputs/apk/**`, затем `*/build/intermediates/apk/**` (сборка Studio).
  При коллизии имён вариантов между модулями берётся первый — запусти команду из каталога модуля.
- `-r` сохраняет данные приложения, `-d` разрешает downgrade по versionCode.
- В автовыбор и в список для вопроса попадают только не-debug варианты (имя без `debug`, без учёта
  регистра) — именно на них ставится бейслайн-профиль. Поставить debug-вариант можно только явным
  аргументом (`/install-apk debug` и т.п.).
