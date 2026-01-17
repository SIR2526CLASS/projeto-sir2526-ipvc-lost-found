// Chat inbox list and conversation panel.
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";
import ChatPanel from "../components/ChatPanel";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

function ChatInbox() {
  const { user } = useAuth();
  const { markAllRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const searchParams = new URLSearchParams(location.search);
  const paramObjectId = searchParams.get("objectId");

  const [selectedId, setSelectedId] = useState(paramObjectId || "");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/chats");
        let list = data;

        // If user opened chat from a specific anúncio, ensure it appears in the list.
        if (paramObjectId && !list.some((c) => c.objectId === paramObjectId)) {
          try {
            const { data: objectData } = await api.get(`/objects/${paramObjectId}`);
            list = [
              {
                objectId: paramObjectId,
                title: objectData.title,
                type: objectData.type,
                owner: objectData.owner?._id || objectData.owner?.id || objectData.owner,
                participants: [],
                lastMessage: null,
              },
              ...list,
            ];
          } catch (innerErr) {
            // ignore object fetch failure
          }
        }

        if (active) {
          setConversations(list);
          if (!selectedId && list.length > 0) {
            setSelectedId(list[0].objectId);
          }
        }
      } catch (err) {
        if (active) setError("Não foi possível carregar as conversas.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [selectedId, paramObjectId]);

  useEffect(() => {
    if (paramObjectId) {
      setSelectedId(paramObjectId);
    }
  }, [paramObjectId]);

  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  const getCounterpartName = (conv) => {
    const currentId = user?.id;
    if (!currentId) return "Utilizador";
    const participants = conv?.participants || [];
    const other = participants.find((p) => p.id && p.id !== currentId);
    return other?.name || other?.email || "unknown user";
  };

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.objectId === selectedId),
    [conversations, selectedId]
  );
  const selectedCounterpartName = selectedConversation ? getCounterpartName(selectedConversation) : "Utilizador";

  const handleDeleteConversation = async (objectId) => {
    if (!objectId) return;
    const ok = window.confirm("Apagar esta conversa?");
    if (!ok) return;
    try {
      await api.delete(`/chats/${objectId}`);
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.objectId !== objectId);
        if (selectedId === objectId) {
          setSelectedId(remaining[0]?.objectId || "");
        }
        return remaining;
      });
    } catch (err) {
      setError("Nao foi possivel remover a conversa.");
    }
  };

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Mensagens</p>
          <h2>O teu centro de chat</h2>
          <p className="muted">
            Gere todas as conversas sobre anúncios num só lugar. Escolhe um anúncio e responde aos contactos.
          </p>
        </div>
      </header>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">A carregar...</p>}

      {!loading && conversations.length === 0 && (
        <div className="card">
          <p className="muted">Ainda não tens conversas. Quando alguém te enviar mensagem sobre um anúncio, ela aparece aqui.</p>
        </div>
      )}

      {!loading && conversations.length > 0 && (
        <div className="chat-layout">
          <aside className="chat-list card">
            <div className="chat-list__header">
              <h4>Conversas</h4>
              <button className="ghost-btn" type="button" onClick={() => navigate("/")}>
                Ver anúncios
              </button>
            </div>
            <div className="chat-list__items">
              {conversations.map((conv) => {
                const isActive = conv.objectId === selectedId;
                const lastSnippet = conv.lastMessage?.content || "Sem mensagens ainda.";
                const counterpartName = getCounterpartName(conv);
                return (
                  <div key={conv.objectId} className={`chat-list__item ${isActive ? "chat-list__item--active" : ""}`}>
                    <button
                      type="button"
                      className="chat-list__item-main"
                      onClick={() => setSelectedId(conv.objectId)}
                    >
                      <div className="chat-list__title">
                        <span className={`badge ${conv.type === "Encontrado" ? "badge--found" : "badge--lost"}`}>
                          {conv.type || "Anuncio"}
                        </span>
                        <strong>{counterpartName}</strong>
                      </div>
                      <p className="muted" style={{ margin: "0.15rem 0 0" }}>
                        {lastSnippet}
                      </p>
                    </button>
                    <button
                      type="button"
                      className="ghost-btn chat-list__item-delete"
                      onClick={() => handleDeleteConversation(conv.objectId)}
                    >
                      Apagar
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>
          <section className="chat-stage card">
            {selectedConversation ? (
              <>
                <div className="chat-stage__header">
                  <div>
                    <p className="eyebrow">Utilizador</p>
                    <h3>{selectedCounterpartName}</h3>
                  </div>
                  <span className={`badge ${selectedConversation.type === "Encontrado" ? "badge--found" : "badge--lost"}`}>
                    {selectedConversation.type || "Anúncio"}
                  </span>
                </div>
                <ChatPanel objectId={selectedConversation.objectId} ownerId={selectedConversation.owner} />
              </>
            ) : (
              <p className="muted">Escolhe um anúncio para abrir o chat.</p>
            )}
          </section>
        </div>
      )}
      <div style={{ marginTop: "1rem" }}>
        <p className="muted" style={{ margin: 0 }}>
          Sessão: {user?.name || user?.email}
        </p>
      </div>
    </div>
  );
}

export default ChatInbox;
