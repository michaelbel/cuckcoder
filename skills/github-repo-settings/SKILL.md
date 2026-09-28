---
name: github-repo-settings
description: >-
  Use when пользователь просит настроить GitHub-репозиторий после создания — задать его description
  и topics, отключить Wikis, Issues, Discussions, Projects и Pull Requests, скрыть Releases,
  Packages и Deployments с главной страницы репозитория, включить Sponsorships, либо говорит
  "configure repo settings" или "set up GitHub repository". Применяет и проверяет настройки уровня
  репозитория пошагово через `gh`, документированный GitHub REST API и browser UI. Не используй для
  отслеживаемых файлов репозитория, таких как README.md, FUNDING.yml, CODEOWNERS или
  `.github/workflows`.
metadata:
  author: michaelbel
---

# Настройка GitHub-репозитория

Приведи уже созданный GitHub-репозиторий к стандартному состоянию. Это внешние изменения на
GitHub; они не разрешают редактировать tracked files, менять visibility, Actions, secrets,
collaborators, branch protection, Pages, merge policy или security settings.

## Целевое состояние

- задано короткое фактическое description;
- задано 3–6 релевантных lowercase topics;
- Wikis, Issues, Discussions, Projects и Pull Requests выключены;
- Releases, Packages и Deployments скрыты из блока About на главной странице;
- Sponsorships включены, если валидный `.github/FUNDING.yml` уже находится в default branch;
- GitHub Actions остаётся включённым.

## 1. Определи точный репозиторий

1. Если пользователь передал `OWNER/REPO` или URL, используй его.
2. Иначе получи remote из текущего проекта и разреши его через
   `gh repo view --json nameWithOwner -q .nameWithOwner`.
3. Перед любым write покажи в update точный `OWNER/REPO`. Не работай с репозиторием, который
   определился неоднозначно, и не полагайся на случайный current directory.
4. Выполни `gh auth status`, затем проверь
   `gh repo view OWNER/REPO --json viewerPermission,isArchived`. Нужен admin-доступ; archived
   repository не изменяй.

Не печатай auth token, secrets или полный environment.

## 2. Собери исходное состояние

Сначала выполни read-only проверки:

```bash
gh repo view OWNER/REPO \
  --json nameWithOwner,description,repositoryTopics,hasWikiEnabled,hasIssuesEnabled,hasDiscussionsEnabled,hasProjectsEnabled,viewerPermission,isArchived

gh api repos/OWNER/REPO \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  --jq '{has_pull_requests,default_branch,visibility}'
```

Проверь default branch на наличие `.github/FUNDING.yml`, не изменяя файл. Текущее состояние нужно
для итогового diff и чтобы не выполнять лишние write-запросы.

## 3. Подготовь description и topics

1. Возьми назначение проекта из README и фактического кода; не придумывай возможности продукта.
2. Сформулируй description одним коротким предложением без точки в конце, badges и marketing copy.
3. Выбери 3–6 topics по платформе, языку, UI/framework и назначению проекта. Topics должны быть
   lowercase, не длиннее 50 символов и содержать только буквы, цифры и дефисы.
4. Сохрани релевантные существующие topics и удали только устаревшие или относящиеся к шаблону.
   Если корректный итоговый набор нельзя вывести из проекта, согласуй его до write-запроса.

## 4. Примени CLI-настройки

Сначала установи description и отключи функции, которые поддерживает `gh repo edit`:

```bash
gh repo edit OWNER/REPO \
  --description "PROJECT_DESCRIPTION" \
  --enable-wiki=false \
  --enable-issues=false \
  --enable-discussions=false \
  --enable-projects=false
```

Затем приведи topics к согласованному точному набору. Endpoint заменяет весь список, поэтому не
запускай его до проверки текущих topics:

```bash
gh api --method PUT repos/OWNER/REPO/topics \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  -F 'names[]=TOPIC_ONE' \
  -F 'names[]=TOPIC_TWO' \
  -F 'names[]=TOPIC_THREE'
```

Отключи Pull Requests через документированный REST field, которого пока нет среди флагов
`gh repo edit`:

```bash
gh api --method PATCH repos/OWNER/REPO \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  -F has_pull_requests=false
```

Не объединяй эти операции с изменением visibility, default branch или merge settings. При `401`,
`403` или `404` остановись, перепроверь target/auth/permission и не повторяй write вслепую.

## 5. Примени UI-настройки

Используй доступный browser control с существующей авторизованной GitHub-сессией. Если browser
недоступен или пользователь не авторизован, не пытайся обходить login: перечисли оставшиеся шаги.

1. Открой главную страницу `https://github.com/OWNER/REPO`.
2. В блоке **About** нажми шестерёнку.
3. В **Include in the home page** выключи показанные **Releases**, **Packages** и **Deployments**,
   затем сохрани. Если конкретного переключателя нет, не имитируй его через private API — отметь
   его как отсутствующий в текущем UI.
4. Открой **Settings → General → Features**.
5. Если `.github/FUNDING.yml` существует в default branch, включи **Sponsorships**. Не создавай и
   не редактируй funding file в рамках этого skill.

Не используй private/undocumented endpoint для UI-only toggles: интерфейс может изменить внутренний
запрос без обратной совместимости.

## 6. Проверь результат

Повтори CLI-проверки из шага 2 и сравни их с целевым состоянием. Отдельно проверь topics:

```bash
gh api repos/OWNER/REPO/topics \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  --jq '.names'
```

В браузере обнови страницы About и Settings → General и убедись, что UI-переключатели сохранились.
Не считай задачу завершённой только по успешному exit code команды.

В финальном ответе кратко перечисли:

- настроенный `OWNER/REPO`;
- итоговые description и topics;
- подтверждённые выключенные функции;
- статус Releases/Packages/Deployments и Sponsorships;
- шаги, которые не удалось выполнить из-за permissions или отсутствия browser session.

## Актуальность API

Workflow основан на текущих официальных интерфейсах:

- [`gh repo edit`](https://cli.github.com/manual/gh_repo_edit);
- [REST: Update a repository](https://docs.github.com/en/rest/repos/repos?apiVersion=2026-03-10#update-a-repository);
- [REST: Replace all repository topics](https://docs.github.com/en/rest/repos/repos?apiVersion=2026-03-10#replace-all-repository-topics);
- [Disabling pull requests](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/disabling-pull-requests);
- [Displaying a sponsor button](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository).

Если GitHub отклоняет `X-GitHub-Api-Version: 2026-03-10` или документированный field, сначала
перепроверь актуальную официальную документацию. Не переключайся автоматически на private API.
