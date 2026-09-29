# GitHub Guide Repository Rules

## Создание

По умолчанию:

- owner: `michaelbel`;
- visibility: `public`;
- имя: официальное имя темы в PascalCase;
- package: `org.michaelbel.<topic-lowercase>`;
- ветка: наследуется от актуального `MyApplication`;
- Android-проект создаётся без истории шаблона.

Примеры имён:

- `Insets`;
- `ListItem`;
- `NavigationSuiteScaffold`;
- `EyeDropper`.

Сокращённый package вроде `org.michaelbel.nss` допускается только при явной фиксации в манифесте.

## Общие правила

Следуй актуальным файлам:

- `rules/github/GITHUB_REPO_RULES.md`;
- `rules/github/GITHUB_README_RULES.md`;
- `rules/git/GIT_RULES.md`

из <https://github.com/michaelbel/cuckcoder>.

GuideKit дополнительно требует:

- `.guidekit/` с воспроизводимыми метаданными;
- README со списком samples или описанием scenario;
- ссылки README должны указывать на существующие пути;
- CI должен собирать debug APK;
- публичный репозиторий не содержит секретов и внутренних Notion IDs.

## AI-инструкции

В создаваемом репозитории:

- `AGENTS.md` — реальный файл.

`AGENTS.md` должен требовать:

1. правила `cuckcoder`;
2. чтение `.guidekit/manifest.yaml`;
3. сохранение соответствия с Notion-страницей;
4. обновление `.guidekit/SOURCES.md` и validation report при изменениях.

## README

README пишется на английском, если пользователь не указал иначе.

После обязательных секций `cuckcoder` добавь:

- `## Samples` для `catalog`;
- `## Scenario` для `scenario`;
- `## Build`;
- `## Sources`, если использовался AndroidX-код.

Каждая строка списка samples ссылается на точный файл или каталог.

## Метаданные

Описание репозитория — одно английское предложение. Добавь релевантные topics, но не используй общие теги вроде `project` или `sample` без предметного тега.
