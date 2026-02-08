
#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]


use walkdir::WalkDir;
use serde::Serialize;

#[derive(Serialize, Clone, Debug)]
struct SearchResult {
    path: String,
    name: String,
    is_dir: bool,
}

use glob::Pattern;

#[tauri::command]
fn search_files(query: String) -> Vec<SearchResult> {
    let mut results = Vec::new();
    let query_lower = query.to_lowercase();
    let is_glob = query.contains('*') || query.contains('?');
    
    // Default to home directory for safety in prototype
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| "/".to_string());
    
    // Attempt to compile glob pattern if applicable
    let glob_pattern = if is_glob {
        Pattern::new(&query_lower).ok()
    } else {
        None
    };

    for entry in WalkDir::new(home_dir).into_iter().filter_map(|e| e.ok()) {
        let file_name = entry.file_name().to_string_lossy();
        let file_name_lower = file_name.to_lowercase();
        
        let match_found = if let Some(ref pattern) = glob_pattern {
            pattern.matches(&file_name_lower)
        } else {
            file_name_lower.contains(&query_lower)
        };

        if match_found {
            results.push(SearchResult {
                path: entry.path().to_string_lossy().to_string(),
                name: file_name.to_string(),
                is_dir: entry.file_type().is_dir(),
            });
            
            if results.len() >= 3000 {
                break;
            }
        }
    }
    
    results
}

#[tauri::command]
fn open_path(path: String) {
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(path)
            .spawn()
            .expect("Failed to open path");
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(path)
            .spawn()
            .expect("Failed to open path");
    }
     #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(path)
            .spawn()
            .expect("Failed to open path");
    }
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![search_files, open_path])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
