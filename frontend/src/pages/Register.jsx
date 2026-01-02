// Registration page.
﻿import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== confirmPassword) {
      setError("As passwords nao correspondem.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      const message = err.response?.data?.message || "Nao foi possivel registar.";
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
            Comunidade IPVC
          </p>
          <h1 className="auth-hero__title">Junte-se à Comunidade</h1>
          <p className="auth-hero__subtitle">Registe-se e ajude a comunidade IPVC</p>
        </div>
        <ol className="auth-steps">
          <li>
            <div className="auth-step__bullet">1</div>
            <div>
              <strong>Criar Conta</strong>
              <p>Registo rápido com email institucional</p>
            </div>
          </li>
          <li>
            <div className="auth-step__bullet">2</div>
            <div>
              <strong>Publicar Objetos</strong>
              <p>Registe objetos perdidos ou encontrados</p>
            </div>
          </li>
          <li>
            <div className="auth-step__bullet">3</div>
            <div>
              <strong>Conectar</strong>
              <p>Comunique via chat e resolva casos</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="auth-card card">
        <div className="auth-card__header">
          <h2>Criar Conta</h2>
          <p className="muted">Preencha os dados para começar</p>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nome Completo</span>
            <input
              required
              type="text"
              name="name"
              placeholder="Joao Silva"
              value={form.name}
              onChange={handleChange}
            />
          </label>

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

          <label className="field">
            <span>Confirmar Password</span>
            <input
              required
              type="password"
              name="confirmPassword"
              placeholder="********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button className="primary-btn submit-btn" type="submit" disabled={loading}>
            {loading ? "A criar..." : "Criar Conta"}
          </button>
        </form>

        <p className="muted auth-card__footer">
          Ja tem conta? <Link to="/login">Entrar</Link>
        </p>
      </section>
    </div>
  );
}

export default Register;
