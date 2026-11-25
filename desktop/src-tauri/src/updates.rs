// Updates of the app itself. The site inside it is always the live one, so this is only
// for the window around it. At start the app looks for a newer release (the updater
// endpoint in tauri.conf.json); if there is one it asks, then installs and restarts.
// Releases are signed with the updater key (desktop/README.md): an update that isn't is
// refused.

use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tauri_plugin_updater::UpdaterExt;

pub fn check_in_background(app: AppHandle) {
    // A development build isn't a release: nothing to update.
    if cfg!(debug_assertions) {
        return;
    }
    tauri::async_runtime::spawn(async move {
        if let Err(error) = check(app).await {
            // Offline, or no release yet: try again next start.
            eprintln!("update check failed: {error}");
        }
    });
}

async fn check(app: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let Some(update) = app.updater()?.check().await? else {
        return Ok(());
    };

    let arabic = sys_locale::get_locale().is_some_and(|locale| locale.starts_with("ar"));
    let (title, message, install, later) = if arabic {
        (
            "تحديث جديد لميزان",
            format!("النسخة {} من برنامج ميزان جاهزة. تحب تحدّث دلوقتي؟ البرنامج هيقفل ويفتح تاني لوحده.", update.version),
            "تحديث",
            "بعدين",
        )
    } else {
        (
            "Mizan update",
            format!("Version {} of the Mizan app is ready. Update now? The app will close and open again by itself.", update.version),
            "Update",
            "Later",
        )
    };

    let (sender, receiver) = tokio::sync::oneshot::channel();
    app.dialog()
        .message(message)
        .title(title)
        .kind(MessageDialogKind::Info)
        .buttons(MessageDialogButtons::OkCancelCustom(install.into(), later.into()))
        .show(move |yes| {
            let _ = sender.send(yes);
        });
    if !receiver.await? {
        return Ok(());
    }

    // On Windows the installer closes the app and opens the new one itself.
    update.download_and_install(|_, _| {}, || {}).await?;
    app.restart();
}
