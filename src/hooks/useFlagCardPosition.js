import { useCallback, useEffect, useRef, useState } from 'react';

// The card sits just below whatever is highlighted, with a little room
// underneath so it is never flush against the bottom of the phone.
const GAP_BELOW_TARGET = 12;
const BREATHING_ROOM = 48;
const MIN_TOP_MARGIN = 80;
const ASSUMED_CARD_HEIGHT = 260;

// Every screen marks the element a flag points at with
// `data-flag-anchor="<flag id>"`. See components/flagAnchor.js.
//
// This used to hunt for `.active, .safe-active, .upi-active` instead —
// any lit-up element, whichever came first in the DOM. Two ways that
// went wrong. A screen that lights several elements for one flag got
// the card under whichever happened to be first rather than the main
// one. Worse, the explanation card itself sits inside this container
// and draws `.flag-dot.active` for its own progress dots, so whenever
// the message had nothing lit — the Netflix email's "asks for nothing
// sensitive" — the card found its own dot and positioned itself
// against itself.
const anchorFor = (flagId) =>
  flagId ? `[data-flag-anchor="${CSS.escape(flagId)}"]` : null;

/**
 * Places the explanation card under the highlighted part of a message,
 * and scrolls so the whole card is visible.
 *
 * This lived inside ScamScreen, which was also running the question
 * order, the answers, the score and the choice of platform to draw. It
 * is a self-contained job about pixels and has nothing to do with the
 * quiz, so it lives on its own.
 *
 * Positioning happens in two passes on purpose. The first works out
 * where the card goes and how much room the container needs; the second
 * scrolls, but only once that extra room is really in the DOM, or the
 * scroll target is computed against a container that is about to grow.
 */
export function useFlagCardPosition({ active, activeFlagId }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const cardHeightRef = useRef(ASSUMED_CARD_HEIGHT);

  const [position, setPosition] = useState({ top: 0, left: 0, gap: 0 });
  const [containerPad, setContainerPad] = useState(0);

  const findTarget = useCallback(() => {
    const selector = anchorFor(activeFlagId);
    if (!selector) return null;
    // Only ever look inside the message being shown. The card is a
    // sibling of it in this container and must never be its own target.
    return contentRef.current?.querySelector(selector) ?? null;
  }, [activeFlagId]);

  /**
   * The card drops below this, which is not always the highlight.
   *
   * Sitting directly under the highlighted phrase meant the card landed
   * on the rest of the message: the Swiggy chat lit up the shop name in
   * line one and then hid lines two and three behind the explanation.
   * So each screen marks the block its message lives in, and the card
   * clears the whole block. The phrase still lights up; the card just
   * waits until the reader can see all of what it is talking about.
   */
  const findClearance = useCallback(() => {
    const target = findTarget();
    return target?.closest('[data-flag-clear]') ?? target;
  }, [findTarget]);

  const place = useCallback(() => {
    const target = findTarget();
    const clearance = findClearance();
    if (!containerRef.current || !target) return;

    const container = containerRef.current.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    const below = clearance.getBoundingClientRect();

    // Vertically: below the whole block. Horizontally: still centred on
    // the highlight.
    const top = below.bottom - container.top + GAP_BELOW_TARGET;
    const left = rect.left - container.left + rect.width / 2;

    // How far the card ended up from the phrase it explains. When the
    // highlight is the last line of a message this is nearly nothing and
    // the card's arrow does the pointing. When the highlight is the
    // first line of a long email it can be the height of the whole
    // message, and an arrow alone points at empty space — so the card
    // draws a line back up to the phrase instead.
    const gap = top - (rect.bottom - container.top);
    setPosition({ top, left, gap });

    // Grow the container only by however much the card overhangs the
    // phone's natural height.
    const phoneHeight = contentRef.current?.scrollHeight ?? 0;
    const overflow =
      top + cardHeightRef.current + BREATHING_ROOM - phoneHeight;
    if (overflow > 0) setContainerPad((prev) => Math.max(prev, overflow));
  }, [findTarget, findClearance]);

  /** The card reports its real height once rendered. */
  const measure = useCallback(
    (height) => {
      cardHeightRef.current = height;
      place();
    },
    [place],
  );

  /** Back to a clean slate for the next question. */
  const reset = useCallback(() => {
    setPosition({ top: 0, left: 0, gap: 0 });
    setContainerPad(0);
    cardHeightRef.current = ASSUMED_CARD_HEIGHT;
  }, []);

  // Pass one: work out where the card goes.
  useEffect(() => {
    if (!active) return;
    const raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, [active, place]);

  // Pass two: scroll, now that any extra room has been applied.
  useEffect(() => {
    if (!active) return;
    const raf = requestAnimationFrame(() => {
      const target = findTarget();
      const clearance = findClearance();
      if (!containerRef.current || !target) return;

      const container = containerRef.current.getBoundingClientRect();
      const cardTop =
        clearance.getBoundingClientRect().bottom - container.top + GAP_BELOW_TARGET;

      const cardBottomOnPage =
        window.scrollY +
        container.top +
        cardTop +
        cardHeightRef.current +
        BREATHING_ROOM;

      if (cardBottomOnPage > window.scrollY + window.innerHeight) {
        window.scrollTo({
          top: cardBottomOnPage - window.innerHeight,
          behavior: 'smooth',
        });
      }
      // If the highlight itself has been pushed under the top of the
      // screen, bring it back down.
      if (target.getBoundingClientRect().top < MIN_TOP_MARGIN) {
        window.scrollTo({
          top:
            window.scrollY +
            target.getBoundingClientRect().top -
            MIN_TOP_MARGIN,
          behavior: 'smooth',
        });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [containerPad, active, findTarget, findClearance]);

  return { containerRef, contentRef, position, containerPad, measure, reset };
}
