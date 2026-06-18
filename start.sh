#!/usr/bin/env bash
#
# start.sh — one-command bootstrap + launch for the KRANG local AI chat UI.
#
# Safe to run repeatedly: it installs only what is missing, starts Ollama only
# if it isn't already running, and launches the web app. On macOS it uses
# Homebrew; on Linux it uses the distro package manager plus Ollama's official
# installer.
#
#   ./start.sh
#
set -euo pipefail

# ---------------------------------------------------------------------------
# Pretty output helpers
# ---------------------------------------------------------------------------
if [[ -t 1 ]]; then
  BOLD="$(printf '\033[1m')"; DIM="$(printf '\033[2m')"; RESET="$(printf '\033[0m')"
  GREEN="$(printf '\033[32m')"; YELLOW="$(printf '\033[33m')"; RED="$(printf '\033[31m')"; BLUE="$(printf '\033[34m')"
else
  BOLD=""; DIM=""; RESET=""; GREEN=""; YELLOW=""; RED=""; BLUE=""
fi
info()  { echo "${BLUE}${BOLD}==>${RESET} $*"; }
ok()    { echo "${GREEN}  ✓${RESET} $*"; }
warn()  { echo "${YELLOW}  !${RESET} $*"; }
err()   { echo "${RED}  ✗${RESET} $*" >&2; }
have()  { command -v "$1" >/dev/null 2>&1; }

# Run script from its own directory regardless of where it was invoked.
cd "$(dirname "${BASH_SOURCE[0]}")"

OLLAMA_HOST_URL="http://localhost:11434"
DEFAULT_MODEL="llama3.2"
OLLAMA_PID=""   # set if *we* start `ollama serve`, so cleanup only kills ours

# ---------------------------------------------------------------------------
# Detect platform
# ---------------------------------------------------------------------------
case "$(uname -s)" in
  Darwin) PLATFORM="mac" ;;
  Linux)  PLATFORM="linux" ;;
  *) err "Unsupported OS: $(uname -s). This script supports macOS and Linux."; exit 1 ;;
esac
info "Platform: ${BOLD}${PLATFORM}${RESET}"

# Detect a Linux package manager (only used on Linux).
detect_pkg_mgr() {
  if   have apt-get; then echo "apt"
  elif have dnf;     then echo "dnf"
  elif have pacman;  then echo "pacman"
  elif have zypper;  then echo "zypper"
  else echo ""; fi
}

# ---------------------------------------------------------------------------
# Install Node.js if missing (or too old — Vite 5 needs Node 18+)
# ---------------------------------------------------------------------------
NODE_MIN_MAJOR=18

# Gate that decides whether we can skip the Node install. A stale Node fails
# here (not just a missing one) so the install path also handles upgrades.
node_ok() {
  have node && have npm || return 1
  local major
  # `node -v` prints e.g. "v20.11.0"; strip the leading "v" and minor/patch.
  major="$(node -v | sed 's/^v//;s/\..*//')"
  [[ "$major" =~ ^[0-9]+$ && "$major" -ge "$NODE_MIN_MAJOR" ]]
}

install_node() {
  if node_ok; then
    ok "Node.js $(node -v) already installed"
    return
  fi
  if have node; then
    warn "Node.js $(node -v) is too old (need ${NODE_MIN_MAJOR}+) — upgrading…"
  else
    info "Node.js not found — installing…"
  fi
  if [[ "$PLATFORM" == "mac" ]]; then
    if ! have brew; then
      err "Homebrew is required to auto-install Node on macOS but was not found."
      err "Install Homebrew from https://brew.sh then re-run, or install Node from https://nodejs.org"
      exit 1
    fi
    brew install node
  else
    local pm; pm="$(detect_pkg_mgr)"
    case "$pm" in
      apt)
        # NodeSource gives a current LTS; distro packages are often stale.
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
        ;;
      dnf)    sudo dnf install -y nodejs npm ;;
      pacman) sudo pacman -Sy --noconfirm nodejs npm ;;
      zypper) sudo zypper install -y nodejs npm ;;
      *) err "No supported package manager found. Install Node.js 18+ from https://nodejs.org"; exit 1 ;;
    esac
  fi
  ok "Node.js $(node -v) installed"
}

# ---------------------------------------------------------------------------
# Install Ollama if missing
# ---------------------------------------------------------------------------
install_ollama() {
  if have ollama; then
    ok "Ollama already installed ($(ollama --version 2>/dev/null | head -1))"
    return
  fi
  info "Ollama not found — installing…"
  if [[ "$PLATFORM" == "mac" ]]; then
    if have brew; then
      brew install ollama
    else
      err "Homebrew not found. Install Ollama from https://ollama.com/download then re-run."
      exit 1
    fi
  else
    # Official installer handles all major Linux distros (and systemd setup).
    curl -fsSL https://ollama.com/install.sh | sh
  fi
  ok "Ollama installed"
}

