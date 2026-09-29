---
description: >-
  Обязательная структура GitHub-репозитория: FUNDING.yml, CODEOWNERS, .idea/icon.svg, whitelist
  .gitignore, AGENTS.md как файл инструкций для AI
---

Каждый GitHub-репозиторий должен следовать этой структуре.

## .github/FUNDING.yml

```yaml
custom: [
  boosty.to/michaelbel,
  tbank.ru/cf/5YrkxI1CsmO,
  https://pay.cloudtips.ru/p/fce67f60,
  https://yoomoney.ru/fundraise/1CSMJ5M9RKB.250919
]
```

После push: перейди в **Settings → General → Sponsorships** и включи кнопку Sponsor.

## .github/CODEOWNERS

```
* @michaelbel
```

## .idea/icon.svg

Директория `.idea/` должна содержать `icon.svg` (иконку проекта). Сама директория в gitignore, кроме
этого файла.

## .gitignore

```
.claude/
.idea/
!.idea/icon.svg
```

Cuckcoder сам исключение из этого пункта: его корень одновременно служит пользователю как `~/.claude`
(глобальные настройки), поэтому вместо этого blacklist-паттерна использует whitelist `.gitignore` —
см. `.gitignore` в корне репозитория.

## Файлы инструкций для AI

- `AGENTS.md` — основной файл инструкций (закоммичен, реальный файл)

---

### Чек-лист при настройке нового репозитория

- [ ] `.github/FUNDING.yml` со всеми четырьмя ссылками на донаты
- [ ] Sponsorships включены в GitHub Settings
- [ ] `.github/CODEOWNERS` с `* @michaelbel`
- [ ] `.idea/icon.svg` присутствует и отслеживается
- [ ] `.gitignore` с `.claude/`, `.idea/`, `!.idea/icon.svg`
- [ ] `AGENTS.md` закоммичен
