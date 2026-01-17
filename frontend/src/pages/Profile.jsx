// Profile page with user stats.
﻿import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import ObjectCard from "../components/ObjectCard";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { key: "all", label: "Publicacoes" },
  { key: "found", label: "Encontrados" },
  { key: "lost", label: "Perdidos" },
];

function Profile() {
  const { user } = useAuth();
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/objects");
        if (active) setObjects(data);
      } catch (err) {
        if (active) setError("Nao foi possivel carregar os anuncios.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const myObjects = useMemo(() => {
    if (!user?.id) return [];
    return objects.filter((o) => {
      const ownerId = typeof o.owner === "object" ? o.owner?._id || o.owner?.id : o.owner;
      return ownerId === user.id;
    });
  }, [objects, user]);

  const stats = useMemo(() => {
    const total = myObjects.length;
    const found = myObjects.filter((o) => o.type === "Encontrado").length;
    const lost = myObjects.filter((o) => o.type === "Perdido").length;
    return { total, found, lost };
  }, [myObjects]);

  const filtered = useMemo(() => {
    if (activeTab === "found") return myObjects.filter((o) => o.type === "Encontrado");
    if (activeTab === "lost") return myObjects.filter((o) => o.type === "Perdido");
    return myObjects;
  }, [myObjects, activeTab]);

  return (
    <div className="page profile-page">
      <section className="profile-hero card">
        <div className="profile-hero__header">
          <div className="avatar-circle">{(user?.name || user?.email || "?").slice(0, 2).toUpperCase()}</div>
          <div>
            <h2>{user?.name || "Utilizador"}</h2>
            <p className="profile-email">{user?.email}</p>
          </div>
        </div>
        <div className="profile-stats">
          <div className="stat-card compact">
            <p className="muted">Publicações</p>
            <h3>{stats.total}</h3>
          </div>
          <div className="stat-card compact">
            <p className="muted">Encontrados</p>
            <h3>{stats.found}</h3>
          </div>
          <div className="stat-card compact">
            <p className="muted">Perdidos</p>
            <h3>{stats.lost}</h3>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="profile-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab-btn ${activeTab === tab.key ? "tab-btn--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && <p className="muted">A carregar...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <div className="grid">
            {filtered.length === 0 && <p className="muted">Nenhum anuncio nesta secção.</p>}
            {filtered.map((item) => (
              <ObjectCard key={item._id || item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Profile;
