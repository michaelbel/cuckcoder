---
description: >-
  Фиксированная структура README: бейдж last-commit, описание в два предложения, скриншот, раздел
  Technologies с shields.io for-the-badge бейджами
---

Каждый README следует этой фиксированной структуре в этом порядке:

## 1. Бейдж last-commit (всегда первый)

```markdown
[![last-commit](https://img.shields.io/github/last-commit/<owner>/<repo>?style=for-the-badge&logo=github&labelColor=3F464F)](https://github.com/<owner>/<repo>/commits)
```

## 2. Описание проекта

Максимум два предложения. Обычный текст, без заголовков, описывает, что делает проект.

## 3. Скриншот

```markdown
<div align="left">
    <img src="cover.png" alt="Cover">
</div>
```

## 4. Технологии

Заголовок `## Technologies`, за которым следуют shield-бейджи, по одному на технологию, все
ссылаются на корень репозитория.

```markdown
## Technologies
[![<name>](https://img.shields.io/badge/<label>-<color>.svg?style=for-the-badge&logo=<logo>&logoColor=<color>)](https://github.com/<owner>/<repo>)
```

### Правила бейджей

Когда пользователь просит добавить бейджи, создавай бейджи shields.io в стиле `for-the-badge`.

- Бейджи технологий размещаются под `## Technologies`.
- Бейджи контактов, профиля, соцсетей, донатов и ресурсов размещаются в отдельном разделе,
  выбранном исходя из контекста README, например `## Contacts`, `## Links` или `## Resources`.
- Используй один Markdown-бейдж на строку.
- Используй официальные slug-и логотипов, когда shields.io их поддерживает.
- Используй inline-логотипы `data:image/svg+xml;base64,...`, когда у сервиса нет подходящего
  логотипа в shields.io или когда пользователь предоставляет кастомный логотип.
- Сохраняй целевые ссылки, предоставленные пользователем.
- Держи подписи короткими; используй `_` вместо пробелов внутри подписей бейджей shields.io.
- Если пользователь просит бейджи как в примерах ниже, используй те же цвета, логотипы и стиль
  ссылок, если он не попросит изменений.

Примеры бейджей технологий:

