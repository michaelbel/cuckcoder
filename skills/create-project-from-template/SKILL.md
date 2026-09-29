---
name: create-project-from-template
description: >-
  Use when пользователь просит создать и оформить новый Android-проект копированием шаблона
  `Projects/MyApplication`: задать имя проекта, package/namespace/applicationId, GitHub metadata,
  package directories и выбрать `.idea/icon.svg` для Android, Compose или Jetpack. Не используй
  для добавления модуля или фичи в существующий проект и не используй для проекта, который должен
  быть создан другим шаблоном или Android Studio wizard.
metadata:
  author: michaelbel
---

# Новый проект из MyApplication

Создай самостоятельный проект из закоммиченного состояния sibling-шаблона `MyApplication` и
полностью убери его пользовательские идентификаторы. Не переноси историю шаблона, локальные файлы
IDE или build outputs.

Перед изменениями полностью прочитай
[references/myapplication-checklist.md](references/myapplication-checklist.md). Это карта
обязательных замен и значений, которые нужно сохранить.

## Входные данные

Определи из запроса или согласуй только действительно неоднозначные значения:

- абсолютный путь новой директории и имя директории проекта;
- display name приложения и Gradle root project name;
- namespace; по умолчанию `org.michaelbel.<normalized-name>`;
- application ID; по умолчанию совпадает с namespace;
- GitHub owner и repo slug; по умолчанию `michaelbel` и нормализованное имя репозитория;
- тип иконки: `android`, `compose` или `jetpack`;
- краткое описание для README.

`<normalized-name>` означает lowercase ASCII-сегмент без пробелов, дефисов и других символов,
недопустимых в Kotlin package. Не угадывай другое имя бренда или другой owner. Если пользователь
явно задал значение, оно приоритетнее default.

Тип иконки определяй по назначению проекта:

- `android` — обычное Android-приложение;
- `compose` — проект или sample, главным предметом которого является Jetpack Compose;
- `jetpack` — проект библиотеки, компонента или sample из семейства AndroidX/Jetpack.

Выбор иконки не разрешает менять плагины, зависимости или архитектуру. Если назначение нельзя
надёжно определить из запроса, спроси только тип иконки.

## Рабочий процесс

1. Проверь, что `/Users/mihailbelyj/Projects/MyApplication` существует и является git-репозиторием.
   Изучи его актуальное закоммиченное состояние и `git status`. Если в шаблоне есть незакоммиченные
   изменения, не включай их молча: используй `HEAD` и сообщи об этом либо согласуй другой источник.
2. Убедись, что целевая директория не существует или пуста. Не объединяй шаблон с существующим
   проектом и не перезаписывай файлы без отдельного согласия.
3. Экспортируй именно tracked files из `HEAD`, например
   `git -C /Users/mihailbelyj/Projects/MyApplication archive HEAD | tar -x -C <empty-project-dir>`.
   Не копируй `.git`, `.gradle`, `.kotlin`, `build`, `local.properties`, `.DS_Store`,
   `.claude/settings.local.json` и остальные локальные файлы `.idea`.
4. Инициализируй новый git-репозиторий, не добавляя remote и не создавая commit без соответствующего
   запроса пользователя.
5. До текстовых замен вычисли checksum `.github/debug-key.jks`. Сохрани файл побайтово и не меняй
   debug signing block: `keyAlias = "myapplication"`, путь к key store и существующие credentials
   остаются прежними. Не выводи credentials в лог или ответ.
6. Выполни адресные изменения из checklist. Не делай глобальную замену `myapplication`, потому что
   это имя debug key должно остаться прежним.
7. Скопируй выбранный asset этого skill в `<project>/.idea/icon.svg`:
   `assets/icons/android.svg`, `assets/icons/compose.svg` или `assets/icons/jetpack.svg`. В git из
   `.idea` должен попадать только `icon.svg`.
8. Получи через `cuckcoder` MCP актуальные `github-repo` и
   `github-readme`, затем приведи tracked repository files к ним. Не добавляй
   placeholder-текст, выдуманный cover или неподтверждённые ссылки.
9. Просканируй экспортированный из шаблона набор текстовых файлов на старые project name, display
   name, package и GitHub repo slug; до первого staging не полагайся на пустой `git ls-files` нового
   репозитория. Проверяй signing block отдельным безопасным запросом, который не печатает
   password-поля.
10. Повтори checksum key store и проверь package directory, package declarations, namespace,
    application ID, archive name, app label, README links, IDE icon и AI-agent instructions.

## Проверка и завершение

- Проверь, что `.idea/icon.svg` не игнорируется.
- Не обновляй SDK, AGP, Kotlin или зависимости только потому, что создан новый проект.
- Не меняй launcher/splash artwork, CI или module names, если это не следует из отдельного запроса.
- Шаблон вычисляет `versionCode` через `git rev-list --count HEAD`, поэтому Gradle не сможет пройти
  конфигурацию до первого commit. Если commit не был запрошен, честно зафиксируй этот отложенный
  шаг вместо скрытого commit.
- После разрешённого первого commit запусти `./gradlew assembleDebug` и `./gradlew lint`. Исправь
  только ошибки, относящиеся к созданию проекта.
- External GitHub-настройки, remote, secrets и push выполняй только по явному запросу. Если remote
  уже создан и пользователь просит полностью оформить репозиторий, загрузи `github-repo-settings`
  и выполни его после локального создания проекта.
