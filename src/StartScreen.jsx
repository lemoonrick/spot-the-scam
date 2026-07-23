import { useEffect, useState } from 'react';
import { ShieldCheck, Clock, Gift, Lock, ArrowRight } from '@phosphor-icons/react';
import './StartScreen.css';
import farmerHero from './assets/farmer-hero.jpg';
import MgbLogo from './assets/MgbLogo';
import { useLocale } from './i18n/LocaleContext';

export default function StartScreen({ onStart }) {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const tmo = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(tmo);
  }, []);

  // Emphasise the final word of the headline in the brand accent (same font family).
  const headline = t('start.headlineMain').trim();
  const lastSpace = headline.lastIndexOf(' ');
  const headLead = lastSpace > -1 ? headline.slice(0, lastSpace) : '';
  const headAccent = lastSpace > -1 ? headline.slice(lastSpace + 1) : headline;

  return (
    <div className={`hs-root ${visible ? 'hs-visible' : ''}`}>
      <header className="hs-brandbar">
        <MgbLogo size={34} className="hs-brand-logo" />
        <span className="hs-brand-name">{t('start.bankName')}</span>
      </header>

      <main className="hs-grid">
        <div className="hs-left">
          <h1 className="hs-headline">
            {headLead && <span>{headLead} </span>}
            <span className="hs-accent">{headAccent}</span>
            <br />
            <span className="hs-headline-sub">{t('start.headlineSub')}</span>
          </h1>

          <p className="hs-body">{t('start.body')}</p>

          <button className="hs-cta" onClick={onStart}>
            {t('start.cta')}
            <ArrowRight size={20} weight="bold" />
          </button>

          <ul className="hs-facts">
            <li className="hs-fact">
              <Clock size={18} weight="regular" />
              {t('start.pillTime')}
            </li>
            <li className="hs-fact">
              <Gift size={18} weight="regular" />
              {t('start.pillFree')}
            </li>
            <li className="hs-fact">
              <Lock size={18} weight="regular" />
              {t('start.pillNoSignup')}
            </li>
          </ul>
        </div>

        <div className="hs-media">
          <div className="hs-media-frame">
            <img
              src={farmerHero}
              alt={t('start.heroAlt')}
              className="hs-media-img"
              loading="eager"
            />
          </div>
          <div className="hs-media-badge">
            <ShieldCheck size={20} weight="fill" />
            <span>{t('start.heroBadge')}</span>
          </div>
        </div>
      </main>

      <footer className="hs-footer">
        <div className="hs-footer-brand" aria-label={t('start.bankName')}>
          <MgbLogo size={26} />
          <span>{t('start.bankName')}</span>
        </div>
        <p className="hs-footer-help">{t('start.footerHelp')}</p>
      </footer>
    </div>
  );
}
