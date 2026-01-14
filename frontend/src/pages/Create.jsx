// Create listing form page.
﻿import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  title: "",
  description: "",
  category: "",
  location: "",
  type: "Perdido",
  date: "",
  photoUrl: "",
};
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

const getTodayAtMidnight = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const formatDateForInput = (date) => date.toISOString().split("T")[0];

const verifyDate = (inputDate) => {
  if (!inputDate) return false;
  const selectedDate = new Date(inputDate);
  if (Number.isNaN(selectedDate.getTime())) {
    return false;
  }
  selectedDate.setHours(0, 0, 0, 0);
  return selectedDate <= getTodayAtMidnight();
};


function Create() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter ate 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, photoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);
  const maxDateValue = formatDateForInput(getTodayAtMidnight());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.date) {
      setError("Selecione a data do registo.");
      return;
    }
    if (!verifyDate(form.date)) {
      setError("A data nao pode ser no futuro.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/objects", form);
      setSuccess("Anuncio publicado com sucesso!");
      setForm(initialForm);
    } catch (err) {
      const message = err.response?.data?.message || "Nao foi possivel publicar. Verifica a ligacao ao backend.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page create-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Publicar</p>
          <h1>Registar Anuncio</h1>
          <p className="muted">Preencha os detalhes sobre o objeto perdido ou encontrado.</p>
        </div>
      </div>

      <form className="card form-card create-form" onSubmit={handleSubmit}>
        <div className="type-toggle">
          <label className={`type-option ${form.type === "Perdido" ? "type-option--active" : ""}`}>
            <input
              type="radio"
              name="type"
              value="Perdido"
              checked={form.type === "Perdido"}
              onChange={handleChange}
            />
            <div>
              <strong>Perdi</strong>
              <p>Objeto que perdi</p>
            </div>
          </label>
          <label className={`type-option ${form.type === "Encontrado" ? "type-option--active" : ""}`}>
            <input
              type="radio"
              name="type"
              value="Encontrado"
              checked={form.type === "Encontrado"}
              onChange={handleChange}
            />
            <div>
              <strong>Encontrei</strong>
              <p>Objeto que encontrei</p>
            </div>
          </label>
        </div>

        <label className="field">
          <span>Titulo do Objeto</span>
          <input
            required
            type="text"
            name="title"
            placeholder="Ex.: iPhone 14 Pro Azul"
            value={form.title}
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Descrição</span>
          <textarea
            required
            name="description"
            rows={4}
            placeholder="Inclua detalhes que ajudem a identificar o objeto."
            value={form.description}
            onChange={handleChange}
          />
        </label>

        <div className="two-col">
          <label className="field">
            <span>Categoria</span>
           <select required name="category" value={form.category} onChange={handleChange}>
              <option value="">Seleciona</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Localização</span>
            <select required name="location" value={form.location} onChange={handleChange}>
              <option value="">Seleciona</option>
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>Data</span>
                    <input
            required
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            max={maxDateValue}
          />
        </label>

        <label className="field">
          <span>Imagem (opcional)</span>
          <div
            className={`upload-box ${dragActive ? "upload-box--active" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="muted" style={{ margin: 0 }}>Arraste uma imagem ou clique para escolher</p>
            <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>PNG ou JPG ate 5MB</p>
            {form.photoUrl && (
              <div className="upload-preview">
                <img src={form.photoUrl} alt="Preview" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden-input"
            />
          </div>
        </label>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <div className="form-actions">
          <button className="ghost-btn" type="button" onClick={() => setForm(initialForm)} disabled={loading}>
            Cancelar
          </button>
          <button className="primary-btn submit-btn" type="submit" disabled={loading}>
            {loading ? "A publicar..." : "Publicar Anuncio"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Create;
