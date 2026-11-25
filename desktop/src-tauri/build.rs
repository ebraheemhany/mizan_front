fn main() {
    // The app's own commands (src/commands.rs). Listing them makes Tauri generate a
    // permission for each, and nothing may call one unless a capability grants it
    // (main.rs grants them to the Mizan website only).
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&["open_external", "save_file", "open_file", "print_page"]),
    ))
    .expect("failed to run tauri-build");
}
