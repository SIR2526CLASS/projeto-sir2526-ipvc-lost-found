// Conversation UI and socket messaging.
﻿import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

function formatTime(dateString) {
  const d = new Date(dateString);
  if (Number.isNaN(d)) return "";
  return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function normalizeId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value._id || value.id || value.toString?.() || "";
  return String(value);
}

function ChatPanel({ objectId, ownerId }) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("connecting");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [helper, setHelper] = useState("");
  const socketRef = useRef(null);
  const listRef = useRef(null);
  const ownerIdStr = typeof ownerId === "object" ? ownerId?._id || ownerId?.id : ownerId;
  const isOwner = ownerIdStr && user?.id && ownerIdStr === user.id;
  const currentUserId = user?.id || "";

  // Load history
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await api.get(`/objects/${objectId}/messages`);
        if (active) setMessages(data);
      } catch (err) {
        // ignore for now
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [objectId]);

  // Socket connection
  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;
    socket.on("connect", () => {
      setStatus("connected");
      socket.emit("join", objectId);
    });
    socket.on("connect_error", () => setStatus("disconnected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [objectId, token]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const participants = useMemo(() => {
    const map = new Map();
    messages.forEach((msg) => {
      const senderId = normalizeId(msg.userId);
      if (senderId && senderId !== ownerIdStr) {
        const name = msg.userName || msg.userEmail || "Utilizador";
        if (!map.has(senderId)) {
          map.set(senderId, name);
        }
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [messages, ownerIdStr]);

  useEffect(() => {
    if (isOwner && participants.length > 0 && !selectedUserId) {
      setSelectedUserId(participants[0].id);
    }
  }, [isOwner, participants, selectedUserId]);

  const filteredMessages = useMemo(() => {
    if (messages.length === 0) return [];
    if (isOwner) {
      if (!selectedUserId || selectedUserId === "all") return messages;
      return messages.filter((msg) => {
        const senderId = normalizeId(msg.userId);
        const recipientId = normalizeId(msg.recipientId);
        const isFromContact = senderId === selectedUserId && (!recipientId || recipientId === ownerIdStr);
        const isFromOwner = senderId === ownerIdStr && recipientId === selectedUserId;
        return isFromContact || isFromOwner;
      });
    }
    if (!ownerIdStr) {
      return messages.filter((msg) => {
        const senderId = normalizeId(msg.userId);
        const recipientId = normalizeId(msg.recipientId);
        return senderId === currentUserId || recipientId === currentUserId;
      });
    }
    return messages.filter((msg) => {
      const senderId = normalizeId(msg.userId);
      const recipientId = normalizeId(msg.recipientId);
      const involvesMe = senderId === currentUserId || recipientId === currentUserId;
      const involvesOwner = senderId === ownerIdStr || recipientId === ownerIdStr || !recipientId;
      return involvesMe && involvesOwner;
    });
  }, [messages, isOwner, selectedUserId, ownerIdStr, currentUserId]);

  const selectedParticipant = participants.find((p) => p.id === selectedUserId);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;
    if (isOwner && (!selectedUserId || selectedUserId === "all")) {
      setHelper("Escolhe um chat para responder.");
      return;
    }
    const payload = { objectId, content: input.trim() };
    if (isOwner) {
      payload.recipientId = selectedUserId;
    }
    socketRef.current.emit("message", payload);
    setInput("");
    setHelper("");
  };

  const placeholder = isOwner
    ? participants.length === 0
      ? "Aguarda mensagens para responder."
      : selectedParticipant
        ? `Responder a ${selectedParticipant.name}`
        : "Escolhe um chat para responder."
    : status === "connected"
      ? "Escreve uma mensagem..."
      : "A ligar ao chat...";

  return (
    <div className="chat-panel">
      <div className="chat-header-row">
        <div className="chat-status">
          <span className={`status-dot status-dot--${status === "connected" ? "on" : "off"}`} />
          <span>{status === "connected" ? "Ligado" : "Desligado"}</span>
        </div>
        {isOwner && <span className="chat-role">És o autor deste anúncio</span>}
      </div>

      {isOwner && (
        <div className="chat-participants">
          <p className="muted" style={{ margin: "0 0 0.35rem 0" }}>
            Conversas ({participants.length || 0})
          </p>
          {participants.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              Ainda não recebeste mensagens.
            </p>
          ) : (
            <div className="chat-participants__list">
              <button
                type="button"
                className={`chip ${!selectedUserId || selectedUserId === "all" ? "chip--active" : ""}`}
                onClick={() => setSelectedUserId("all")}
              >
                Todos
              </button>
              {participants.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`chip ${selectedUserId === p.id ? "chip--active" : ""}`}
                  onClick={() => setSelectedUserId(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="chat-messages" ref={listRef}>
        {filteredMessages.length === 0 && <p className="muted" style={{ margin: 0 }}>Sem mensagens ainda.</p>}
        {filteredMessages.map((msg) => {
          const senderId = normalizeId(msg.userId);
          const senderName = msg.userName || msg.userEmail || "Utilizador";
          const recipientId = normalizeId(msg.recipientId);
          const isMine = senderId === currentUserId;
          return (
            <div
              key={msg._id || `${msg.createdAt}-${msg.userEmail}`}
              className={`chat-message ${isMine ? "chat-message--mine" : ""}`}
            >
              <div className="chat-meta">
                <span>{senderName}</span>
                <span>{formatTime(msg.createdAt)}</span>
              </div>
              {recipientId && isOwner && senderId === ownerIdStr && (
                <p className="muted" style={{ margin: "0 0 0.25rem 0" }}>
                  Para: {participants.find((p) => p.id === recipientId)?.name || "Utilizador"}
                </p>
              )}
              <div>{msg.content}</div>
            </div>
          );
        })}
      </div>
      <form className="chat-form" onSubmit={sendMessage}>
        <input
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== "connected" || (isOwner && (!selectedUserId || selectedUserId === "all"))}
        />
        <button
          className="primary-btn"
          type="submit"
          disabled={
            status !== "connected" ||
            !input.trim() ||
            (isOwner && (!selectedUserId || selectedUserId === "all"))
          }
        >
          Enviar
        </button>
      </form>
      <div className="chat-footer">
        <p className="muted" style={{ margin: 0 }}>
          Sessão: {user?.name || user?.email}
        </p>
        {helper && <p className="error" style={{ margin: "0.2rem 0 0 0" }}>{helper}</p>}
      </div>
    </div>
  );
}

export default ChatPanel;
