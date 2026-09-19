/**
 * Where the explanation card points, and which element lights up.
 *
 * Most flags mark a phrase inside `scam.message`, so the span already
 * knows its own flag id and nothing here is needed. But three screens
 * draw bespoke layouts where a flag has no phrase to attach to: the UPI
 * request has no message at all, the rich Netflix email renders a hero
 * block instead of text, and WhatsApp lifts the link out of the bubble
 * into a preview card.
 *
 * Those screens used to name flags directly in the JSX — `activeFlagId
 * === 'fake-upi-id'` and so on. Renaming a flag in scams.js then broke
 * the highlight with nothing to catch it: no error, no failing test,
 * just a card opening against blank space. So the pairing now lives in
 * the data, as a `anchors` map of flag id to a slot name the screen
 * provides, and the screen only ever asks about slots.
 */

/**
 * Binds a scam's anchor map to whichever flag is showing right now.
 *
 * @param {object} scam          the current scenario
 * @param {string|null} activeFlagId  the flag being explained, if any
 * @returns {{ idFor: (slot: string) => string|null,
 *             on: (slot: string) => boolean,
 *             anchor: (slot: string) => object }}
 */
export function makeSlots(scam, activeFlagId) {
  const anchors = scam.anchors ?? {};

  const idFor = (slot) =>
    Object.keys(anchors).find((flagId) => anchors[flagId] === slot) ?? null;

  return {
    /** The flag id assigned to this slot, or null if the scam has none. */
    idFor,

    /** True when the flag being explained belongs to this slot. */
    on: (slot) => Boolean(activeFlagId) && anchors[activeFlagId] === slot,

    /**
     * Spread onto the element the card should point at. Rendered
     * whether or not the flag is showing, so the card can always find
     * its target by name rather than by hunting for a lit-up element.
     */
    anchor: (slot) => {
      const id = idFor(slot);
      return id ? { 'data-flag-anchor': id } : {};
    },
  };
}
