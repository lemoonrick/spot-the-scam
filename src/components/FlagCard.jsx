import { useLocale } from '../i18n/LocaleContext';
import ReadAloudButton from '../i18n/ReadAloudButton';

// In-flow explanation card. It renders directly below the phone mock (see ScamScreen),
// so there is no fragile absolute-positioning / scroll math — the browser lays it out and
// ScamScreen just scrolls it into view. The matching red-flag stays highlighted inside
// the message above, and a small pointer links the two.
export default function FlagCard({
  flag,
  flagIndex,
  totalFlags,
  isLastFlag,
  isLastScam,
  onNext,
  verdict,
  speechText,
}) {
  const { t } = useLocale();
  const isLegit = verdict === 'legitimate';

  return (
    <div className="flag-card-wrap">
      <div className="flag-card" data-verdict={isLegit ? 'legit' : 'scam'}>
        <span className="flag-card-pointer" aria-hidden="true" />

        {totalFlags > 1 && (
          <div className="flag-dots" aria-hidden="true">
            {Array.from({ length: totalFlags }).map((_, i) => (
              <span
                key={i}
                className={`flag-dot ${i === flagIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        )}

        <div className="flag-card-labelrow">
          <span className="flag-card-label">{flag.label}</span>
          <ReadAloudButton text={speechText || `${flag.label}. ${flag.text}`} />
        </div>

        <p className="flag-card-text">{flag.text}</p>

        <button className="flag-next-btn" onClick={onNext}>
          {isLastFlag
            ? isLastScam
              ? t('flag.seeScore')
              : t('flag.nextExample')
            : t('flag.next')}
        </button>
      </div>
    </div>
  );
}
