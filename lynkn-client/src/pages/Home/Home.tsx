import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicPreferenceControls from '../../components/PublicPreferenceControls';
import AppLogo from '../../components/AppLogo';
import './Home.css';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const heroRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isDarkMode = localStorage.getItem("theme") !== "light";

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
    <div className={`home-container ${!isDarkMode ? 'light-mode' : ''}`} ref={containerRef}>
      <section className="hero-section">
        <div className="hero-bg-wrapper" ref={heroRef}></div>
        <div className="hero-overlay">
          <header className="hero-header">
            <AppLogo className="home-logo" />
            <div className="home-actions">
              <PublicPreferenceControls className="home-pref-controls" />
              <div className="auth-group">
                <Link to="/login" className="btn-login">{t("home.login")}</Link>
                <Link to="/register" className="btn-register">{t("home.register")}</Link>
              </div>
            </div>
          </header>
          
          <div className="hero-main-text reveal">
            <h1>{t("home.hero_title")}</h1>
            <h2>{t("home.hero_subtitle")}</h2>
            <p className="upgrade-text">{t("home.hero_tagline")}</p>
          </div>
          
          <div className="hero-footer">
            <span>{t("home.hero_footer")}</span>
          </div>
        </div>
      </section>

      <section className="manifesto-section themed">
        <div className="manifesto-content reveal">
          <p>{t("home.manifesto_one_text")}</p>
          <h3 className="highlight">{t("home.manifesto_one_highlight")}</h3>
        </div>
      </section>

      <section className="manifesto-section themed">
        <div className="manifesto-content reveal">
          <p>{t("home.manifesto_two_text")}</p>
          <h3 className="highlight">{t("home.manifesto_two_highlight")}</h3>
        </div>
      </section>

      <footer className="home-footer themed">
        <div className="footer-logo reveal">LYNKN</div>
        <div className="footer-links reveal">
          <a href="#">{t("home.legal_notice")}</a>
          <a href="#">{t("home.terms")}</a>
          <a href="#">{t("home.privacy")}</a>
        </div>
        <p className="reveal">{t("home.copyright")}</p>
      </footer>
    </div>
  );
};

export default Home;
