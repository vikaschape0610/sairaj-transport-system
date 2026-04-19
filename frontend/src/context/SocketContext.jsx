import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (socketRef.current) return;

    const token =
      sessionStorage.getItem("userToken") || sessionStorage.getItem("adminToken");

    const API_URL = import.meta.env.VITE_API_URL;
    if (!API_URL) {
      throw new Error("VITE_API_URL not set");
    }
    const SOCKET_URL = API_URL.replace("/api", "");

    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket"], // ✅ FIXED
      extraHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    });

    socketInstance.on("connect", () => {
      console.log("🔌 Socket connected:", socketInstance.id);
    });

    socketInstance.on("bookingUpdated", (data) => {
      console.log("📡 Booking updated:", data);
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("Socket error:", err.message);
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (socket && user?.id) {
      socket.emit("joinUser", user.id);
    }
  }, [socket, user?.id]);

  // Join admin room when admin is logged in
  useEffect(() => {
    if (!socket) return;
    const adminToken = sessionStorage.getItem("adminToken");
    if (adminToken) {
      socket.emit("joinAdmin");
      console.log("👨‍💼 Socket: emitting joinAdmin");
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

export default SocketContext;
