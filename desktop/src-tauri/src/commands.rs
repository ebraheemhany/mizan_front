// What the Mizan website may ask of the app (lib/desktop.ts and lib/files.ts in the site).
// Only the site at APP_URL, in the main window, can call these (see main.rs), but they
// still check what they're given: a page could be tricked into asking for something else.

use percent_encoding::percent_decode_str;
use tauri::ipc::{InvokeBody, Request};
use tauri::{AppHandle, WebviewWindow};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

/// Links that may open outside the app: web pages, email, phone, WhatsApp.
const EXTERNAL_SCHEMES: [&str; 5] = ["https", "http", "mailto", "tel", "whatsapp"];

/// Files the site makes or shows: exports, invoices, receipts. Never anything that runs.
const FILE_TYPES: [&str; 11] = ["csv", "txt", "html", "pdf", "jpg", "jpeg", "png", "webp", "gif", "heic", "xlsx"];

/// Opens a link in the computer's browser (or its app, for WhatsApp).
#[tauri::command]
pub fn open_external(app: AppHandle, url: String) -> Result<(), String> {
    let parsed = url::Url::parse(&url).map_err(|e| e.to_string())?;
    if !EXTERNAL_SCHEMES.contains(&parsed.scheme()) {
        return Err(format!("links starting with {}: are not opened", parsed.scheme()));
    }
    app.opener().open_url(parsed.as_str(), None::<&str>).map_err(|e| e.to_string())
}

/// "Save as": the file's bytes are the request's body, its name the x-file-name header.
/// Resolves false when the person cancels.
#[tauri::command]
pub async fn save_file(app: AppHandle, request: Request<'_>) -> Result<bool, String> {
    let file = File::from_request(&request)?;
    let (sender, receiver) = tokio::sync::oneshot::channel();
    app.dialog()
        .file()
        .set_file_name(&file.name)
        .add_filter(file.extension.to_uppercase(), &[file.extension.as_str()])
        .save_file(move |path| {
            let _ = sender.send(path);
        });
    let Some(path) = receiver.await.map_err(|e| e.to_string())? else {
        return Ok(false);
    };
    let path = path.into_path().map_err(|e| e.to_string())?;
    std::fs::write(path, &file.bytes).map_err(|e| e.to_string())?;
    Ok(true)
}

/// Shows a file (a receipt, a proof of payment) in the computer's own viewer.
#[tauri::command]
pub fn open_file(app: AppHandle, request: Request<'_>) -> Result<(), String> {
    let file = File::from_request(&request)?;
    let folder = std::env::temp_dir().join("Mizan");
    std::fs::create_dir_all(&folder).map_err(|e| e.to_string())?;
    // A new name each time: the viewer may still have the last one open.
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or_default();
    let path = folder.join(format!("{stamp}-{}", file.name));
    std::fs::write(&path, &file.bytes).map_err(|e| e.to_string())?;
    app.opener()
        .open_path(path.to_string_lossy(), None::<&str>)
        .map_err(|e| e.to_string())
}

/// Prints the page through the system (window.print() does nothing on macOS here).
#[tauri::command]
pub fn print_page(window: WebviewWindow) -> Result<(), String> {
    window.print().map_err(|e| e.to_string())
}

struct File {
    name: String,
    extension: String,
    bytes: Vec<u8>,
}

impl File {
    fn from_request(request: &Request<'_>) -> Result<Self, String> {
        let InvokeBody::Raw(bytes) = request.body() else {
            return Err("expected the file's bytes".into());
        };
        let name = request
            .headers()
            .get("x-file-name")
            .and_then(|value| value.to_str().ok())
            .map(|value| percent_decode_str(value).decode_utf8_lossy().into_owned())
            .unwrap_or_default();
        let name = safe_file_name(&name);
        let extension = name
            .rsplit_once('.')
            .map(|(_, extension)| extension.to_ascii_lowercase())
            .unwrap_or_default();
        if !FILE_TYPES.contains(&extension.as_str()) {
            return Err(format!("files of type .{extension} are not handled"));
        }
        Ok(Self { name, extension, bytes: bytes.clone() })
    }
}

/// Just a name (no folders), without the characters Windows refuses in file names.
fn safe_file_name(name: &str) -> String {
    let cleaned: String = name
        .chars()
        .map(|c| if c.is_control() || r#"<>:"/\|?*"#.contains(c) { '_' } else { c })
        .collect();
    let trimmed = cleaned.trim().trim_matches('.');
    if trimmed.is_empty() {
        "file".into()
    } else {
        trimmed.chars().rev().take(150).collect::<Vec<_>>().into_iter().rev().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::safe_file_name;

    #[test]
    fn keeps_names_and_drops_folders() {
        assert_eq!(safe_file_name("Invoice-INV-0001.html"), "Invoice-INV-0001.html");
        assert_eq!(safe_file_name("..\\..\\Windows\\evil.exe"), "_.._Windows_evil.exe");
        assert_eq!(safe_file_name("a/b:c?.csv"), "a_b_c_.csv");
        assert_eq!(safe_file_name("كشف حساب.csv"), "كشف حساب.csv");
        assert_eq!(safe_file_name("..."), "file");
    }
}
