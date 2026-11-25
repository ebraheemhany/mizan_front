// Mizan's desktop app: a window showing the Mizan website (APP_URL), plus
// - what a window without a browser around it can't do alone (commands.rs), which only
//   the Mizan website may ask for;
// - links from the browser (mizan://auth?..., the end of signing in with Google there);
// - updates of the app itself (updates.rs).
// The site knows it runs here from window.__MIZAN_DESKTOP__ (lib/desktop.ts in the site).

// No console window next to the app on Windows (in release builds).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod updates;

use tauri::ipc::CapabilityBuilder;
use tauri::webview::NewWindowResponse;
use tauri::{AppHandle, Manager, Url, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_opener::OpenerExt;

/// The site the window shows. Building with MIZAN_APP_URL set points the app at another
/// one (e.g. MIZAN_APP_URL=http://localhost:3000 while working on the site).
pub const APP_URL: &str = match option_env!("MIZAN_APP_URL") {
    Some(url) => url,
    None => "https://mizanfront-production.up.railway.app",
};

const MAIN: &str = "main";

fn main() {
    tauri::Builder::default()
        // Must come first: a second launch (Windows opens one for each mizan:// link)
        // hands its link to this app and quits; the deep-link plugin delivers the link.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window(MAIN) {
                bring_to_front(&window);
            }
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::open_external,
            commands::save_file,
            commands::open_file,
            commands::print_page,
        ])
        .setup(|app| {
            // The app's commands, for the Mizan website in the main window only.
            app.add_capability(
                CapabilityBuilder::new("mizan-site")
                    .remote(format!("{}/*", APP_URL.trim_end_matches('/')))
                    .window(MAIN)
                    .permission("allow-open-external")
                    .permission("allow-save-file")
                    .permission("allow-open-file")
                    .permission("allow-print-page"),
            )?;

            // Started by a mizan:// link (the app wasn't running): open that page first.
            let start = app
                .deep_link()
                .get_current()?
                .and_then(|urls| urls.iter().find_map(site_path_for));
            create_main_window(app.handle(), start.as_deref())?;

            let handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                if let Some(path) = event.urls().iter().find_map(site_path_for) {
                    open_site_path(&handle, &path);
                }
            });
            // mizan:// is registered by the installer, never by a development run: that would
            // point an installed app's links at the development build. (Links passed on the
            // command line still reach a development run.)

            updates::check_in_background(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Mizan");
}

fn create_main_window(app: &AppHandle, start: Option<&str>) -> tauri::Result<WebviewWindow> {
    // What the site (and the splash page) read from window.__MIZAN_DESKTOP__.
    let info = serde_json::json!({
        "version": app.package_info().version.to_string(),
        "platform": std::env::consts::OS,
        "appUrl": APP_URL.trim_end_matches('/'),
        "start": start.unwrap_or("/dashboard"),
    });
    let opener = app.clone();

    // The splash page (../splash) checks the connection, then loads the site.
    WebviewWindowBuilder::new(app, MAIN, WebviewUrl::App("index.html".into()))
        .title("Mizan")
        .inner_size(1280.0, 820.0)
        .min_inner_size(900.0, 600.0)
        .center()
        .zoom_hotkeys_enabled(true)
        .initialization_script(format!("window.__MIZAN_DESKTOP__ = Object.freeze({info});"))
        // The window's title follows the page's, as a browser tab's does. A page without
        // a <title> reports its address instead: then it's just "Mizan".
        .on_document_title_changed(|window, title| {
            let title = title.trim();
            let address = APP_URL.split("://").nth(1).unwrap_or(APP_URL);
            let untitled = title.is_empty() || title.contains("://") || title.starts_with(address);
            let _ = window.set_title(if untitled { "Mizan" } else { title });
        })
        // Links meant for a new tab open in the computer's browser: the app has no tabs.
        .on_new_window(move |url, _features| {
            if matches!(url.scheme(), "http" | "https" | "mailto") {
                let _ = opener.opener().open_url(url.as_str(), None::<&str>);
            }
            NewWindowResponse::Deny
        })
        .build()
}

/// The site's page for a mizan:// link, e.g. mizan://auth?code=...&state=... is
/// /desktop/callback?code=...&state=..., which finishes signing in.
fn site_path_for(url: &Url) -> Option<String> {
    if url.scheme() != "mizan" {
        return None;
    }
    match url.host_str() {
        Some("auth") => {
            let mut query = url::form_urlencoded::Serializer::new(String::new());
            for (key, value) in url.query_pairs() {
                if key == "code" || key == "state" {
                    query.append_pair(&key, &value);
                }
            }
            Some(format!("/desktop/callback?{}", query.finish()))
        }
        _ => None,
    }
}

fn open_site_path(app: &AppHandle, path: &str) {
    let Some(window) = app.get_webview_window(MAIN) else { return };
    if let Ok(url) = Url::parse(APP_URL).and_then(|base| base.join(path)) {
        let _ = window.navigate(url);
    }
    bring_to_front(&window);
}

fn bring_to_front(window: &WebviewWindow) {
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
}
