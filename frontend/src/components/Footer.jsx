// App footer.
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__content">
        <div>
          <h4>IPVC Lost + Found</h4>
          <p>Plataforma para agilizar a recuperação de objetos perdidos na comunidade IPVC.</p>
        </div>
        <div className="footer__links">
          <a href="https://www.ipvc.pt/" target="_blank" rel="noreferrer">
            Site IPVC
          </a>
          <a href="mailto:helpdesk@ipvc.pt">Helpdesk</a>
        </div>
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} Instituto Politécnico de Viana do Castelo</span>
      </div>
    </footer>
  );
}

export default Footer;
