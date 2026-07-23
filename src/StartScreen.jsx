import { useEffect, useState } from 'react';
import './StartScreen.css';
import farmerHero from './assets/farmer-hero.jpg';
import MgbLogo from './assets/MgbLogo';
import { useLocale } from './i18n/LocaleContext';

export default function StartScreen({ onStart }) {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const tmo = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(tmo);
  }, []);

  // Split the localized headline into words for the staggered reveal; the final word
  // gets the accent highlight. Works in any language.
  const words = t('start.headlineMain').split(' ');

  return (
    <div className={`hs-root ${visible ? 'hs-visible' : ''}`}>
      <div className="hs-bg-glow hs-glow-blue" />
      <div className="hs-bg-glow hs-glow-green" />

      {/* Brand bar */}
      <header className="hs-brandbar hs-reveal hs-delay-0">
        <MgbLogo size={34} className="hs-brand-logo" />
        <span className="hs-brand-name">{t('start.bankName')}</span>
      </header>

      {/* ── HERO ── */}
      <main className="hs-grid">
        {/* Real farmer photo — the visual anchor */}
        <div className="hs-hero-media hs-reveal hs-delay-2">
          <div className="hs-hero-frame">
            <img
              src={farmerHero}
              alt={t('start.heroAlt')}
              className="hs-hero-img"
              loading="eager"
            />
          </div>
          <div className="hs-hero-badge">
            <span className="hs-hero-badge-icon" aria-hidden="true">
              🛡️
            </span>
            <span>{t('start.heroBadge')}</span>
          </div>
        </div>

        {/* Copy + CTA */}
        <div className="hs-left">
          <div className="hs-eyebrow hs-reveal hs-delay-3">
            <span className="hs-eyebrow-dot" />
            {t('start.eyebrow')}
          </div>

          <h1 className="hs-headline">
            {words.map((word, i) => (
              <span key={i} className="hs-word-wrap">
                <span
                  className="hs-word"
                  style={{ animationDelay: `${0.18 + i * 0.13}s` }}
                >
                  {i === words.length - 1 ? (
                    <span className="hs-gradient-word">{word}</span>
                  ) : (
                    word
                  )}
                  {i < words.length - 1 ? ' ' : ''}
                </span>
              </span>
            ))}
            <br />
            <span className="hs-word-wrap">
              <span
                className="hs-word hs-subtitle-line"
                style={{ animationDelay: '0.6s' }}
              >
                {t('start.headlineSub')}
              </span>
            </span>
          </h1>

          <p className="hs-body hs-reveal hs-delay-4">{t('start.body')}</p>

          <div className="hs-pills hs-reveal hs-delay-5">
            <span className="hs-pill">{t('start.pillTime')}</span>
            <span className="hs-pill">{t('start.pillFree')}</span>
            <span className="hs-pill">{t('start.pillNoSignup')}</span>
          </div>

          <div className="hs-cta-wrap hs-reveal hs-delay-6">
            <button className="hs-cta" onClick={onStart}>
              {t('start.cta')}
              <svg className="hs-cta-arrow" viewBox="0 0 20 20" fill="none">
                <path
                  d="M4 10h12M11 5l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <p className="hs-cta-hint">{t('start.ctaHint')}</p>
          </div>
        </div>
      </main>

      {/* Footer — MGB wordmark + fraud helpline */}
      <footer className="hs-footer">
        <div className="hs-footer-wordmark" aria-label={t('start.bankName')}>
          <MgbLogo size={28} />
          <span className="hs-footer-name">{t('start.bankName')}</span>
        </div>
        <p className="hs-footer-help">{t('start.footerHelp')}</p>
      </footer>
    </div>
  );
}
