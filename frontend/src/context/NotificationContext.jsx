// Notification state and socket listener.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import api from "../api/api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

export function NotificationProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!token) {
        setNotifications([]);
        return;
      }
      try {
        const { data } = await api.get("/notifications");
        if (active) setNotifications(data);
      } catch (err) {
        if (active) setNotifications([]);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token || !isAuthenticated) return undefined;
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("notification", (payload) => {
      setNotifications((prev) => {
        if (prev.some((item) => item._id === payload._id)) return prev;
        return [payload, ...prev];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, isAuthenticated]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications]
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    } catch (err) {
      // ignore
    }
  }, [token]);

  const markRead = useCallback(async (id) => {
    if (!token || !id) return;
    try {
      const { data } = await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((item) => (item._id === id ? data : item)));
    } catch (err) {
      // ignore
    }
  }, [token]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return ctx;
}
