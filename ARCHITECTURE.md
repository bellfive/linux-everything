# Linux Everything - Architecture Overview

**Linux Everything** follows a classic "Separation of Concerns" pattern, but instead of Client-Server over HTTP, it uses Client-System over IPC (Inter-Process Communication).

## 🏗️ High-Level Diagram

```mermaid
graph TD
    User([User]) -->|Input| React[Frontend (React)]
    React -->|IPC (invoke)| Tauri[Tauri Bridge]
    Tauri -->|Command| Rust[Backend (Rust)]
    
    subgraph "Backend (Fast & Safe)"
        Rust -->|WalkDir| FileSystem[(File System)]
        Rust -->|Glob| PatternMatching{Pattern Check}
        Rust -->|Serde| JSON[Result JSON]
    end
    
    subgraph "Frontend (Interactive)"
        React -->|State| ResultsList[UI List]
        React -->|Event| OpenFile[xdg-open]
    end
```

## 📂 Key Source Files (The "Big 3")

The entire magic happens in just these three files.

### 1. `src-tauri/src/main.rs` (The Brain 🧠)
This is the **Backend**. It runs with native system permissions.
- **`search_files` function**: The engine. It receives a query string, runs `walkdir` to scan the disk, filters based on `glob` patterns, and returns a JSON list.
- **`open_path` function**: The arm. It executes system commands (`xdg-open`) to launch files or folders.
- **Optimization**: It uses `filter_map` to ignore permission errors and a hard limit (`3000`) to prevent UI lag.

### 2. `src/SearchComponent.tsx` (The Face 😊)
This is the **Frontend**. It runs in a webview (like a dedicated Chrome tab).
- **Debouncing**: Wails 300ms after you stop typing before bothering the backend.
- **`invoke('search_files')`**: The bridge call that asks Rust to work.
- **Context Logic**: Contains the `if (path.startsWith('/etc'))` logic to show helpful tooltips.
- **State Management**: Holds the `query` string and `results` array.

### 3. `src/main.tsx` & `App.tsx` (The Skeleton 🦴)
These are the entry points.
- **`App.tsx`**: Sets up the basic layout (header, container) and mounts the `SearchComponent`.
- **`src-tauri/tauri.conf.json`**: The configuration file that defines permissions (`allowlist`), window size, and app name.

## 🚀 Data Flow Example
1.  **User types** "*.png".
2.  **`SearchComponent.tsx`** waits 300ms -> Calls `invoke('search_files', { query: "*.png" })`.
3.  **Tauri** serializes this message and wakes up Rust.
4.  **`main.rs`** starts `WalkDir` from `/home`.
    - Checks file: "profile.jpg" -> Match? No.
    - Checks file: "icon.png" -> Match? Yes! -> Add to `results`.
5.  **`main.rs`** returns `Vec<SearchResult>`.
6.  **`SearchComponent.tsx`** receives the array -> Updates `setResults`.
7.  **React** re-renders the list, and you see "Found 5 items".
