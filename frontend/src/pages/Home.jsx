// Home page with filters and object list.
﻿import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import ObjectCard from "../components/ObjectCard";

const categoryOptions = [
  "Eletronicos",
  "Documentos",
  "Roupas",
  "Acessorios",
  "Outros",
];

const locationOptions = [
  "Bar da ESTG",
  ...Array.from({ length: 11 }, (_, i) => `Sala 1.${i + 1}`),
  ...Array.from({ length: 11 }, (_, i) => `Sala 2.${i + 1}`),
  ...Array.from({ length: 11 }, (_, i) => `Sala 3.${i + 1}`),
  "Biblioteca",
  "Cantina",
  "Auditorio",
];

function Home() {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [locationFilter, setLocationFilter] = useState("Todos");
  const [categoryFilter, setCategoryFilter] = useState("Todos");

  useEffect(() => {
    let active = true;
    const loadObjects = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/objects");
        if (active) {
          setObjects(data);
        }
      } catch (err) {
        if (active) {
          setError("Nao foi possivel carregar os objetos.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadObjects();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = objects.length;
    const lost = objects.filter((o) => o.type === "Perdido").length;
    const found = objects.filter((o) => o.type === "Encontrado").length;
    return { total, lost, found };
  }, [objects]);

  const filteredObjects = useMemo(() => {
    return objects.filter((obj) => {
      const matchesType = typeFilter === "Todos" || obj.type === typeFilter;
      const matchesLocation = locationFilter === "Todos" || obj.location === locationFilter;
      const matchesCategory = categoryFilter === "Todos" || obj.category === categoryFilter;
      const matchesSearch = `${obj.title} ${obj.description}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      return matchesType && matchesLocation && matchesCategory && matchesSearch;
    });
  }, [objects, search, typeFilter, locationFilter, categoryFilter]);

  return (
    <div className="page home-page">
    
      <section className="home-hero card">
        <div>
          <p className="eyebrow">IPVC Lost + Found</p>
          <h1>Objetos recentes</h1>
          <p className="muted">Explore, filtre e acompanhe objetos perdidos e encontrados no campus.</p>
        </div>
      </section>
      <section className="filter-bar card">
        <div className="filter-item stretch">
          <span className="filter-label">Pesquisar</span>
          <input
            type="search"
            placeholder="Procure por titulo ou descricao"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>
        

      <section className="filter-bar card">
        <div className="filter-item">
          <span className="filter-label">Tipo</span>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option>Todos</option>
            <option value="Perdido">Perdido</option>
            <option value="Encontrado">Encontrado</option>
          </select>
        </div>
        <div className="filter-item">
          <span className="filter-label">Localizacao</span>
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
            <option>Todos</option>
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-item">
           <span className="filter-label">Categoria</span>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option>Todos</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="stat-grid">
        <div className="stat-card">
          <p className="muted">Total de Objetos</p>
          <h3>{stats.total}</h3>
        </div>
        <div className="stat-card">
          <p className="muted">Objetos Perdidos</p>
          <h3>{stats.lost}</h3>
        </div>
        <div className="stat-card">
          <p className="muted">Objetos Encontrados</p>
          <h3>{stats.found}</h3>
        </div>
      </section>

      <div className="list-header">
        <h3>Objetos Recentes</h3>
      </div>

      {loading && <p className="muted">A carregar...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <section className="grid">
          {filteredObjects.length === 0 && <p className="muted">Nenhum objeto encontrado.</p>}
          {filteredObjects.map((item) => (
            <ObjectCard key={item._id || item.id} item={item} />
          ))}
        </section>
      )}
    </div>
  );
}

export default Home;
