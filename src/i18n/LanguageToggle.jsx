import './LanguageToggle.css';
import { useLocale } from './LocaleContext';

// Fixed segmented control shown on every screen. Language names are written in their
// own script so a non-reader can recognise the one they want.
export default function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className="lang-toggle"
      role="group"
      aria-label="Choose language / भाषा निवडा"
    >
      <button
        type="button"
        className={`lang-opt ${locale === 'en' ? 'active' : ''}`}
        aria-pressed={locale === 'en'}
        onClick={() => setLocale('en')}
      >
        English
      </button>
      <button
        type="button"
        className={`lang-opt ${locale === 'mr' ? 'active' : ''}`}
        aria-pressed={locale === 'mr'}
        onClick={() => setLocale('mr')}
      >
        मराठी
      </button>
    </div>
  );
}
