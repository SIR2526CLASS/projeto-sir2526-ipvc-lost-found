// Object details page.
﻿import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import ObjectCard from "../components/ObjectCard";
import { useAuth } from "../context/AuthContext";

function ObjectDetails() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [item, setItem] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [{ data: objectData }, { data: listData }] = await Promise.all([
          api.get(`/objects/${id}`),
          api.get("/objects"),
        ]);
        if (!active) return;
        setItem(objectData);
        setRelated(listData.filter((obj) => (obj._id || obj.id) !== id).slice(0, 3));
      } catch (err) {
        if (active) {
          const message = err.response?.data?.message || "Nao foi possivel carregar o anuncio.";
          setError(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const formattedDate = useMemo(() => {
    if (!item?.date) return "";
    const d = new Date(item.date);
    return Number.isNaN(d) ? item.date : d.toLocaleDateString("pt-PT");
  }, [item]);

  const ownerName = item?.owner?.name || item?.owner?.email;
  const ownerId = typeof item?.owner === "object" ? item?.owner?._id || item?.owner?.id : item?.owner;
  const isOwner = ownerId && user?.id && ownerId === user.id;

  if (loading) {
    return (
      <div className="page">
        <p className="muted">A carregar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h2>Erro</h2>
        <p className="error">{error}</p>
        <Link to="/" className="link-btn">
          Voltar a lista
        </Link>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page">
        <h2>Objeto nao encontrado</h2>
        <p className="muted">Nao encontramos detalhes para este anuncio.</p>
        <Link to="/" className="link-btn">
          Voltar a lista
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="object-details">
        <div className="object-details__main">
          <p className={`badge ${item.type === "Encontrado" ? "badge--found" : "badge--lost"}`}>{item.type}</p>
          <h2>{item.title}</h2>
          <p className="muted">Publicado em {formattedDate}</p>
          {ownerName && (
            <p className="muted" style={{ marginTop: "0.25rem" }}>
              Publicado por {ownerName}
            </p>
          )}
          <p>
            <strong>Local:</strong> {item.location}
          </p>
          <p>{item.description}</p>
          {item.photoUrl && (
            <div style={{ marginTop: "1rem" }}>
              <img src={item.photoUrl} alt={item.title} style={{ maxWidth: "100%", borderRadius: "12px" }} />
            </div>
          )}
        </div>
        {isOwner && (
          <button
            className="primary-btn"
            type="button"
            onClick={async () => {
              const confirmDelete = window.confirm("Marcar como devolvido? O anuncio sera removido.");
              if (!confirmDelete) return;
              try {
                await api.delete(`/objects/${item._id || item.id}`);
                navigate("/");
              } catch (err) {
                alert("Nao foi possivel remover o anuncio.");
              }
            }}
          >
            Marcar como devolvido (apagar anuncio)
          </button>
        )}
        <aside className="object-details__sidebar card">
          <h4>Contactar</h4>
          <p className="muted">
            A conversa sobre este anuncio acontece no centro de chat. Abre o chat para falar com o autor.
          </p>
          {isAuthenticated ? (
            <Link className="primary-btn submit-btn" to={`/chat?objectId=${item._id || item.id}`}>
              Abrir chat
            </Link>
          ) : (
            <Link className="primary-btn submit-btn" to="/login">
              Iniciar sessao
            </Link>
          )}
        </aside>
      </div>

      <section>
        <h3>Itens relacionados</h3>
        <div className="grid">
          {related.length === 0 && <p className="muted">Sem itens relacionados.</p>}
          {related.map((obj) => (
            <ObjectCard key={obj._id || obj.id} item={obj} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default ObjectDetails;
