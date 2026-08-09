import { io } from "socket.io-client";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL;

const socketUrl =
  configuredSocketUrl || new URL(apiBaseUrl, window.location.origin).origin;

export const realtimeSocket = io(socketUrl, {
  autoConnect: true,
  withCredentials: true,
  transports: ["websocket", "polling"],
});

/*
import { io } from "socket.io-client";

// 1. Get the base API URL or fallback to localhost
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// 2. Parse the target socket URL correctly
let socketUrl;

if (import.meta.env.VITE_SOCKET_URL) {
  socketUrl = import.meta.env.VITE_SOCKET_URL;
} else {
  try {
    // This safely extracts exactly "https://devtunnels.ms" from your env
    socketUrl = new URL(apiBaseUrl).origin;
  } catch (error) {
    // Safe fallback if the env variable isn't a valid absolute URL format
    socketUrl = "http://localhost:5000";
  }
}

// 3. Initialize the socket connection
export const realtimeSocket = io(socketUrl, {
  autoConnect: true,
  withCredentials: true,
  // CRITICAL: Put "websocket" first and REMOVE "polling".
  // VS Code Dev Tunnels frequently fail and reject HTTP long-polling handshake upgrades.
  transports: ["websocket"],
});
 */
