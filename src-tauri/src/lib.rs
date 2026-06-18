mod ollama;

use ollama::OllamaProcess;
use tauri::{AppHandle, Manager, RunEvent};

/// Kill the `ollama serve` child we spawned (if any). A pre-existing system
/// Ollama is never stored here, so it is never touched. Safe to call repeatedly.
fn shutdown_ollama(app: &AppHandle) {
    let state = app.state::<OllamaProcess>();
    let mut guard = state.0.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(mut child) = guard.take() {
        let _ = child.kill();
        let _ = child.wait();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // The frontend uses this plugin's fetch() to reach Ollama without
        // tripping the WebView's cross-origin restrictions.
        .plugin(tauri_plugin_http::init())
        // Holds the `ollama serve` child *we* spawn (if any), so we can shut it
        // down on exit without touching a pre-existing system Ollama.
        .manage(OllamaProcess::default())
        .invoke_handler(tauri::generate_handler![
            ollama::is_ollama_running,
            ollama::is_ollama_installed,
            ollama::start_ollama,
            ollama::install_ollama,
            ollama::ensure_ollama_ready,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        // Handle both teardown events: ExitRequested fires on a normal quit,
        // and Exit is the final event before the process ends. macOS app
        // termination (Cmd+Q / Apple Event) does not always surface
        // ExitRequested, so we clean up on either.
        .run(|app_handle, event| match event {
            RunEvent::ExitRequested { .. } | RunEvent::Exit => shutdown_ollama(app_handle),
            _ => {}
        });
}
