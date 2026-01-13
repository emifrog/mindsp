import { io, Socket } from "socket.io-client";
import type { SocketEvents } from "@/types/chat";

let socket: Socket<SocketEvents> | null = null;

export function initChatSocket(
  userId: string,
  tenantId: string
): Socket<SocketEvents> {
  if (socket?.connected) {
    return socket;
  }

  // Connexion au serveur Socket.IO séparé (Railway)
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

  socket = io(socketUrl, {
    // Pas de path personnalisé car serveur dédié
    auth: {
      userId,
      tenantId,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("✅ Connected to chat server");
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Disconnected from chat server:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Connection error:", error);
  });

  return socket;
}

export function getChatSocket(): Socket<SocketEvents> | null {
  return socket;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
