/* import { io } from "socket.io-client";

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


 */
import { io } from "socket.io-client";

// 1. Fetch your API Base URL from environment variables
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// 2. Parse the target socket URL correctly without mixing in window origins
let socketUrl;

if (import.meta.env.VITE_SOCKET_URL) {
  socketUrl = import.meta.env.VITE_SOCKET_URL;
} else {
  try {
    // This safely extracts exactly "https://onrender.com" from your env string
    socketUrl = new URL(apiBaseUrl).origin;
  } catch {
    // Local development fallback
    socketUrl = "http://localhost:5000";
  }
}

// 3. Initialize the socket connection
export const realtimeSocket = io(socketUrl, {
  autoConnect: true,
  withCredentials: true,
  // CRITICAL FOR RENDER: Put "websocket" first and REMOVE "polling".
  // Render's load balancers will drop or fail HTTP polling upgrades.
  transports: ["websocket"],
});
