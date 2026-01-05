# CODEBUDDY.md

This file provides guidance to CodeBuddy Code when working with code in this repository.

## Project Overview

ws-scrcpy is a web client for [Genymobile/scrcpy](https://github.com/Genymobile/scrcpy) that enables screen mirroring and remote control of Android (and optionally iOS) devices through a browser. It consists of a Node.js server and a web-based client communicating over WebSockets.

## Build and Development Commands

```bash
# Install dependencies (requires node-gyp and build tools)
npm install

# Development build with source maps
npm run dist:dev

# Production build
npm run dist:prod

# Build and start server
npm start

# Clean build artifacts
npm run clean

# Lint TypeScript files
npm run lint

# Auto-fix lint issues
npm run format
```

### Custom Build Configuration

Override defaults by creating `build.config.override.json` in project root. See `webpack/default.build.config.json` for available flags:
- `INCLUDE_GOOG`: Android support (default: true)
- `INCLUDE_APPL`: iOS support (default: false)
- `USE_BROADWAY`, `USE_TINY_H264`, `USE_WEBCODECS`, `USE_H264_CONVERTER`: Video player options
- `INCLUDE_ADB_SHELL`, `INCLUDE_DEV_TOOLS`, `INCLUDE_FILE_LISTING`: Feature toggles

### Runtime Configuration

Set `WS_SCRCPY_CONFIG` environment variable to specify a config file path. See `config.example.yaml` and `src/types/Configuration.d.ts` for schema.

## Architecture

### Directory Structure

```
src/
├── app/                    # Frontend (browser) code
│   ├── client/             # Base client classes
│   ├── controlMessage/     # Device control protocol messages
│   ├── googDevice/         # Android device support (client-side)
│   ├── applDevice/         # iOS device support (client-side)
│   ├── player/             # Video player implementations
│   ├── interactionHandler/ # Touch/keyboard input handling
│   ├── toolbox/            # UI control components
│   └── index.ts            # CLIENT ENTRY POINT
├── server/                 # Backend (Node.js) code
│   ├── services/           # Core services (HTTP, WebSocket)
│   ├── mw/                 # Middleware handlers
│   ├── goog-device/        # Android device support (server-side)
│   ├── appl-device/        # iOS device support (server-side)
│   └── index.ts            # SERVER ENTRY POINT
├── common/                 # Shared client/server code
├── types/                  # TypeScript type definitions
├── packages/multiplexer/   # WebSocket multiplexing
└── public/                 # Static HTML assets
```

### Client/Server Communication

The system uses WebSocket multiplexing (`src/packages/multiplexer/Multiplexer.ts`) to run multiple logical channels over a single connection. Channel codes are defined in `src/common/ChannelCode.ts`:
- `HSTS`: Host tracking
- `GOOG`: Android devices
- `APPL`: iOS devices

### Video Player Hierarchy

```
BasePlayer (src/app/player/BasePlayer.ts)
├── BaseCanvasBasedPlayer
│   ├── BroadwayPlayer      (WebAssembly decoder)
│   ├── TinyH264Player      (WebAssembly decoder with WebWorkers)
│   └── WebCodecsPlayer     (Browser VideoDecoder API)
└── MsePlayer               (MediaSource Extensions - hardware)
    └── MsePlayerForQVHack  (iOS variant)
```

Players are registered conditionally in `src/app/index.ts` using `ifdef-loader` directives.

### Service Pattern (Server)

Services implement the interface from `src/server/services/Service.ts`:
- `getName()`: Service identifier
- `start()`: Async initialization
- `release()`: Cleanup

Key services:
- `HttpServer`: Express-based HTTP/HTTPS
- `WebSocketServer`: Routes connections to middleware
- `ControlCenter` (goog/appl): Device tracking and management

### Middleware Pattern (Server)

Middleware classes extend `Mw` from `src/server/mw/Mw.ts` and implement `MwFactory`:
- `processRequest(ws, message)`: Handle incoming requests
- `processChannel(ws, code, data)`: Handle multiplexed channel data

Examples: `DeviceTracker`, `RemoteShell`, `FileListing`, `WebsocketProxy`

### Platform-Specific Code

**Android (googDevice/goog-device):**
- Client: `StreamClientScrcpy`, `StreamReceiverScrcpy`, `DeviceTracker`
- Server: `ControlCenter`, `Device`, `AdbUtils`, `ScrcpyServer`

**iOS (applDevice/appl-device):**
- Client: `StreamClientQVHack`, `StreamClientMJPEG`, `WdaProxyClient`
- Server: `ControlCenter`, `WDARunner`, `QvhackRunner`

### Control Messages

Device control protocol in `src/app/controlMessage/`:
- `TouchControlMessage`: Touch events
- `KeyCodeControlMessage`: Keyboard input
- `ScrollControlMessage`: Scroll events
- `CommandControlMessage`: Video settings, clipboard, etc.

### Build Output

Webpack produces:
```
dist/
├── index.js        # Server entry point
├── package.json    # Generated for distribution
└── public/
    ├── bundle.js   # Client bundle
    └── index.html  # Frontend HTML
```

## Key Files Reference

| Purpose | Path |
|---------|------|
| Client entry | `src/app/index.ts` |
| Server entry | `src/server/index.ts` |
| Server config | `src/server/Config.ts` |
| Action routing | `src/common/Action.ts` |
| Base player | `src/app/player/BasePlayer.ts` |
| Android stream client | `src/app/googDevice/client/StreamClientScrcpy.ts` |
| Android control center | `src/server/goog-device/services/ControlCenter.ts` |
| Multiplexer | `src/packages/multiplexer/Multiplexer.ts` |
| Middleware base | `src/server/mw/Mw.ts` |
| Build flags | `webpack/default.build.config.json` |
| Type definitions | `src/types/*.d.ts` |

## Requirements

- Node.js v10+
- node-gyp and build tools
- `adb` in PATH for Android support
- For iOS: `ws-qvh` in PATH and WebDriverAgent setup
