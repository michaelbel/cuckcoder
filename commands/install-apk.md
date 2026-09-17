---
description: Собрать через Gradle и поставить любой объявленный build variant APK на устройство в обход INSTALL_BASELINE_PROFILE_FAILED
model: claude-haiku-4-5-20251001
allowed-tools: Bash(adb:*), Bash(find:*), Bash(ls:*), Bash(bash:*), Bash(aapt2:*), Bash(./gradlew:*), Bash(../gradlew:*), AskUserQuestion
argument-hint: "[variant, напр. uatRelease | prodDebug | release]"
disable-model-invocation: true
---

Универсальная сборка и установка APK для любого Android-проекта. Запускать из корня проекта
(или модуля). Аргумент `$ARGUMENTS` — имя build variant в любом регистре и с любыми разделителями
(`uatRelease`, `uat-release`, `prod debug`, `release`). Скрипт сам узнаёт у Gradle, какие варианты
ОБЪЯВЛЕНЫ в проекте (по задачам `assemble<Variant>`, без сборки), и сам собирает выбранный вариант —
уже лежащий на диске APK не переиспользуется, пересборка выполняется всегда. Пусто — если объявлен
один non-debug вариант, собирается и ставится он; иначе скрипт завершается кодом 2 со списком всех
объявленных вариантов — в этом случае спроси пользователя через `AskUserQuestion`, какой вариант
поставить (один вопрос, один option на вариант, без preview), и запусти скрипт ещё раз, подставив
выбор в `RAW=` вместо `$ARGUMENTS`. debug-варианты в автовыбор и в список для вопроса не попадают
(бейслайн-профиль, из-за которого существует эта команда, у них не ставится) — поставить debug можно
только явным аргументом. Без длинных рассуждений — действуй.

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

# --- gradlew (запуск из корня проекта или из каталога модуля) ---
if [ -x ./gradlew ]; then
  GRADLEW=./gradlew
  GRADLE_ROOT=.
elif [ -x ../gradlew ]; then
  GRADLEW=../gradlew
  GRADLE_ROOT=..
else
  echo "gradlew не найден (ни ./gradlew, ни ../gradlew). Запусти команду из корня проекта или модуля."
  exit 1
fi

# --- объявленные варианты (assemble<Variant>-задачи, без сборки) ---
list_declared_variants() {
  SUBPROJECTS=$("$GRADLEW" -q projects 2>/dev/null | sed -n "s/.*Project '\(:[^']*\)'.*/\1/p" || true)
  { printf ':\n'; printf '%s\n' "$SUBPROJECTS"; } | while IFS= read -r p; do
    [ -n "$p" ] || continue
    if [ "$p" = ":" ]; then TARGET="tasks"; PREFIX=""; else TARGET="${p}:tasks"; PREFIX="${p}:"; fi
    "$GRADLEW" -q "$TARGET" --all 2>/dev/null | grep -E '^assemble[A-Za-z0-9]+ ' | awk '{print $1}' | while IFS= read -r t; do
      case "$t" in
        assembleTest) continue ;;
        assemble*AndroidTest|assemble*UnitTest) continue ;;
      esac
      VAR=${t#assemble}
      printf '%s\t%s%s\n' "$VAR" "$PREFIX" "$t"
    done
  done
}
VARIANTS=$(list_declared_variants | awk -F'\t' '!seen[$1]++')
if [ -z "$VARIANTS" ]; then
  echo "Объявленных build variant не найдено (нет задач assemble<Variant> ни в одном модуле)."
  exit 1
fi

# --- выбор варианта ---
# release-варианты: только на них ставится бейслайн-профиль, ради которого существует эта
# команда — debug сюда не попадает ни в автовыбор, ни в список для вопроса пользователю.
RELEASE_VARIANTS=$(printf '%s\n' "$VARIANTS" | awk -F'\t' 'tolower($1) !~ /debug/')

if [ -z "$NORM" ]; then
  if [ -z "$RELEASE_VARIANTS" ]; then
    echo "Объявлены только debug-варианты (бейслайн-профиль на них не ставится). Объявлены:"
    printf '%s\n' "$VARIANTS" | awk -F'\t' '{print "  - " $1}'
    echo "Чтобы всё же собрать и поставить один из них, укажи имя явно."
    exit 1
  elif [ "$(printf '%s\n' "$RELEASE_VARIANTS" | grep -c .)" -eq 1 ]; then
    LINE="$RELEASE_VARIANTS"
  else
    echo "Объявлено несколько release-вариантов:"
    printf '%s\n' "$RELEASE_VARIANTS" | awk -F'\t' '{print "  - " $1}'
    exit 2
  fi
