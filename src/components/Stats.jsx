// The two findings every play has, in either mode: how many real scams
// slipped past, and which kind of message caught the player out most.
// A workshop shows them under its before/after; the public quiz shows
// them on their own.

const TYPE_LABEL = {
  sms: 'SMS',
  email: 'Email',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  popup: 'Browser popups',
  upi: 'UPI / GPay',
};

export function Stat({ value, label, note, danger }) {
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

export function WavedThroughStat({ summary }) {
  return (
    <Stat
      value={summary.scamsWavedThrough}
      label={
        summary.scamsWavedThrough === 1 ? 'Scam waved through' : 'Scams waved through'
      }
      note="Real scams you marked as safe. The costly kind of mistake."
      danger={summary.scamsWavedThrough > 0}
    />
  );
}

export function BlindSpotStat({ summary }) {
  return (
    <Stat
      value={summary.weakestType ? TYPE_LABEL[summary.weakestType] : 'None'}
      label="Biggest blind spot"
      note={
        summary.weakestType
          ? 'The channel you misread most often'
          : 'No channel tripped you up more than once'
      }
    />
  );
}
