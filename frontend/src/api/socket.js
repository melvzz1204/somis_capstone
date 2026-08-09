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