else
  LINE=$(printf '%s\n' "$VARIANTS" | awk -F'\t' -v n="$NORM" 'tolower($1)==n')
  if [ -z "$LINE" ]; then
    LINE=$(printf '%s\n' "$VARIANTS" | awk -F'\t' -v n="$NORM" 'index(tolower($1),n)==1')
  fi
  if [ -z "$LINE" ]; then
    echo "Вариант '$RAW' не найден. Объявлены:"
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
ASSEMBLE_TASK=$(printf '%s' "$LINE" | awk -F'\t' '{print $2}')

# --- сборка (всегда заново, уже лежащий на диске APK не переиспользуется) ---
echo "Собираю: $ASSEMBLE_TASK"
"$GRADLEW" "$ASSEMBLE_TASK"

# --- поиск свежесобранного APK (outputs приоритетнее intermediates) ---
TARGET_LC=$(printf '%s' "$VARIANT" | tr '[:upper:]' '[:lower:]')
MATCHES=$(
  { find "$GRADLE_ROOT" -type d -path '*/build/outputs/apk' 2>/dev/null
    find "$GRADLE_ROOT" -type d -path '*/build/intermediates/apk' 2>/dev/null; } | while IFS= read -r root; do
    for d1 in "$root"/*/; do
      [ -d "$d1" ] || continue
      if ls "$d1"*.apk >/dev/null 2>&1; then
        n=$(basename "$d1" | tr '[:upper:]' '[:lower:]')
        [ "$n" = "$TARGET_LC" ] && printf '%s\n' "$d1"
      else
        for d2 in "$d1"*/; do
          [ -d "$d2" ] || continue
          ls "$d2"*.apk >/dev/null 2>&1 || continue
          n=$(printf '%s%s' "$(basename "$d1")" "$(basename "$d2")" | tr '[:upper:]' '[:lower:]')
          [ "$n" = "$TARGET_LC" ] && printf '%s\n' "$d2"
        done
      fi
    done
  done
)
if [ -z "$MATCHES" ]; then
  echo "Сборка прошла, но APK для варианта '$VARIANT' не найден в build/outputs или build/intermediates/apk."
  exit 1
fi
# при совпадении в нескольких модулях (коллизия имён) берём каталог с самым свежим APK
DIR=$(printf '%s\n' "$MATCHES" | while IFS= read -r d; do
  latest=$(ls -t "$d"*.apk 2>/dev/null | head -n1)
  [ -n "$latest" ] || continue
  mtime=$(stat -f '%m' "$latest" 2>/dev/null || stat -c '%Y' "$latest" 2>/dev/null)
  printf '%s\t%s\n' "$mtime" "$d"
done | sort -rn | head -n1 | awk -F'\t' '{print $2}')

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

Если скрипт завершился кодом 2 (несколько объявленных release-вариантов, аргумент не задан):
- вызови `AskUserQuestion` одним вопросом «Какой вариант поставить?» с header `"Вариант"`,
  перечислив ровно те варианты, что вывел скрипт (по одному option на вариант, без preview);
- запусти скрипт заново целиком, заменив в нём строку `RAW="$ARGUMENTS"` на
  `RAW="<выбор пользователя>"` — так он соберёт и поставит именно выбранный вариант.

Замечания:
- Ровно одно устройство, или задай `ANDROID_SERIAL` (его `adb` подхватывает автоматически).
- gradlew ищется как `./gradlew`, затем `../gradlew` (запуск из корня проекта или из каталога модуля).
- Список вариантов берётся у Gradle, а не с диска: `./gradlew -q projects` даёт список подпроектов,
  для каждого (и для корня) вызывается `<project>:tasks --all`, из него парсятся задачи вида
  `assemble<Variant>` — это метаданные, ничего не собирает. Исключены `assemble` без суффикса,
  `assembleTest` и `assemble*AndroidTest`/`assemble*UnitTest` — они не дают устанавливаемый APK.
- Выбранный вариант собирается заново командой `./gradlew <task>` при каждом запуске — уже
  собранный ранее APK на диске не переиспользуется.
- После сборки APK ищется на диске по каталогам `*/build/outputs/apk/**`, затем
  `*/build/intermediates/apk/**`, сопоставлением имени каталога (без учёта регистра) с именем
  варианта. При коллизии между модулями берётся каталог с самым свежесобранным APK; для надёжной
  disambiguation запускай команду из каталога нужного модуля.
- `applicationId` берётся из `output-metadata.json` рядом с APK — суффиксы flavor/buildType
  нигде не захардкожены; фолбэк — `aapt2` из Android SDK.
- `-r` сохраняет данные приложения, `-d` разрешает downgrade по versionCode.
- В автовыбор и в список для вопроса попадают только не-debug варианты (имя без `debug`, без учёта
  регистра) — именно на них ставится бейслайн-профиль. Поставить debug-вариант можно только явным
  аргументом (`/install-apk debug` и т.п.).
