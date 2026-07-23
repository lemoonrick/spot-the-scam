import { useEffect, useState } from 'react';
import {
  ChatText,
  WhatsappLogo,
  EnvelopeSimple,
  InstagramLogo,
  Warning,
  Wallet,
  DeviceMobile,
  ShieldCheck,
  ThumbsUp,
  Check,
  X,
  ArrowClockwise,
  ArrowUpRight,
} from '@phosphor-icons/react';
import { scams as allScams } from './scams';
import { useLocale } from './i18n/LocaleContext';
import { localizeScam } from './i18n/localizeScam';
import MgbLogo from './assets/MgbLogo';
import cropBand from './assets/crop-band.jpg';
import './AnalyticsScreen.css';

const TYPE_ICON = {
  sms: ChatText,
  email: EnvelopeSimple,
  whatsapp: WhatsappLogo,
  instagram: InstagramLogo,
  popup: Warning,
  upi: Wallet,
};

function getScoreColor(s) {
  if (s < 40) return '#c5372f';
  if (s < 75) return '#b8730a';
  return '#157f43';
}

// Returns the display-independent tier + icon; the copy comes from strings.js via t().
function getFeedback(score) {
  if (score >= 80)
    return { Icon: ShieldCheck, key: 'an.feedbackHigh', tier: 'high' };
  if (score >= 50)
    return { Icon: ThumbsUp, key: 'an.feedbackMid', tier: 'mid' };
  return { Icon: Warning, key: 'an.feedbackLow', tier: 'low' };
}

export default function AnalyticsScreen({ results, onRestart }) {
  const { locale, t } = useLocale();
  const total = results.length;
  const correct = results.filter((r) => r.verdictCorrect).length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  const [displayScore, setDisplayScore] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const scoreColor = getScoreColor(displayScore);
  const feedback = getFeedback(score);
  const FeedbackIcon = feedback.Icon;

  useEffect(() => {
    const delay = setTimeout(() => {
      let current = 0;
      const step = setInterval(() => {
        current += 1;
        if (current >= score) {
          current = score;
          clearInterval(step);
        }
        setDisplayScore(current);
      }, 18);
      return () => clearInterval(step);
    }, 300);

    setTimeout(() => setRevealed(true), 250);
    return () => clearTimeout(delay);
  }, [score]);

  // Match each result to its scam (localized for the active language).
  const breakdown = results.map((r) => {
    const raw = allScams.find((s) => s.id === r.scamId);
    return { ...r, scam: localizeScam(raw, locale) };
  });

  return (
    <div className="an-page">
      {/* ── Image band (real crop photo) ── */}
      <header className="an-band">
        <img src={cropBand} alt="" className="an-band-img" />
        <div className="an-band-overlay" />
        <div className="an-band-content">
          <div className="an-band-brand">
            <MgbLogo size={28} />
            <span>{t('start.bankName')}</span>
          </div>
          <h1 className="an-band-title">{t('an.yourResults')}</h1>
        </div>
      </header>

      <section className="an-hero">
        {/* LEFT — score */}
        <aside className="an-score-side">
          <div className="an-ring-wrap">
            <svg className="an-ring-svg" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="var(--c-border)"
                strokeWidth="9"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={scoreColor}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - displayScore / 100)}`}
                transform="rotate(-90 60 60)"
                style={{
                  transition: 'stroke-dashoffset 0.04s linear, stroke 0.3s ease',
                }}
              />
            </svg>
            <div className="an-ring-inner">
              <span className="an-score-num">{displayScore}</span>
              <span className="an-score-pct">%</span>
            </div>
          </div>

          <p className="an-tally">{t('an.tally', { correct, total })}</p>

          <div className={`an-badge an-badge-${feedback.tier}`}>
            <FeedbackIcon size={18} weight="fill" />
            <span>{t(feedback.key)}</span>
          </div>

          <button className="an-restart" onClick={onRestart}>
            <ArrowClockwise size={18} weight="bold" />
            {t('an.tryAgain')}
          </button>
        </aside>

        {/* RIGHT — breakdown */}
        <div className="an-breakdown-side">
          <h2 className="an-breakdown-title">{t('an.breakdownTitle')}</h2>
          <ol className="an-breakdown-grid">
            {breakdown.map((item, i) => {
              const { scam, verdictCorrect, verdictChosen } = item;
              if (!scam) return null;
              const ChannelIcon = TYPE_ICON[scam.type] || DeviceMobile;

              return (
                <li
                  key={i}
                  className={`an-item ${verdictCorrect ? 'an-item-correct' : 'an-item-wrong'}`}
                  style={{ animationDelay: revealed ? `${i * 0.05}s` : '0s' }}
                >
                  <div className="an-item-icon">
                    <ChannelIcon size={20} weight="regular" />
                  </div>

                  <div className="an-item-body">
                    <span className="an-item-type">{t(`type.${scam.type}`)}</span>

                    <span className="an-item-verdict">
                      {t('an.youSaid')}{' '}
                      <strong>
                        {verdictChosen === 'phishing'
                          ? t('scam.verdictPhishing')
                          : t('scam.verdictLegit')}
                      </strong>
                      {' · '}
                      <span
                        className={
                          verdictCorrect ? 'an-verdict-ok' : 'an-verdict-bad'
                        }
                      >
                        {verdictCorrect
                          ? t('an.correctMark')
                          : t('an.wrongWas', {
                              verdict:
                                scam.verdict === 'phishing'
                                  ? t('scam.verdictPhishing')
                                  : t('scam.verdictLegit'),
                            })}
                      </span>
                    </span>

                    <span className="an-item-short">
                      {scam.explanation.short}
                    </span>

                    {scam.article && (
                      <a
                        href={scam.article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="an-item-article"
                      >
                        {scam.article.title}
                        <ArrowUpRight size={13} weight="bold" />
                      </a>
                    )}
                  </div>

                  <div
                    className={`an-item-tick ${verdictCorrect ? 'tick-yes' : 'tick-no'}`}
                    aria-hidden="true"
                  >
                    {verdictCorrect ? (
                      <Check size={15} weight="bold" />
                    ) : (
                      <X size={15} weight="bold" />
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </div>
  );
}
