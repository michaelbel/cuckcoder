Cuckcoder
=

[![last-commit](https://img.shields.io/github/last-commit/michaelbel/cuckcoder?style=for-the-badge&logo=github&labelColor=3F464F)](https://github.com/michaelbel/cuckcoder/commits)
[![npm](https://img.shields.io/npm/v/@michaelbel/cuckcoder-mcp?style=for-the-badge&logo=npm&labelColor=3F464F)](https://www.npmjs.com/package/@michaelbel/cuckcoder-mcp)

Cuckcoder — харнесс для AI coding-агентов: правила, скиллы, саб-агенты, агентные
workflow-пайплайны, guardrail-хуки и MCP-сервер для разработки на Kotlin, Android, Compose и KMP.
В Claude Code ставится одной командой как плагин; в любом другом клиенте с поддержкой MCP
(Codex, Cursor, Windsurf, Gemini CLI, Kimi Code и т.д.) подключается как обычный MCP-сервер.

## Из чего состоит харнесс

| Что                       | Где лежит     | Сколько | Что даёт                                                        |
| ------------------------- | ------------- | ------- | ---------------------------------------------------------------- |
| [Правила](#правила)       | `rules/`      | 35      | Соглашения проекта по Git, GitHub, Kotlin, Compose, KMP, Android |
| [Скиллы](#скиллы)         | `skills/`     | 19      | Пошаговые инструкции для конкретных задач реализации             |
| [Агенты](#агенты)         | `agents/`     | 22      | Саб-агенты с отдельной ролью, зоной ответственности и tools      |
| [Workflows](#workflows)   | `workflows/`  | 8       | Многошаговые агентные пайплайны (sweeps) поверх саб-агентов       |
| [Hooks](#hooks)           | `hooks/`      | 4       | Guardrails и напоминания, встроенные в цикл вызова инструментов  |
| [Scripts](#scripts)       | `scripts/`    | 2       | Standalone-установщик и генератор адаптеров правил для consumer-проектов |
| [MCP-сервер](#mcp-сервер) | `mcp/`        | —       | Отдаёт правила и скиллы агенту по требованию через `list`/`get_*` |

## Установка

### Claude Code — плагином (рекомендуется)

Корень репозитория одновременно является корнем Claude Code плагина. Плагин одной командой
подключает MCP-сервер, нативные `skills/` и `agents/`, а также hooks:

```
/plugin marketplace add michaelbel/cuckcoder
/plugin install cuckcoder@cuckcoder
```

Workflow-пайплайны из `workflows/` доступны сразу после установки плагина — отдельно
регистрировать их не нужно.

Для локальной разработки плагин можно подключить напрямую из рабочей копии:

```bash
claude --plugin-dir .
```

### Claude Code — только MCP-сервер

Если нужен только доступ к правилам и скиллам через MCP, без плагина целиком:

```bash
claude mcp add --global cuckcoder npx -- -y @michaelbel/cuckcoder-mcp
```

### Codex — плагином

```bash
codex plugin marketplace add michaelbel/cuckcoder
codex plugin add cuckcoder@cuckcoder
```

или вручную в `~/.codex/config.toml`:

```toml
[mcp_servers.cuckcoder]
command = "npx"
args = ["-y", "@michaelbel/cuckcoder-mcp"]
```

### Cursor

Плагином (манифест `.cursor-plugin/`) либо через `.mcp.json` репозитория.

### Windsurf

Нативного формата плагинов/skills у Windsurf нет — доступ к правилам и скиллам идёт только через
MCP-инструменты `list`/`get_rule`/`get_skill`. Добавьте сервер в `~/.codeium/windsurf/mcp_config.json`
(создайте файл, если его нет; конфиг общий на все проекты и применяется без перезапуска редактора):

```json
{
  "mcpServers": {
    "cuckcoder": {
      "command": "npx",
      "args": ["-y", "@michaelbel/cuckcoder-mcp"]
    }
  }
}
```

### Kimi Code — плагином

```
/plugins install https://github.com/michaelbel/cuckcoder
```

### Gemini CLI — расширением

```bash
gemini extensions install https://github.com/michaelbel/cuckcoder
```

### Любой другой MCP-клиент

Сервер — обычный stdio MCP-сервер, не привязанный к Claude: подключите
`npx -y @michaelbel/cuckcoder-mcp` как MCP-сервер в конфиге клиента (аналогично блоку
`mcp_servers.cuckcoder` для Codex выше).

### Глобальные настройки на Mac

Корень репозитория одновременно служит вторым чекаутом `~/.claude`: `rules/`, `agents/`, `skills/`,
`hooks/`, `settings.json` и `loop.md` подхватываются Claude Code нативно на любой машине без
установки плагина. `loop.md` задаёт, что делает `/loop` без промпта — maintenance-цикл: продолжить
незавершённую работу, проверить PR текущей ветки, иначе поискать баги и упрощения.
Продуктовые Kotlin/Compose/KMP/Android правила из `rules/` при этом не заливают контекст в каждом
проекте — они помечены `paths:`-фронтматтером и автозагружаются только в Android/Gradle-проектах;
процессные правила (`git`, `github-readme`, `github-repo`, `filesystem`, `workflow`) без `paths:`
применяются на этой машине везде.

Бутстрап существующего `~/.claude`:

```bash
bash setup.sh
```

Скрипт бэкапит текущий `~/.claude`, инициализирует git и сбрасывает на `origin/main`; локальное
состояние (сессии, кэши, credentials) не в whitelist `.gitignore` и не трогается. Дальше синк
завязан на коммит: `post-commit`-хук в `~/Projects/cuckcoder` пушит каждый коммит в `main` сразу
после его создания и тут же прогоняет `csync` (`hooks/sync-settings.sh`: rebase на `origin/main` →
push), обновляя чекаут `~/.claude` на этой машине. `csync` доступен и вручную как одноимённый
алиас. Незакоммиченные изменения синк пропускает — коммить их сам; конфликт при rebase
останавливает синк громко, с сообщением об ошибке, а не молча.

`settings.json` в самом синке не участвует: Claude Code переписывает его в рантайме (плагины,
модель, уведомления), поэтому `setup.sh` и `csync` помечают его `git update-index
--skip-worktree` в чекауте `~/.claude` — git не видит в нём локальных правок и не трогает его
при rebase, так что остальной репозиторий синкается независимо от его дрифта.

## Как пользоваться

- **Правила и скиллы** — агент сам вызывает MCP-инструменты `list`/`get_rule`/`get_skill`, когда
  задача требует конвенций проекта (например, редактирует `rules/mvi.md` из consumer-проекта) или
  подпадает под сценарий одного из скиллов (например, «добавь новый экран» → `get_skill` с именем
  `create-feature-scaffold-screen`). Отдельно вызывать эти инструменты вручную не нужно.
- **Агенты** — вызываются штатным способом Claude Code через инструмент `Agent`/`Task` с указанием
  `subagent_type` (например, `security-auditor` для read-only security-аудита или `kotlin-engineer`
  для реализации бизнес-логики). Доступны только там, где установлен плагин целиком (не в режиме
  «только MCP-сервер»).
- **Workflows** — многошаговые агентные sweep-пайплайны (`workflows/*.js`), которые оркестрируют
  несколько саб-агентов параллельно и сводят результат в один отчёт или диф. После установки
  плагина каждый workflow доступен как namespaced slash-команда
  `/cuckcoder:<имя-workflow> <аргументы>` (например, `/cuckcoder:full-review target:pr:123
  postComments:true`); директория `workflows/` подхватывается автоматически, отдельная регистрация
  не нужна. Свои аргументы каждого workflow — см. раздел [Workflows](#workflows).
- **Hooks** — работают автоматически после установки плагина, вмешательство не требуется; что
  именно они делают, см. в разделе [Hooks](#hooks).

## MCP-сервер

Предоставляет правила и скиллы AI-агентам в любом проекте. По умолчанию сервер читает встроенный
в npm-пакет снапшот `rules/`/`skills/` — работает офлайн, без GitHub и без сети.

### Инструменты

| Инструмент  | Описание                                                                  |
| ----------- | ------------------------------------------------------------------------- |
| `list`      | Список всех доступных имён правил и скиллов (с описаниями скиллов)        |
| `get_rule`  | Получить содержимое правила по имени вида `mvi`                           |
| `get_skill` | Получить инструкции скилла по имени вида `create-feature-scaffold-screen` |

Каждый вызов инструмента возвращает и человекочитаемый `content` (Markdown), и `structuredContent`
с тем же результатом в виде структуры:

```ts
list      -> { rules: string[], skills: { name: string, description: string }[], source: { kind: "bundled" | "github", ref: string } }
get_rule  -> { name: string, content: string, source: { kind, ref } }
get_skill -> { name: string, description: string, content: string, source: { kind, ref } }
```

Имена скиллов — простые kebab-case имена директорий, например `create-feature-scaffold-screen`, а не путь к
файлу (`create-feature-scaffold-screen/SKILL`). Имена правил — простые имена файлов без расширения и
категории, например `mvi`.

При ошибке инструмент возвращает `isError: true` с телом
`{ code, message, retryable, details? }`, где `code` — один из фиксированных кодов: `INVALID_NAME`,
`NOT_FOUND`, `GITHUB_TIMEOUT`, `GITHUB_RATE_LIMITED`, `GITHUB_UNREACHABLE`, `RESPONSE_TOO_LARGE`,
`INVALID_SOURCE_REF`, `INTERNAL_ERROR`.

### Источник данных: bundled snapshot vs GitHub

По умолчанию (`bundled`, источник по умолчанию) сервер копирует `rules/` и `skills/` в
`mcp/assets/` на этапе сборки и публикует их вместе с npm-пакетом — `list`/`get_rule`/`get_skill`
читают этот снапшот без единого сетевого запроса. Обновление правил и скиллов происходит через
публикацию новой версии пакета (`mcp-vX.Y.Z`), а не «на лету».

Опционально сервер можно перевести в режим чтения напрямую с GitHub, установив переменную
окружения `AI_WORKFLOW_SOURCE=github`. Этот режим:

- никогда не читает mutable-ветку `main`/`master`; по умолчанию использует immutable-тег
  `mcp-v${версия_пакета}`;
- позволяет переопределить ref через `AI_WORKFLOW_GITHUB_REF`, но принимает только immutable-тег
  вида `mcp-v<semver>` или полный 40-символьный commit SHA — всё остальное отклоняется с
  `INVALID_SOURCE_REF`;
- поддерживает необязательный `GITHUB_TOKEN` (передаётся только в заголовке `Authorization`,
  никогда не попадает в логи или тексты ошибок);
- имеет таймаут ~10 секунд на запрос, ограниченные повторные попытки (только для сетевых сбоев,
  `429` и подходящих `5xx`, с учётом `Retry-After`), ограничение размера ответа, ограниченный
  TTL-кэш с устареванием и де-дупликацией параллельных запросов, а также stale-фолбэк на последний
  успешный ответ, если очередной запрос не удался.
- остаётся read-only, но помечен `openWorldHint: true`, так как обращается вовне.

## Агенты

Саб-агенты Claude Code (`agents/*.md`) — каждый со своей ролью, зоной ответственности и набором
инструментов. Вызываются через `Agent`/`Task` с указанием `subagent_type`; многие из них также
переиспользуются внутри [workflows](#workflows) как этапы пайплайна.

| Агент                    | Роль                                                                          |
| ------------------------ | ------------------------------------------------------------------------------ |
| `architect-auditor`      | Архитектурный аудит кода и планов: границы модулей, связность, контракты      |
| `bug-hunter`              | Диагностика багов, крашей и падений сборки до попытки исправления             |
| `build-engineer`          | Gradle, convention plugins, version catalogs, AGP, производительность сборки  |
| `business-analyst`        | Проверка планов и фич с продуктовой точки зрения, acceptance criteria         |
| `code-refine`             | Упрощение уже проверенного кода без изменения поведения                       |
| `code-reviewer`           | Независимое семантическое ревью изменения по задаче и диффу                   |
| `compose-builder`         | Production UI на Jetpack Compose / Compose Multiplatform                      |
| `device-ui-tester`        | Проверка собранного приложения на устройстве/эмуляторе через `mobile` MCP     |
| `devops-expert`           | CI/CD, release workflows, деплой, секреты, мониторинг                         |
| `explorer`                | Быстрая карта кодовой базы: определения, callers, потоки данных               |
| `github-project-manager`  | GitHub Issues и Projects v2: read-only audit и явно запрошенные мутации       |
| `guide-android-builder`   | Scaffold, реализация сценариев и Gradle-валидация Android-проекта для `create-guide` |
| `guide-writer`            | Long-form страница-гайд в Notion по манифесту `create-guide`, отдельно от task databases |
| `kotlin-engineer`         | Production Kotlin вне Compose UI: ViewModels, use case, persistence, DI       |
| `mechanical-operator`     | Детерминированные пакетные изменения по полностью заданному рецепту           |
| `notion-project-manager`  | Task databases в Notion: read-only audit и явно запрошенные мутации           |
| `performance-reviewer`    | Доказательный аудит производительности JVM/Android/KMP                        |
| `security-auditor`        | Read-only security-аудит кода, диффа, архитектуры и планов                    |
| `swift-engineer`          | Production Swift вне UI для iOS/macOS и KMP-таргетов Apple                    |
| `swiftui-builder`         | Production SwiftUI для iOS/macOS/watchOS                                      |
| `tech-writer`             | Публичная документация репозитория: README, guides, references, changelog    |
| `ux-reviewer`             | Read-only UX-аудит кода, дизайна, плана или описания функции                  |

## Workflows

Многошаговые агентные sweep-пайплайны (`workflows/*.js`) поверх саб-агентов из `agents/`: каждый
файл описывает `meta.name`/`meta.description`, читает свои аргументы и параллельно запускает
несколько агентов, сводя результат в один отчёт, план или диф. Директория `workflows/` при
установленном плагине подхватывается автоматически; каждый workflow становится namespaced
slash-командой `/cuckcoder:<имя-workflow> <аргументы>`.

| Workflow                 | Аргументы                                | Что делает                                                                                |
| ------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `architecture-sweep`      | —                                          | Параллельный архитектурный аудит по всем модулям проекта, сведённый в один план улучшений  |
| `business-feature-sweep`  | `request`, `baseBranch`                    | Реализация фичи целиком: research → план/спека → параллельная реализация → валидация        |
| `full-review`              | `target`, `base`, `postComments`           | Мульти-линзовое ревью диффа/ветки/PR: correctness, security, performance, architecture, UX   |
| `mvi-compliance-sweep`    | —                                          | Проверка каждого ViewModel/Screen на соответствие MVI-правилам репозитория                  |
| `redesign-sweep`           | `target`                                   | Визуальный редизайн экрана или компонента без изменения бизнес-логики                       |
| `refactoring-sweep`       | `request`, `mode`, `severityFilter`        | Аудит → triage → (опционально) применение рефакторинга по проекту                           |
| `security-sweep`           | —                                          | Параллельный security-аудит по каждому модулю с независимой проверкой каждой находки        |
| `task-batch-create`        | `request`, `platform`, `target`            | Декомпозиция фичи/эпика на задачи и создание их всех параллельно в GitHub Issues или Notion |

Пример:

```
/cuckcoder:full-review target:pr:123 postComments:true
```

## Hooks

- `destructive-guard.sh` блокирует катастрофические Bash-команды (рекурсивное удаление
  корня/системных путей/домашней директории, форматирование ФС, запись поверх блочного
  устройства, fork bomb, pipe скачанного кода в shell, `git push --force` без
  `--force-with-lease`).
- `secret-read-guard.sh` блокирует Bash-команды, читающие или пересылающие секретные пути
  (`.env`, `secrets/`, `~/.ssh`, `~/.aws`, приватные ключи и сертификаты).
- `worktree-merge-back-reminder.sh` напоминает после закрытия worktree перенести изменения
  как незакоммиченные и перепроверить их в основной директории, не коммитя автоматически.
- `git-state-summary.sh` печатает в начале сессии worktree'ы, default branch и локальные
  feature-ветки — то, чего нет в нативном git-status харнесса.

## Scripts

Standalone-скрипты в `scripts/` — для consumer-проектов, из самого cuckcoder ничего не
генерируют (их выход не под контролем версий этого репозитория).

- `install.sh` — `curl | bash`-установщик: прописывает MCP-сервер cuckcoder в конфиг выбранного
  клиента (`claude` / `codex` / `cursor` / `gemini` / `windsurf` / `kimi` / `all`) и, где клиент
  читает локальную папку, копирует `skills/`. `--help` — матрица возможностей.
- `sync-rules.sh` — генерирует адаптеры правил из `rules/` для клиентов без нативного формата
  правил: `.cursor/rules/*.mdc` (по `paths:`-фронтматтеру → Cursor `globs`) и `.windsurfrules`
  (процессные правила). `--dry` — предпросмотр.

## Правила

Все файлы правил лежат непосредственно в `rules/`, без промежуточных директорий. Процессные правила
Git, GitHub и проекта подключены через `@`-импорты в `CLAUDE.md`. Правила Kotlin, Compose, KMP и
Android — продукт, который репозиторий поставляет в другие проекты; они читаются по требованию через
MCP `list`/`get_rule`.

- `architecture` — Правила архитектуры
- `compose` — Правила Compose
- `compose-bottom-sheet` — Правила Bottom Sheet
- `compose-color` — Правила цвета Compose
- `compose-constraintlayout` — Правила ConstraintLayout
- `compose-dialog` — Правила Dialog
- `compose-lazy` — Правила LazyList
- `compose-loading` — Правила Shimmer / Loading Placeholder
- `compose-preview` — Правила Preview
- `compose-scaffold` — Правила Scaffold
- `compose-screen` — Правила Compose-экранов
- `compose-spacing` — Правила отступов и размеров Compose
- `compose-textfield` — Правила TextField
- `compose-typography` — Правила типографики
- `domain` — Правила Domain
- `filesystem` — Правила проекта
- `git` — Правила Git
- `github-readme` — Правила GitHub README
- `github-repo` — Правила структуры репозитория
- `jetpack-navigation` — Правила навигации
- `jetpack-room` — Правила Room
- `jetpack-work` — Правила WorkManager
- `kmp` — Правила KMP
- `kotlin` — Правила Kotlin
- `kotlin-coroutines` — Правила корутин (scope, dispatchers, форматирование запуска)
- `kotlin-datetime` — Правила kotlin.time (Duration в delay вместо Long-миллисекунд)
- `mvi` — Правила MVI
- `mvi-error-handling` — Правила обработки ошибок в MVI
- `mvi-state` — Правила Model в MVI
- `network` — Правила сети
- `realtime` — Правила realtime-соединений
- `resource` — Правила ресурсов
- `security` — Правила безопасности (OWASP MASVS / Mobile Top 10, сжато)
- `usecase` — Правила UseCase
- `workflow` — Правила рабочего процесса

## Скиллы

Хранятся в `skills/{name}/SKILL.md`. Каждый файл начинается с YAML-frontmatter с полями `name`
(совпадает с именем директории) и `description` (когда использовать скилл, характерные фразы
пользователя и какой соседний скилл выбрать вместо него в похожем сценарии).

- `create-data-layer` — Собирает составной поток данных/domain из атомарных скиллов.
- `create-datastore-preference` — Создаёт типизированную настройку Preferences DataStore.
- `create-domain-mapper` — Создаёт KTX-маппер между network, Room и domain-моделями.
- `create-feature-alert-dialog` — Создаёт Compose-диалог проекта.
- `create-feature-bottom-sheet` — Создаёт Compose bottom sheet проекта.
- `create-feature-scaffold-screen` — Создаёт MVI-экран фичи проекта.
- `create-guide` — Создаёт связанный гайд: Android-проект + Notion-страница, по манифесту и research.
- `create-ktor-endpoint` — Создаёт Ktor endpoint и transport-модели.
- `create-notification-flow` — Создаёт поток локальных или push-уведомлений Android.
- `create-offline-outbox` — Создаёт durable offline-очередь мутаций через Room, WorkManager и Ktor.
- `create-paging-flow` — Создаёт Paging 3 pipeline для Room, network или RemoteMediator.
- `create-project-from-template` — Создаёт и оформляет новый Android-проект из `MyApplication`.
- `create-room-storage` — Создаёт законченную единицу Room-хранилища.
- `create-shared-component` — Создаёт переиспользуемый общий UI-компонент.
- `create-signalr-channel` — Создаёт SignalR realtime-канал и подключает его к session lifecycle.
- `create-usecase` — Создаёт один `UseCase` или `FlowUseCase` в `shared/domain/usecase`.
- `create-workmanager-task` — Создаёт WorkManager worker и use case планирования/отмены.
- `github-repo-settings` — Пошагово применяет и проверяет стандартные настройки GitHub-репозитория.
- `interview-me` — Структурированный опрос малыми пачками вопросов при нечётких требованиях: поднимает уверенность в них до ~95% перед постановкой задачи и делегированием, вместо угадывания.

Официальные скиллы Google/Android (адаптивный UI, CameraX, CLI `android`, Intent security,
Navigation 3, Styles API, Play policy insights, R8-анализ и др.) не вендорятся в этот репозиторий —
подключены как официальный плагин-маркетплейс `android-skills` (`android/skills`), см.
`settings.json`.

## Разработка

Все команды выполняются в каталоге `mcp/`:

```bash
npm ci             # установить зависимости
npm run dev         # запустить сервер локально через tsx
npm run build         # собрать dist/ (включает copy-assets)
npm test         # юнит-тесты (node:test через tsx)
npm run validate         # статические проверки repo (frontmatter, drift-регрессии, симлинки, версии...)
npm run smoke         # stdio smoke-тест собранного сервера
npm run check         # validate + test + build + smoke + npm pack --dry-run
```

CI (`.github/workflows/ci.yml`) запускает этот же набор на каждый `pull_request` и `push` в
`main`. Публикация (`.github/workflows/publish.yml`) срабатывает только на тег вида `mcp-vX.Y.Z`,
проверяет, что тег совпадает с версией в `mcp/package.json` и достижим из `origin/main`, и
публикует пакет только после прохождения полного набора проверок.
