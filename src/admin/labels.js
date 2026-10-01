// How the admin pages name things, kept in one place so a room report,
// the overall dashboard and a downloaded spreadsheet all say the same.

import { scams } from '../scams';

export const TYPE_LABEL = {
  sms: 'Text message',
  email: 'Email',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  popup: 'Pop-up window',
  upi: 'Payment request',
};

const byId = Object.fromEntries(scams.map((s) => [s.id, s]));

/** "WhatsApp · Jio Support" — which of the ten messages this is. */
export function scamLabel(id) {
  const s = byId[id];
  if (!s) return `Message ${id}`;
  return `${TYPE_LABEL[s.type] ?? s.type} · ${s.senderName || s.sender || 'Unknown'}`;
}

/** Whether a message is a scam or genuine, in plain words. */
export const verdictLabel = (id) =>
  byId[id]?.verdict === 'phishing' ? 'Scam' : 'Genuine';

/**
 * Where a room stands right now. "Ended" means it closed itself when its
 * time ran out; "Closed" means someone closed it.
 */
export function roomStatus(room) {
  if (room.status === 'closed') return { key: 'closed', label: 'Closed' };
  if (!room.open_now) return { key: 'ended', label: 'Ended' };
  return { key: 'open', label: 'Open' };
}

/** "Closes in 3 hours", "Closes in 2 days", "Closed 5 Oct". */
export function closesLabel(room) {
  const ms = new Date(room.closes_at).getTime() - Date.now();
  if (ms <= 0) {
    return `Ended ${new Date(room.closes_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
  }
  const hours = Math.round(ms / 3_600_000);
  if (hours < 1) return 'Closes within the hour';
  if (hours < 48) return `Closes in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  return `Closes in ${Math.round(hours / 24)} days`;
}

/**
 * A workshop date ("2026-09-12") as "12 Sept 2026". Read as a local
 * date: parsed as-is it would be midnight in London, which is the day
 * before for anyone west of it.
 */
export function fmtDay(isoDate) {
  if (!isoDate) return null;
  return new Date(`${isoDate}T00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Today as "2026-09-12", in the admin's own time zone. */
export const today = () => new Date().toLocaleDateString('en-CA');
