// X - Cliente no oficial de X (Twitter) para macOS
// Copyright © 2024 686f6c61
//
// Author: 686f6c61 (https://github.com/686f6c61)
// Repository: https://github.com/686f6c61/Xcom-mac-silicon
//
// Main entry point - Previene ventana de consola en Windows release builds
// y delega la lógica principal al módulo lib.

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    twitter_mac_lib::run()
}