# ---------------------------------------------------------------------------
# Ensure the Ollama API is up; start `ollama serve` in the background if not.
# ---------------------------------------------------------------------------
ollama_is_up() { curl -fsS "${OLLAMA_HOST_URL}/api/tags" >/dev/null 2>&1; }

start_ollama() {
  if ollama_is_up; then
    ok "Ollama is already running"
    return
  fi
  info "Starting Ollama service…"
  ollama serve >/tmp/krang-ollama.log 2>&1 &
  OLLAMA_PID=$!
  # Wait up to ~20s for the API to respond.
  for _ in $(seq 1 40); do
    if ollama_is_up; then ok "Ollama service is up (pid ${OLLAMA_PID})"; return; fi
    sleep 0.5
  done
  err "Ollama did not become ready in time. See /tmp/krang-ollama.log"
  exit 1
}

# ---------------------------------------------------------------------------
# Pull a default model if none are installed (interactive).
# ---------------------------------------------------------------------------
ensure_model() {
  # Count installed models by tallying "name" keys in the /api/tags JSON. We
  # grep rather than parse with jq so the script has no dependency beyond curl.
  local tags model_count
  tags="$(curl -fsS "${OLLAMA_HOST_URL}/api/tags" 2>/dev/null || echo '{}')"
  model_count="$(printf '%s' "$tags" | grep -o '"name"' | wc -l | tr -d ' ')"
  if [[ "$model_count" != "0" ]]; then
    ok "${model_count} model(s) already installed"
    return
  fi
  warn "No models installed."
  printf "    Pull the default model ${BOLD}%s${RESET} now? (~2GB) [Y/n] " "$DEFAULT_MODEL"
  # Read from /dev/tty, not stdin: this keeps the prompt working even when the
  # script is piped (e.g. `curl … | bash`). If no terminal is attached, default
  # to skipping so an unattended run never blocks on a 2GB download.
  read -r reply </dev/tty || reply="n"
  case "${reply:-y}" in
    [Nn]*) warn "Skipping. You can pull one later in-app or with: ollama pull ${DEFAULT_MODEL}" ;;
    *)     info "Pulling ${DEFAULT_MODEL}…"; ollama pull "$DEFAULT_MODEL"; ok "Model ready" ;;
  esac
}

# ---------------------------------------------------------------------------
# Install npm deps if needed.
# ---------------------------------------------------------------------------
install_deps() {
  if [[ -d node_modules ]]; then
    ok "npm dependencies already installed"
  else
    info "Installing npm dependencies…"
    npm install
    ok "Dependencies installed"
  fi
}

# ---------------------------------------------------------------------------
# Cleanup: stop the Ollama process we started (leave a pre-existing one alone).
# ---------------------------------------------------------------------------
cleanup() {
  if [[ -n "$OLLAMA_PID" ]] && kill -0 "$OLLAMA_PID" 2>/dev/null; then
    echo
    info "Stopping Ollama service we started (pid ${OLLAMA_PID})…"
    kill "$OLLAMA_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# ---------------------------------------------------------------------------
# Parse flags. --dev runs the Vite dev server (hot reload) instead of building
# and serving an optimized bundle; handy for contributors hacking on the UI.
# ---------------------------------------------------------------------------
DEV=0
for arg in "$@"; do
  case "$arg" in
    --dev) DEV=1 ;;
    *) warn "Unknown option: $arg (ignored)" ;;
  esac
done

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
echo "${BOLD}KRANG local AI: setup & launch${RESET}"
install_node
install_ollama
start_ollama
ensure_model
install_deps

if [[ "$DEV" == "1" ]]; then
  info "Launching dev server on ${BOLD}http://localhost:5173${RESET} (hot reload)"
  echo "${DIM}    (Press Ctrl+C to stop both the web app and Ollama.)${RESET}"
  npm run dev -- --port 5173
else
  # Build the optimized production bundle, then serve it. We always rebuild so
  # the served app reflects the current source. `preview` is pinned to 5173 (its
  # default is 4173) to keep the app on one predictable port.
  info "Building production bundle..."
  npm run build
  ok "Build complete"

  info "Launching web app on ${BOLD}http://localhost:5173${RESET}"
  echo "${DIM}    (Press Ctrl+C to stop both the web app and Ollama.)${RESET}"
  npm run preview -- --port 5173
fi
