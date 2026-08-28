const TYPE_LABEL = {
  sms: 'SMS',
  email: 'Email',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  popup: 'Browser popups',
  upi: 'UPI / GPay',
};

function secs(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Describe the before/after result honestly — including when it went
 * down. Overstating a null result is the fastest way to lose a
 * stakeholder's trust in every other number on the page.
 */
function readImprovement({ improvement, baselineScore, trainedScore }) {
  if (baselineScore === 100 && trainedScore === 100)
    return {
      tone: 'flat',
      headline: 'Perfect throughout',
      sub: 'You caught every example in both halves. Nothing left to teach here.',
    };
  if (improvement > 0)
    return {
      tone: 'up',
      headline: `+${improvement} points`,
      sub: 'Your scam detection improved after seeing the red flags.',
    };
  if (improvement === 0)
    return {
      tone: 'flat',
      headline: 'Held steady',
      sub: 'You scored the same on both halves — consistent, but there is room to sharpen.',
    };
  return {
    tone: 'down',
    headline: `${improvement} points`,
    sub: 'You did better on the first half. Worth a second run — speed is often the culprit.',
  };
}

export default function ImpactPanel({ summary }) {
  const { baselineScore, trainedScore } = summary;
  const read = readImprovement(summary);
  const faster =
    summary.medianResponseMsTrained < summary.medianResponseMsBaseline;

  return (
    <section className={`ip-panel ip-${read.tone}`}>
      <header className="ip-head">
        <p className="ip-eyebrow">Learning Impact</p>
        <h2 className="ip-headline">{read.headline}</h2>
        <p className="ip-sub">{read.sub}</p>
      </header>

      {/* Before → after, on matched question sets */}
      <div className="ip-bars">
        <Bar label="First half" caption="Before learning" value={baselineScore} variant="before" />
        <div className="ip-arrow" aria-hidden="true">→</div>
        <Bar label="Second half" caption="After learning" value={trainedScore} variant="after" />
      </div>

      <p className="ip-method">
        Both halves contain the same mix of real and fake messages, so the
        two scores are directly comparable.
      </p>

      <div className="ip-stats">
        <Stat
          value={secs(summary.medianResponseMsTrained)}
          label="Typical decision time"
          note={
            faster
              ? `${secs(summary.medianResponseMsBaseline)} at the start — you got quicker`
              : `${secs(summary.medianResponseMsBaseline)} at the start — you slowed down to think`
          }
        />
        <Stat
          value={summary.scamsWavedThrough}
          label={
            summary.scamsWavedThrough === 1
              ? 'Scam waved through'
              : 'Scams waved through'
          }
          note="Real scams you marked as safe — the costly kind of mistake"
          danger={summary.scamsWavedThrough > 0}
        />
        <Stat
          value={
            summary.weakestType ? TYPE_LABEL[summary.weakestType] : 'None'
          }
          label="Biggest blind spot"
          note={
            summary.weakestType
              ? 'The channel you misread most often'
              : 'You read every channel correctly'
          }
        />
      </div>
    </section>
  );
}

function Bar({ label, caption, value, variant }) {
  return (
    <div className={`ip-bar ip-bar-${variant}`}>
      <div className="ip-bar-track">
        <div className="ip-bar-fill" style={{ height: `${Math.max(value, 3)}%` }} />
        <span className="ip-bar-value">{value}%</span>
      </div>
      <span className="ip-bar-label">{label}</span>
      <small className="ip-bar-caption">{caption}</small>
    </div>
  );
}

function Stat({ value, label, note, danger }) {
  return (
    <div className="ip-stat">
      <span className={`ip-stat-value ${danger ? 'ip-stat-danger' : ''}`}>
        {value}
      </span>
      <span className="ip-stat-label">{label}</span>
      <small className="ip-stat-note">{note}</small>
    </div>
  );
}
