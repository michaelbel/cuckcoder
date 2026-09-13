---
description: Поднять версию MCP-пакета, закоммитить, запушить и поставить релизный тег
model: claude-haiku-4-5-20251001
allowed-tools: Bash(git status:*), Bash(git rev-parse:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git tag:*), Bash(git log:*), Bash(git checkout:*), Bash(npm:*), Bash(node:*), Bash(ls:*), Bash(diff:*), Bash(comm:*), Bash(wc:*), Read, Edit, Grep, Glob
argument-hint: "[X.Y.Z]"
disable-model-invocation: true
---

Релиз npm-пакета `@michaelbel/cuckcoder-mcp`. Аргумент `$ARGUMENTS` — необязательная целевая
версия `X.Y.Z`; если пусто — patch-бамп (последняя цифра +1). Без длинных рассуждений — действуй.

Предусловия (нарушено — остановись, ничего не меняя, сообщи почему):
- Ветка `main` (`git rev-parse --abbrev-ref HEAD`).
- Рабочее дерево чистое (`git status --porcelain` пуст). Есть посторонние изменения — сначала `/commit`.

Шаги:
- Актуализация README (до бампа версии, отдельным коммитом при необходимости):
  - Сверь фактические файлы с соответствующими списками/таблицами в `README.md`:
    `rules/*.md` ↔ раздел «Правила», `skills/*` ↔ раздел «Скиллы», `agents/*.md` ↔ таблица в
    разделе «Агенты», `workflows/*.js` ↔ таблица в разделе «Workflows». Для «Hooks» источник
    истины — список хуков в `hooks/hooks.json` (не вся директория `hooks/`: там есть личные
    dev-хуки вроде `notify-done.sh`, подключённые только через `settings.json`, они в README не
    документируются).
  - На каждый добавленный файл — новая строка с кратким описанием в стиле соседних строк; на
    каждый удалённый — убери строку. Не гадай описание неизвестного тебе агента/скилла — прочитай
    его frontmatter/первую строку файла.
  - Пересчитай колонку «Сколько» в таблице «Из чего состоит харнесс» под факт.
  - Есть изменения — `git add README.md`, коммит `Actualize README with current rules/skills/agents/workflows lists`,
    последняя строка: Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>. Нет изменений —
    пропусти коммит.
- `OLD` = `node -p "require('./mcp/package.json').version"`.
- Бамп (обновит `mcp/package.json` и `mcp/package-lock.json`, печатает новую версию `vNEW`):
  - аргумент задан: `npm --prefix ./mcp version "$ARGUMENTS" --no-git-tag-version`
  - иначе: `npm --prefix ./mcp version patch --no-git-tag-version`
- `git add mcp/package.json mcp/package-lock.json`
- `git commit -m "Bump @michaelbel/cuckcoder-mcp from <OLD> to <NEW>"`, последняя строка сообщения:
  Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
- `git push origin main` и дождись успеха — `publish.yml` примет тег, только если коммит уже в
  `origin/main` (`post-commit` хук тоже пушит; повторный push безвреден).
- `git tag "mcp-v<NEW>"`
- `git push origin "mcp-v<NEW>"` — это запускает `.github/workflows/publish.yml` (публикация в npm).

`npm version` или коммит упали — откати бамп (`git checkout -- mcp/package.json mcp/package-lock.json`)
и сообщи.

В конце: `git log --oneline -1`, имя тега, напоминание что публикация идёт в GitHub Actions.
