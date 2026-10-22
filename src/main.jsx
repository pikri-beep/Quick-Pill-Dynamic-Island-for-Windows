// 1. Initialize native Tauri / Electron universal bridge before anything else mounts
import './services/bridge.js';

// 2. Mount primary React application
import './App.jsx';