```markdown
[![Android](https://img.shields.io/badge/Android-50AE55?style=for-the-badge&logo=android&logoColor=F6F6F6)](https://d.android.com)
[![Kotlin](https://img.shields.io/badge/kotlin-7f52ff.svg?style=for-the-badge&logo=kotlin&logoColor=white)](https://d.android.com/kotlin)
[![KMP](https://img.shields.io/badge/KMP-7F52FF?&style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAgMzcuNjA0OFYwLjEzOTIxOUwzNy40NjU3IDM3LjYwNDhIMFpNMCA0Mi4zOTUzVjgwSDAuMDk1NDI4TDM3LjcwMDIgNDIuMzk1M0gwWk00My4zMTc3IDM2LjY4MjNMODAgMEg2LjYzNTQ3TDQzLjMxNzcgMzYuNjgyM1pNNDMuMzY1NSA0My41MDQ3TDYuODcwMTcgODBINzkuODYwN0w0My4zNjU1IDQzLjUwNDdaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K&logoColor=white)](https://www.jetbrains.com/kotlin-multiplatform)
[![Compose](https://img.shields.io/badge/compose-blue.svg?style=for-the-badge&logo=jetpackcompose&logoColor=white)](https://d.android.com/jetpack/compose)
[![Material](https://img.shields.io/badge/Material-004A76?&style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDBweCIgaGVpZ2h0PSI4MDBweCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICA8dGl0bGU+bWF0ZXJpYWxfZGVzaWduPC90aXRsZT4KICA8cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiLz4KICA8cGF0aCBkPSJNMjEsMTJhOSw5LDAsMCwwLTItNS42MlYxNy42M0E4Ljc4LDguNzgsMCwwLDAsMjEsMTJtLTMuMzcsN0g2LjM4YTkuNSw5LjUsMCwwLDAsMi42NywxLjQxQTguOTEsOC45MSwwLDAsMCwxMiwyMSw4Ljg2LDguODYsMCwwLDAsMTUsMjAuNDEsOS43Miw5LjcyLDAsMCwwLDE3LjYzLDE5TTExLDE3LDcsOXY4aDRtNi04LTQsOGg0VjltLTUsNS41M0wxNS43NSw3SDguMjVMMTIsMTQuNTNNMTcuNjMsNUE4LjkxLDguOTEsMCwwLDAsNi4zOCw1SDE3LjYzTTUsMTcuNjNWNi4zOEE5LDksMCwwLDAsMywxMmE4Ljc4LDguNzgsMCwwLDAsMiw1LjYzTTIzLDEyYTEwLjU3LDEwLjU3LDAsMCwxLTMuMjIsNy43OEExMC41NywxMC41NywwLDAsMSwxMiwyM2ExMC41OSwxMC41OSwwLDAsMS03Ljc4LTMuMjJBMTAuNTcsMTAuNTcsMCwwLDEsMSwxMiwxMC41OSwxMC41OSwwLDAsMSw0LjIyLDQuMjIsMTAuNTksMTAuNTksMCwwLDEsMTIsMWExMC41NywxMC41NywwLDAsMSw3Ljc4LDMuMjJBMTAuNTksMTAuNTksMCwwLDEsMjMsMTJaIiBmaWxsPSIjZmZmZmZmIi8+Cjwvc3ZnPg==&logoColor=white)](https://m3.material.io)
[![Git](https://img.shields.io/badge/GIT-E44C30?style=for-the-badge&logo=git&logoColor=white)](https://git-scm.com)
[![Codex](https://img.shields.io/badge/Codex-75Ab9E?&style=for-the-badge&logo=data:image/svg+xml;base64,<codex-svg-base64>&logoColor=white)](https://openai.com/codex)
[![Claude](https://img.shields.io/badge/Claude-D97757?&style=for-the-badge&logo=data:image/svg+xml;base64,<claude-svg-base64>&logoColor=white)](https://claude.ai)
```

Примеры бейджей контактов/профиля:

