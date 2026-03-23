import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.2 });

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => observer.observe(el));

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (heroRef.current && container) {
            const scrollValue = container.scrollTop;
            const scale = 1 + scrollValue * 0.00015; 
            heroRef.current.style.transform = `scale(${scale})`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      observer.disconnect();
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <div className="home-container" ref={containerRef}>
      <section className="hero-section">
        <div className="hero-bg-wrapper" ref={heroRef}></div>
        <div className="hero-overlay">
          <header className="hero-header">
            <span className="logo-text">LYNKN</span>
            <div className="auth-group">
              <Link to="/login" className="btn-login">INICIA SESIÓN</Link>
              <Link to="/register" className="btn-register">REGISTRATE</Link>
            </div>
          </header>
          
          <div className="hero-main-text reveal">
            <h1>Un círculo curado <br /> de gente con futuro.</h1>
            <h2>Cada jueves. Offline.</h2>
            <p className="upgrade-text">Upgrade your Circle.</p>
          </div>
          
          <div className="hero-footer">
            <span>Seleccionamos los miembros a la mano.</span>
          </div>
        </div>
      </section>

      <section className="manifesto-section">
        <div className="manifesto-content reveal">
          <p>Creemos que los mejores <br /> momentos de la vida ocurren</p>
          <h3 className="highlight">fuera de la pantalla.</h3>
        </div>
      </section>

      <section className="manifesto-section">
        <div className="manifesto-content reveal">
          <p>Filtramos</p>
          <h3 className="highlight">para que no <br /> pierdas el tiempo.</h3>
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-logo reveal">LYNKN</div>
        <div className="footer-links reveal">
          <a href="#">LEGAL NOTICE</a>
          <a href="#">TT</a>
          <a href="#">PP</a>
        </div>
        <p className="reveal">© 2026 LYNKN TECH, S.L.</p>
      </footer>
    </div>
  );
};

export default Home;