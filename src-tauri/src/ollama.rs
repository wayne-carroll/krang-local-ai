// System-level Ollama lifecycle for the desktop app: detect, start, and (if
// missing) download+install Ollama into a sandboxed app directory. All of this
// is desktop-only; the web build never touches it.

use std::path::PathBuf;
use std::process::Child;
use std::sync::Mutex;
use std::time::Duration;

use futures_util::StreamExt;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};

const OLLAMA_BASE: &str = "http://localhost:11434";

// Official macOS standalone bundle: a gzipped tarball containing the `ollama`
// binary plus its runtime libraries (llama-server, libggml-*, dylibs). The
// whole archive must be extracted together; the binary won't run without its
// siblings. Verify this asset name stays current when updating Ollama support
// (it has moved between releases before).
const OLLAMA_DARWIN_URL: &str =
    "https://github.com/ollama/ollama/releases/latest/download/ollama-darwin.tgz";

// Absolute fallbacks to check when `which` can't help. GUI-launched apps on
// macOS get a minimal PATH, so probing common install locations matters.
const CANDIDATE_PATHS: &[&str] = &[
    "/Applications/Ollama.app/Contents/Resources/ollama",
    "/opt/homebrew/bin/ollama",
    "/usr/local/bin/ollama",
];

/// Holds the `ollama serve` child *we* spawned, so on exit we kill only ours
/// and never a pre-existing system Ollama.
#[derive(Default)]
pub struct OllamaProcess(pub Mutex<Option<Child>>);

#[derive(Clone, Serialize)]
struct SetupProgress {
    phase: String, // "check" | "download" | "start" | "ready"
    percent: Option<u8>,
    message: String,
}

fn emit(app: &AppHandle, phase: &str, percent: Option<u8>, message: &str) {
    let _ = app.emit(
        "ollama-setup",
        SetupProgress {
            phase: phase.into(),
            percent,
            message: message.into(),
        },
    );
}

/// Probe the Ollama API; true if it answers a 2xx within a short timeout.
#[tauri::command]
pub async fn is_ollama_running() -> bool {
    let client = match reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
    {
        Ok(c) => c,
        Err(_) => return false,
    };
    matches!(
        client.get(format!("{OLLAMA_BASE}/api/tags")).send().await,
        Ok(r) if r.status().is_success()
    )
}

/// Resolve a usable `ollama` binary path: PATH first, then common absolute
/// locations, then the sandboxed app-data `bin/ollama` we may have installed.
fn resolve_ollama_path(app: &AppHandle) -> Option<String> {
    if let Ok(output) = std::process::Command::new("which").arg("ollama").output() {
        if output.status.success() {
            let p = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !p.is_empty() {
                return Some(p);
            }
        }
    }
    for candidate in CANDIDATE_PATHS {
        if PathBuf::from(candidate).exists() {
            return Some((*candidate).to_string());
        }
    }
    if let Ok(dir) = app.path().app_data_dir() {
        let p = dir.join("bin").join("ollama");
        if p.exists() {
            return Some(p.to_string_lossy().to_string());
        }
    }
    None
}

#[tauri::command]
pub fn is_ollama_installed(app: AppHandle) -> bool {
    resolve_ollama_path(&app).is_some()
}

/// Spawn `ollama serve` (from the resolved binary) with permissive CORS so the
/// WebView origin is accepted, store the child, and poll until it answers.
#[tauri::command]
pub async fn start_ollama(app: AppHandle, state: State<'_, OllamaProcess>) -> Result<(), String> {
    let path = resolve_ollama_path(&app).ok_or_else(|| "Ollama binary not found".to_string())?;

    let child = std::process::Command::new(&path)
        .arg("serve")
        .env("OLLAMA_ORIGINS", "*")
        .spawn()
        .map_err(|e| format!("Failed to launch Ollama: {e}"))?;

    if let Ok(mut guard) = state.0.lock() {
        *guard = Some(child);
    }

    // Wait up to ~20s for the API to come up.
    for _ in 0..40 {
        if is_ollama_running().await {
            return Ok(());
        }
        tokio::time::sleep(Duration::from_millis(500)).await;
    }
    Err("Ollama did not become ready in time".into())
}

/// Download the official macOS Ollama bundle into the sandboxed app dir, extract
/// it, and strip the quarantine flag so it can run. The binary lands at
/// `<app_data>/bin/ollama` (which `resolve_ollama_path` checks last).
#[tauri::command]
pub async fn install_ollama(app: AppHandle) -> Result<(), String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("No app data dir: {e}"))?;
    let bin_dir = data_dir.join("bin");
    std::fs::create_dir_all(&bin_dir).map_err(|e| e.to_string())?;
    let archive = data_dir.join("ollama-darwin.tgz");

    emit(&app, "download", Some(0), "Downloading Ollama");

    let resp = reqwest::Client::new()
        .get(OLLAMA_DARWIN_URL)
        .send()
        .await
        .map_err(|e| format!("Download failed: {e}"))?;
    if !resp.status().is_success() {
        return Err(format!("Download failed (HTTP {})", resp.status()));
    }
    let total = resp.content_length().unwrap_or(0);

    use std::io::Write;
    let mut file = std::fs::File::create(&archive).map_err(|e| e.to_string())?;
    let mut downloaded: u64 = 0;
    let mut stream = resp.bytes_stream();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;
        if total > 0 {
            let pct = ((downloaded as f64 / total as f64) * 100.0).min(100.0) as u8;
            emit(&app, "download", Some(pct), "Downloading Ollama");
        }
    }
    drop(file);

    // Extract the whole bundle (binary + runtime libs) into bin/. Shelling out
    // to the system `tar` avoids pulling in tar/gzip crates for a macOS-only
    // path.
    emit(&app, "install", None, "Installing Ollama");
    let status = std::process::Command::new("tar")
        .arg("-xzf")
        .arg(&archive)
        .arg("-C")
        .arg(&bin_dir)
        .status()
        .map_err(|e| format!("Failed to run tar: {e}"))?;
    if !status.success() {
        return Err("Failed to extract Ollama archive".into());
    }
    let _ = std::fs::remove_file(&archive);

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let ollama_bin = bin_dir.join("ollama");
        let _ = std::fs::set_permissions(&ollama_bin, std::fs::Permissions::from_mode(0o755));
    }
    // Best-effort: remove the quarantine attribute Gatekeeper would otherwise
    // use to block execution of freshly downloaded binaries (whole dir).
    let _ = std::process::Command::new("xattr")
        .args(["-dr", "com.apple.quarantine"])
        .arg(&bin_dir)
        .status();

    Ok(())
}

/// Orchestrator the frontend calls on first launch: ensure Ollama is reachable,
/// installing and/or starting it as needed, emitting progress along the way.
#[tauri::command]
pub async fn ensure_ollama_ready(
    app: AppHandle,
    state: State<'_, OllamaProcess>,
) -> Result<(), String> {
    emit(&app, "check", None, "Checking Ollama");
    if is_ollama_running().await {
        emit(&app, "ready", Some(100), "Ready");
        return Ok(());
    }

    if !is_ollama_installed(app.clone()) {
        install_ollama(app.clone()).await?;
    }

    emit(&app, "start", None, "Starting Ollama");
    start_ollama(app.clone(), state).await?;
    emit(&app, "ready", Some(100), "Ready");
    Ok(())
}