```markdown
[![](https://img.shields.io/badge/Telegram-24A1DE?&style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDciIGhlaWdodD0iMzkiIHZpZXdCb3g9IjAgMCA0NyAzOSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0zLjE3MjkyIDE2LjQ2NjRDMTUuNTYyNSAxMS4wNjg0IDIzLjgyNDIgNy41MDk3NSAyNy45NTggNS43OTAzOEMzOS43NjA3IDAuODgxMjMxIDQyLjIxMzIgMC4wMjg0NTkzIDQzLjgxMTcgMC4wMDAzMDAyMzhDNDQuMTYzMiAtMC4wMDU4OTMwMyA0NC45NDkzIDAuMDgxMjM3OSA0NS40NTg1IDAuNDk0NDJDNDUuODg4NSAwLjg0MzMwMyA0Ni4wMDY4IDEuMzE0NTkgNDYuMDYzNCAxLjY0NTM3QzQ2LjEyIDEuOTc2MTUgNDYuMTkwNSAyLjcyOTY4IDQ2LjEzNDUgMy4zMTg0NkM0NS40OTQ5IDEwLjAzODcgNDIuNzI3NCAyNi4zNDcgNDEuMzE5NCAzMy44NzM4QzQwLjcyMzcgMzcuMDU4NyAzOS41NTA2IDM4LjEyNjUgMzguNDE1IDM4LjIzMUMzNS45NDY5IDM4LjQ1ODIgMzQuMDcyOCAzNi42IDMxLjY4MjMgMzUuMDMzQzI3Ljk0MTggMzIuNTgxIDI1LjgyODYgMzEuMDU0NyAyMi4xOTc4IDI4LjY2MkMxOC4wMDE3IDI1Ljg5NjggMjAuNzIxOCAyNC4zNzcxIDIzLjExMzIgMjEuODkzM0MyMy43MzkgMjEuMjQzMyAzNC42MTMzIDExLjM1MjMgMzQuODIzOCAxMC40NTVDMzQuODUwMSAxMC4zNDI4IDM0Ljg3NDUgOS45MjQ1MSAzNC42MjYgOS43MDM2NEMzNC4zNzc1IDkuNDgyNzYgMzQuMDEwNyA5LjU1ODI5IDMzLjc0NjEgOS42MTgzNkMzMy4zNzA5IDkuNzAzNTEgMjcuMzk1MyAxMy42NTMxIDE1LjgxOTMgMjEuNDY3M0MxNC4xMjMyIDIyLjYzMiAxMi41ODY4IDIzLjE5OTUgMTEuMjEwNCAyMy4xNjk3QzkuNjkyODkgMjMuMTM2OSA2Ljc3Mzg4IDIyLjMxMTcgNC42MDM5MSAyMS42MDY0QzEuOTQyMzQgMjAuNzQxMiAtMC4xNzMwMTkgMjAuMjgzOCAwLjAxMTE4MTUgMTguODE0NEMwLjEwNzEyNCAxOC4wNDkxIDEuMTYxMDQgMTcuMjY2NCAzLjE3MjkyIDE2LjQ2NjRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K)](https://t.me/michaelbel)
[![](https://img.shields.io/badge/LinkedIn-0077B5?&style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzUiIGhlaWdodD0iNzUiIHZpZXdCb3g9IjAgMCA3NSA3NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik03NSA3NUg1OS41ODk4VjQ4Ljc1MzFDNTkuNTg5OCA0MS41NTY5IDU2Ljg1NTUgMzcuNTM1NCA1MS4xNTk3IDM3LjUzNTRDNDQuOTYzNCAzNy41MzU0IDQxLjcyNjEgNDEuNzIwNCA0MS43MjYxIDQ4Ljc1MzFWNzVIMjYuODc1VjI1SDQxLjcyNjFWMzEuNzM1QzQxLjcyNjEgMzEuNzM1IDQ2LjE5MTQgMjMuNDcyNCA1Ni44MDE4IDIzLjQ3MjRDNjcuNDA3MiAyMy40NzI0IDc1IDI5Ljk0ODggNzUgNDMuMzQzMVY3NVpNOS4xNTc3MSAxOC40NTI5QzQuMDk5MTIgMTguNDUyOSAwIDE0LjMyMTYgMCA5LjIyNjQ1QzAgNC4xMzEyOCA0LjA5OTEyIDAgOS4xNTc3MSAwQzE0LjIxNjMgMCAxOC4zMTMgNC4xMzEyOCAxOC4zMTMgOS4yMjY0NUMxOC4zMTMgMTQuMzIxNiAxNC4yMTYzIDE4LjQ1MjkgOS4xNTc3MSAxOC40NTI5Wk0xLjQ4OTI2IDc1SDE2Ljk3NTFWMjVIMS40ODkyNlY3NVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=)](https://linkedin.com/in/michael-bel)
[![](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:michaelbel24865@gmail.com)
[![](https://img.shields.io/badge/Boosty-F15F2C?style=for-the-badge&logo=boosty&logoColor=F6F6F6)](https://boosty.to/michaelbel)
[![](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@michaelbely)
[![](https://img.shields.io/badge/LeetCode-282828?style=for-the-badge&logo=leetcode&logoColor=FFA116)](https://leetcode.com/u/michaelbel)
```

Примеры бейджей ресурсов/сообщества:

