# Карта оформления MyApplication

Используй эту карту после экспорта tracked files из `MyApplication`. Сначала прочитай фактические
файлы шаблона: карта фиксирует его ожидаемую структуру, но не отменяет проверку новых tracked files.

## Обязательные замены

| Область             | Файл или путь                                                                      | Что изменить                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Gradle project name | `settings.gradle.kts`                                                              | `rootProject.name = "My Application"` на согласованное имя                                                               |
| Namespace           | `app/build.gradle.kts`                                                             | `namespace = "org.michaelbel.myapplication"` на новый namespace                                                          |
| Application ID      | `app/build.gradle.kts`                                                             | `applicationId = "org.michaelbel.myapplication"` на новый application ID                                                 |
| APK archive prefix  | `app/build.gradle.kts`                                                             | `MyApplication-v...` на имя артефакта без пробелов                                                                       |
| Kotlin package      | `app/src/**/kotlin/**/*.kt` и будущие `java` source sets                           | Старые package/import references на новый namespace                                                                      |
| Package directory   | `app/src/main/kotlin/org/michaelbel/myapplication` и существующие test source sets | Переместить в директорию, соответствующую сегментам нового namespace; удалить опустевшие каталоги                        |
| App label           | `app/src/main/res/values/strings.xml`                                              | `My Application` на display name приложения                                                                              |
| GitHub agent        | `.github/agents/android.agent.md`                                                  | Имя `MyApplication`, package и устаревшие утверждения о структуре проекта                                                |
| README              | `README.md`                                                                        | Старое имя, описание и все `michaelbel/myapplication` links на новый owner/repo; затем применить актуальные README rules |
| Git ignore          | `.gitignore`                                                                       | Сохранить build/local patterns и привести `.claude/`, `.idea/`, `!.idea/icon.svg` к актуальным repository rules          |
| IDE icon            | `.idea/icon.svg`                                                                   | Заменить выбранным asset из skill                                                                                        |

`AndroidManifest.xml` использует относительное имя `.MainActivity`, поэтому при совпадении namespace
и package отдельная замена обычно не нужна. Если application ID и namespace намеренно различаются,
проверь manifest/component resolution явно.

## Неприкосновенные значения

Не меняй при переименовании:

- содержимое `.github/debug-key.jks`;
- `keyAlias = "myapplication"`;
- `storeFile = rootProject.file(".github/debug-key.jks")`;
- существующие `keyPassword` и `storePassword`;
- имена `debug` signing config и debug build type.

Не печатай password-поля при проверке `app/build.gradle.kts`. Сравни checksum key store до и после
оформления; одного совпадения имени файла недостаточно.

## Что переносить из шаблона без переименования

- `.github/FUNDING.yml` и `.github/CODEOWNERS`, если owner остаётся `michaelbel`;
- `.github/workflows/ci.yml`, пока модуль остаётся `app` и output layout не меняется;
- `AGENTS.md`;
- Gradle wrapper, version catalog, SDK и dependency versions;
- launcher/splash drawables и тему как стартовое оформление, пока пользователь не запросил новый
  branding.

Проверь эти файлы на соответствие актуальным правилам. «Без переименования» не означает сохранять
устаревшую структуру, если источник правил уже изменился.

## Что нельзя переносить

Экспорт через `git archive HEAD` автоматически исключает большую часть списка. При другом способе
копирования явно исключи:

- `.git/` и историю `MyApplication`;
- `.gradle/`, `.kotlin/`, все `build/`;
- `local.properties`;
- `.DS_Store`;
- `.claude/settings.local.json`;
- `.idea/.name`, `*.iml`, `workspace.xml`, caches, device/deployment settings и прочие локальные IDE
  файлы.

В новом проекте tracked `.idea`-содержимым должен быть только `.idea/icon.svg`.

## Контрольный поиск

Ищи старые значения адресно во всех текстовых файлах, экспортированных из template `HEAD`. До
первого staging они ещё не считаются tracked в новом репозитории:

- `MyApplication`;
- `My Application`;
- `org.michaelbel.myapplication`;
- `michaelbel/myapplication`;
- старый package-directory path.

Отдельно проверь lowercase `myapplication`, исключив password-поля и бинарный key store. Единственное
обязательное оставшееся project-specific совпадение — `keyAlias = "myapplication"`; путь
`.github/debug-key.jks` также остаётся прежним.

## Итоговый checklist

- [ ] Новая директория содержит только экспортированные tracked files и осознанно созданные локальные файлы.
- [ ] История шаблона не перенесена; remote не добавлен без запроса.
- [ ] Gradle name, namespace, application ID и archive prefix согласованы.
- [ ] Kotlin package declarations и package directories совпадают.
- [ ] App label и README относятся к новому проекту.
- [ ] `.github/agents/android.agent.md` описывает новый проект.
- [ ] Выбран правильный Android/Compose/Jetpack icon.
- [ ] Debug key checksum не изменился, alias остался `myapplication`.
- [ ] В tracked text не осталось старых идентификаторов вне разрешённых signing-значений.
- [ ] После первого commit проходят `assembleDebug` и `lint`.
