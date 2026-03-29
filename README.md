# studysesh

Study session tracker for study groups. Each person tracks their focus time, pomodoros, and tasks — a live scoreboard shows everyone's stats, and sessions can be exported as CSV.

---

## Requirements

- **Node.js 18 or newer** — [nodejs.org](https://nodejs.org)
- **npm** (included with Node.js)
- **C++ build tools** — required to compile `better-sqlite3` (the native SQLite driver)

See the [platform-specific setup](#platform-specific-setup) section below for how to install these on your machine.

---

## Installation

```bash
# 1. Download or clone the project
git clone <repo-url>
cd studysesh

# 2. Install dependencies
#    This also compiles the native SQLite driver for your machine
npm install
```

> **Important:** always run `npm install` on the machine that will host the app. Do not copy `node_modules` from another computer — the native SQLite driver is compiled per-platform.

---

## Running the app

### Development mode (recommended for local use)

Starts both the frontend (Vite) and backend (Hono) servers with hot reload:

```bash
npm run dev:all
```

- Frontend dev server: `http://localhost:5173`
- Backend API server: `http://localhost:3001`

### Production mode (recommended for always-on hosting, e.g. Raspberry Pi)

Build the frontend once, then run the single production server:

```bash
npm run build   # compiles frontend into dist/
npm start       # serves everything from port 3001
```

- App URL: `http://localhost:3001`

---

## Visiting the app

### From the same machine

| Mode | URL |
|------|-----|
| Dev | `http://localhost:5173` |
| Production | `http://localhost:3001` |

### From other devices on the same WiFi / LAN

Find the host machine's local IP address, then open:

| Mode | URL |
|------|-----|
| Dev | `http://<host-ip>:5173` |
| Production | `http://<host-ip>:3001` |

**How to find your local IP address:**

| Platform | Command |
|----------|---------|
| macOS | `ipconfig getifaddr en0` (WiFi) or `ipconfig getifaddr en1` (Ethernet) |
| Windows | `ipconfig` — look for "IPv4 Address" under your active adapter |
| Linux / Raspberry Pi | `ip addr show` or `hostname -I` |

Example: if your host IP is `192.168.1.42`, other devices open `http://192.168.1.42:3001`.

---

## Platform-specific setup

### macOS

```bash
# Install Xcode Command Line Tools (provides C++ compiler)
xcode-select --install

# Install Node.js 18+ via Homebrew (recommended)
brew install node

# Or download the installer from https://nodejs.org
```

### Windows

1. Download and run the Node.js 18+ installer from [nodejs.org](https://nodejs.org). Check the box **"Automatically install the necessary tools"** during setup — this installs the C++ build tools.

2. If you skipped that box, install build tools manually (run PowerShell **as Administrator**):
   ```powershell
   npm install -g windows-build-tools
   ```

3. Then install and run the app from **PowerShell** or **Git Bash**:
   ```powershell
   npm install
   npm run dev:all
   ```

### Linux (Ubuntu / Debian)

```bash
# Install build tools
sudo apt update
sudo apt install python3 make g++

# Install Node.js 18+ via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Raspberry Pi

Raspberry Pi OS ships with an old version of Node.js. Install a current version via NodeSource:

```bash
# Install build tools
sudo apt update
sudo apt install python3 make g++

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # should be v18 or higher
```

**Running automatically on boot with pm2:**

```bash
# Install pm2
npm install -g pm2

# Build and start the app
npm run build
pm2 start "npm run start" --name studysesh

# Save the process list and enable startup on boot
pm2 save
pm2 startup   # run the command it prints (starts with "sudo env PATH=...")
```

To stop, restart, or check logs:

```bash
pm2 stop studysesh
pm2 restart studysesh
pm2 logs studysesh
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Port the backend server listens on |

Example:

```bash
PORT=8080 npm start
```

---

## Data

Session data is stored in a SQLite database file at:

```
data/studysesh.db
```

This file is created automatically on first run and is excluded from git. To back it up, just copy the file:

```bash
cp data/studysesh.db data/studysesh.db.bak
```
