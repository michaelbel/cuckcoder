#!/usr/bin/env bash
# install.sh — подключает cuckcoder к consumer-проекту под выбранный инструмент.
#
# Запускать из корня целевого проекта:
#   bash <(curl -fsSL https://raw.githubusercontent.com/michaelbel/cuckcoder/main/scripts/install.sh) <tool>
#
# Cuckcoder раздаётся прежде всего как MCP-сервер (`npx -y @michaelbel/cuckcoder-mcp`),
# который отдаёт правила, скиллы, агентов и workflow по требованию (`list`/`get_rule`/`get_skill`,
# `list_agents`/`get_agent`, `list_workflows`/`get_workflow`, `search`).
# Этот скрипт лишь прописывает сервер в конфиг нужного клиента и, где клиент умеет читать
# локальную папку скиллов, копирует `skills/`.
#
#   claude    — .mcp.json + подсказка про /plugin marketplace
#   codex     — блок [mcp_servers.cuckcoder] в ./.codex/config.toml
#   cursor    — .cursor/mcp.json + .cursor/rules/ (через sync-rules.sh)
#   gemini    — .gemini/extensions/cuckcoder/gemini-extension.json
#   windsurf  — глобальный ~/.codeium/windsurf/mcp_config.json + .windsurfrules
#   kimi      — .mcp.json (kimi читает тот же формат)
#   all       — всё вышеперечисленное
#
#   --help    — показать эту справку

set -euo pipefail

RAW="https://raw.githubusercontent.com/michaelbel/cuckcoder/main"
REPO="https://github.com/michaelbel/cuckcoder"
PKG="@michaelbel/cuckcoder-mcp"
TOOL="${1:-}"

print_help() {
    awk 'NR>1 && /^#/ { sub(/^# ?/, ""); print; next } NR>1 { exit }' "$0"
    cat <<'EOF'

Матрица возможностей:
  Возможность                      claude  codex  cursor  gemini  windsurf  kimi
  MCP-сервер (все инструменты)       ✓      ✓      ✓       ✓       ✓         ✓
  Локальные skills/                  ✓      ✓      ✓       ✓       —         ✓
  Агенты (саб-агенты)               ✓ (*)   —      —       —       —         —
  Хуки                              ✓ (*)   —      —       —       —         —
  Правила как файлы                  —      —      ✓       —       ✓         —

  (*) агенты и хуки — только при установке cuckcoder как плагина Claude Code целиком:
      /plugin marketplace add michaelbel/cuckcoder && /plugin install cuckcoder@cuckcoder
EOF
}

if [[ -z "$TOOL" || "$TOOL" == "--help" || "$TOOL" == "-h" || "$TOOL" == "help" ]]; then
    print_help
    [[ -z "$TOOL" ]] && exit 1 || exit 0
fi

need() { command -v "$1" >/dev/null 2>&1 || { echo "error: требуется '$1' в PATH"; exit 1; }; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fetch_repo() {
    need git
    echo "Клонирую cuckcoder..."
    git clone --depth=1 --quiet "$REPO" "$TMP/cuckcoder"
    SRC="$TMP/cuckcoder"
}

# --- слияние JSON MCP-конфига без перезаписи чужих серверов ---
merge_mcp_json() {
    local target="$1"
    need node
    mkdir -p "$(dirname "$target")"
    [[ -f "$target" ]] || echo '{}' > "$target"
    TARGET="$target" PKG="$PKG" node -e '
        const fs = require("fs");
        const p = process.env.TARGET;
        const json = JSON.parse(fs.readFileSync(p, "utf8") || "{}");
        json.mcpServers = json.mcpServers || {};
        json.mcpServers.cuckcoder = { command: "npx", args: ["-y", process.env.PKG] };
        fs.writeFileSync(p, JSON.stringify(json, null, 2) + "\n");
    '
    echo "  ✓ $target"
}

install_claude() {
    merge_mcp_json "./.mcp.json"
    echo "  Полный плагин (агенты + хуки) — внутри Claude Code:"
    echo "    /plugin marketplace add michaelbel/cuckcoder"
    echo "    /plugin install cuckcoder@cuckcoder"
}

install_kimi() {
    merge_mcp_json "./.mcp.json"
}

install_codex() {
    local cfg="./.codex/config.toml"
    mkdir -p "$(dirname "$cfg")"
    touch "$cfg"
    if grep -q '^\[mcp_servers.cuckcoder\]' "$cfg" 2>/dev/null; then
        echo "  ✓ $cfg (блок уже есть)"
        return
    fi
    cat >> "$cfg" <<EOF

[mcp_servers.cuckcoder]
command = "npx"
args = ["-y", "$PKG"]
EOF
    echo "  ✓ $cfg"
}

install_cursor() {
    merge_mcp_json "./.cursor/mcp.json"
    fetch_repo
    cp -r "$SRC/rules" "$TMP/rules-src"
    ( cd "$TMP/cuckcoder" && bash scripts/sync-rules.sh >/dev/null 2>&1 || true )
    if [[ -d "$TMP/cuckcoder/.cursor/rules" ]]; then
        mkdir -p ./.cursor/rules
        cp "$TMP/cuckcoder/.cursor/rules/"*.mdc ./.cursor/rules/
        echo "  ✓ .cursor/rules/ ($(ls ./.cursor/rules/*.mdc | wc -l | tr -d ' ') правил)"
    fi
    cp -r "$SRC/skills" ./skills
    echo "  ✓ skills/"
}

install_gemini() {
    fetch_repo
    local dir="./.gemini/extensions/cuckcoder"
    mkdir -p "$dir"
    cp "$SRC/gemini-extension.json" "$dir/gemini-extension.json"
    cp "$SRC/AGENTS.md" "$dir/GEMINI.md"
    cp -r "$SRC/skills" "$dir/skills"
    echo "  ✓ $dir/ (extension + skills)"
}

install_windsurf() {
    merge_mcp_json "$HOME/.codeium/windsurf/mcp_config.json"
    fetch_repo
    ( cd "$TMP/cuckcoder" && bash scripts/sync-rules.sh >/dev/null 2>&1 || true )
    [[ -f "$TMP/cuckcoder/.windsurfrules" ]] && cp "$TMP/cuckcoder/.windsurfrules" ./.windsurfrules && echo "  ✓ .windsurfrules"
}

echo "=== cuckcoder installer — $TOOL ==="
case "$TOOL" in
    claude)   install_claude ;;
    codex)    install_codex ;;
    cursor)   install_cursor ;;
    gemini)   install_gemini ;;
    windsurf) install_windsurf ;;
    kimi)     install_kimi ;;
    all)
        install_claude
        install_codex
        install_cursor
        install_gemini
        install_windsurf
        install_kimi
        ;;
    *)
        echo "error: неизвестный инструмент '$TOOL'"
        echo ""
        print_help
        exit 1
        ;;
esac

echo ""
echo "Готово. cuckcoder подключён для: $TOOL"
echo "Проверка MCP: npx -y $PKG  (stdio-сервер; клиент вызовет нужные инструменты сам)"
