// Card view for object listings.
import { Link } from "react-router-dom";
import "./ObjectCard.css";

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d)) return value;
  return d.toLocaleDateString("pt-PT");
}

function ObjectCard({ item }) {
  const id = item._id || item.id;

  return (
    <article className="object-card">
      <header className="object-card__header">
        <p className={`badge ${item.type === "Encontrado" ? "badge--found" : "badge--lost"}`}>{item.type}</p>
        <span className="object-card__date">{item.date ? formatDate(item.date) : ""}</span>
      </header>
      <h3 className="object-card__title">{item.title}</h3>
      <p className="object-card__location">
        <strong>Local:</strong> {item.location}
      </p>
      <p className="object-card__excerpt">{item.description || "Sem descrição."}</p>
      {item.owner?.name && (
        <p className="object-card__owner muted" style={{ margin: 0 }}>
          Publicado por {item.owner.name}
        </p>
      )}
      <div className="object-card__actions">
        <Link className="link-btn" to={`/object/${id}`}>
          Ver detalhes
        </Link>
      </div>
    </article>
  );
}

export default ObjectCard;
