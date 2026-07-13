#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // WebKitGTK renderiza a janela em branco/preto em várias combinações de
  // GPU + Wayland/XWayland (bug conhecido do Tauri/WebKitGTK no Linux).
  // Forçar renderização por software evita isso; o jogo é 2D simples, então
  // o custo de performance é desprezível. Respeita override manual do usuário.
  #[cfg(target_os = "linux")]
  if std::env::var_os("LIBGL_ALWAYS_SOFTWARE").is_none() {
    std::env::set_var("LIBGL_ALWAYS_SOFTWARE", "1");
  }

  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
