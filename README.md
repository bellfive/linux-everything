
# Linux Everything 🔍

**Linux Everything** (formerly System Cartographer) is a blazing fast file search utility and educational tool for Linux users. It is designed to help users transitioning from Windows by providing an "Everything"-like search experience with added context about Linux file system hierarchy.

![Linux Everything Icon](app-icon.png)

## 🚀 Features

*   **Instant Search**: Built with Rust's `walkdir` for high-performance file system traversal.
*   **Wildcard Support**: distinct support for glob patterns (e.g., `*.png`, `app*.sh`).
*   **Educational Context**: Intelligent tooltips explaining standard Linux directories (e.g., `/etc` vs `/bin`).
*   **Open Location**: Single-click access to open files or their parent folders in your default file manager (Nautilus, Dolphin, etc.).
*   **Result Count**: Real-time display of search result counts (capped at 3,000 for performance).

## 🛠️ Tech Stack

*   **Frontend**: React, TypeScript, Vite
*   **Backend**: Rust
*   **Framework**: Tauri (v1)
*   **OS Integration**: `xdg-open`, native GTK file dialogs

## 📦 Installation

### Prerequisites
*   Node.js (v16+)
*   Rust (Stable)
*   System dependencies (Ubuntu/Debian):
    ```bash
    sudo apt update
    sudo apt install libwebkit2gtk-4.0-dev \
        build-essential \
        curl \
        wget \
        file \
        libssl-dev \
        libgtk-3-dev \
        libayatana-appindicator3-dev \
        librsvg2-dev
    ```

### Build from Source

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/bellfive/linux-everything.git
    cd linux-everything
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run in Development Mode**:
    ```bash
    npm run tauri dev
    ```

4.  **Build Release Binary**:
    ```bash
    npm run tauri build
    ```

### 🖥️ Desktop Integration (Linux)

A helper script `build_and_deploy.sh` is included to automate building and creating a desktop shortcut:

```bash
chmod +x build_and_deploy.sh
./build_and_deploy.sh
```

This will:
*   Build the release binary.
*   Install it to `~/LinuxEverything`.
*   Add a `.desktop` entry to your applications menu.
*   Install the application icon.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