```markdown
[![](https://img.shields.io/badge/Telegram_Канал-24A1DE?&style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDciIGhlaWdodD0iMzkiIHZpZXdCb3g9IjAgMCA0NyAzOSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0zLjE3MjkyIDE2LjQ2NjRDMTUuNTYyNSAxMS4wNjg0IDIzLjgyNDIgNy41MDk3NSAyNy45NTggNS43OTAzOEMzOS43NjA3IDAuODgxMjMxIDQyLjIxMzIgMC4wMjg0NTkzIDQzLjgxMTcgMC4wMDAzMDAyMzhDNDQuMTYzMiAtMC4wMDU4OTMwMyA0NC45NDkzIDAuMDgxMjM3OSA0NS40NTg1IDAuNDk0NDJDNDUuODg4NSAwLjg0MzMwMyA0Ni4wMDY4IDEuMzE0NTkgNDYuMDYzNCAxLjY0NTM3QzQ2LjEyIDEuOTc2MTUgNDYuMTkwNSAyLjcyOTY4IDQ2LjEzNDUgMy4zMTg0NkM0NS40OTQ5IDEwLjAzODcgNDIuNzI3NCAyNi4zNDcgNDEuMzE5NCAzMy44NzM4QzQwLjcyMzcgMzcuMDU4NyAzOS41NTA2IDM4LjEyNjUgMzguNDE1IDM4LjIzMUMzNS45NDY5IDM4LjQ1ODIgMzQuMDcyOCAzNi42IDMxLjY4MjMgMzUuMDMzQzI3Ljk0MTggMzIuNTgxIDI1LjgyODYgMzEuMDU0NyAyMi4xOTc4IDI4LjY2MkMxOC4wMDE3IDI1Ljg5NjggMjAuNzIxOCAyNC4zNzcxIDIzLjExMzIgMjEuODkzM0MyMy43MzkgMjEuMjQzMyAzNC42MTMzIDExLjM1MjMgMzQuODIzOCAxMC40NTVDMzQuODUwMSAxMC4zNDI4IDM0Ljg3NDUgOS45MjQ1MSAzNC42MjYgOS43MDM2NEMzNC4zNzc1IDkuNDgyNzYgMzQuMDEwNyA5LjU1ODI5IDMzLjc0NjEgOS42MTgzNkMzMy4zNzA5IDkuNzAzNTEgMjcuMzk1MyAxMy42NTMxIDE1LjgxOTMgMjEuNDY3M0MxNC4xMjMyIDIyLjYzMiAxMi41ODY4IDIzLjE5OTUgMTEuMjEwNCAyMy4xNjk3QzkuNjkyODkgMjMuMTM2OSA2Ljc3Mzg4IDIyLjMxMTcgNC42MDM5MSAyMS42MDY0QzEuOTQyMzQgMjAuNzQxMiAtMC4xNzMwMTkgMjAuMjgzOCAwLjAxMTE4MTUgMTguODE0NEMwLjEwNzEyNCAxOC4wNDkxIDEuMTYxMDQgMTcuMjY2NCAzLjE3MjkyIDE2LjQ2NjRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K)](https://t.me/+QBkL98rFVfs0ZGNi)
[![](https://img.shields.io/badge/Карьерный_Роадмап-2C2C2E?style=for-the-badge&logo=notion&logoColor=white)](https://michaelbel.notion.site/ANDROID-CAREER-689a0c8ce744419f8f53446e5e68e8f1)
```

---

### Полный пример

```markdown
[![last-commit](https://img.shields.io/github/last-commit/michaelbel/total?style=for-the-badge&logo=github&labelColor=3F464F)](https://github.com/michaelbel/total/commits)

Веб-калькулятор, который складывает числа, введённые столбиком, и сразу показывает итоговую сумму.

<div align="left">
    <img src="cover.png" alt="Cover">
</div>

## Technologies
[![js](https://img.shields.io/badge/javascript-F7E018.svg?style=for-the-badge&logo=javascript&logoColor=black)](https://github.com/michaelbel/total)
[![html](https://img.shields.io/badge/html-E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)](https://github.com/michaelbel/total)
[![css](https://img.shields.io/badge/css-663399.svg?style=for-the-badge&logo=css&logoColor=white)](https://github.com/michaelbel/total)
```
