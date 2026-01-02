// Login page.
﻿import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form);
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || "Nao foi possivel iniciar sessao.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div>
          <p className="eyebrow" style={{ color: "#dfe2ff" }}>
            Plataforma IPVC
          </p>
          <h1 className="auth-hero__title">IPVC Lost + Found</h1>
          <p className="auth-hero__subtitle">Plataforma de Objetos Perdidos e Encontrados</p>
        </div>
        <ul className="auth-hero__list">
          <li>
            <span className="auth-hero__icon">✓</span>
            <div>
              <strong>Publicacao Rapida</strong>
              <p>Registe objetos perdidos ou encontrados</p>
            </div>
          </li>
          <li>
            <span className="auth-hero__icon">✓</span>
            <div>
              <strong>Chat em Tempo Real</strong>
              <p>Comunique diretamente com outros utilizadores</p>
            </div>
          </li>
          <li>
            <span className="auth-hero__icon">✓</span>
            <div>
              <strong>Notificacoes Instantaneas</strong>
              <p>Receba alertas de novas mensagens e atualizacoes</p>
            </div>
          </li>
        </ul>
      </section>

      <section className="auth-card card">
        <div className="auth-card__header">
          <h2>Bem-vindo</h2>
          <p className="muted">Entre na sua conta IPVC</p>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email institucional</span>
            <input
              required
              type="email"
              name="email"
              placeholder="joao.silva@ipvc.pt"
              value={form.email}
              onChange={handleChange}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              required
              type="password"
              name="password"
              placeholder="********"
              value={form.password}
              onChange={handleChange}
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button className="primary-btn submit-btn" type="submit" disabled={loading}>
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>

        <p className="muted auth-card__footer">
          Nao tem conta? <Link to="/register">Registar agora</Link>
        </p>
      </section>
    </div>
  );
}

export default Login;
