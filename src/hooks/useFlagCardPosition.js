import { useCallback, useEffect, useRef, useState } from 'react';

// The card sits just below whatever is highlighted, with a little room
// underneath so it is never flush against the bottom of the phone.
const GAP_BELOW_TARGET = 12;
const BREATHING_ROOM = 48;
const MIN_TOP_MARGIN = 80;
const ASSUMED_CARD_HEIGHT = 260;
const ASSUMED_CARD_WIDTH = 280;
// How close the card may come to the edge of the quiz area.
const EDGE_MARGIN = 8;
// The arrow stops short of the card's rounded corners.
const ARROW_INSET = 18;

const clampArrow = (offset, half) => {
  const limit = Math.max(half - ARROW_INSET, 0);
  return Math.min(Math.max(offset, -limit), limit);
};

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
  const cardWidthRef = useRef(ASSUMED_CARD_WIDTH);

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    gap: 0,
    arrowOffset: 0,
  });
  const [containerPad, setContainerPad] = useState(0);

  const findTarget = useCallback(() => {
    const selector = anchorFor(activeFlagId);
    if (!selector) return null;
    // Only ever look inside the message being shown. The card is a
    // sibling of it in this container and must never be its own target.
    return contentRef.current?.querySelector(selector) ?? null;
  }, [activeFlagId]);

  const place = useCallback(() => {
    const target = findTarget();
    if (!containerRef.current || !target) return;

    const container = containerRef.current.getBoundingClientRect();
    const rect = target.getBoundingClientRect();

    // Directly under the phrase, the way the Jigsaw quiz does it. The
    // card covers whatever is beneath, and that is fine: people read the
    // message before they answer, so the reveal is about one phrase at a
    // time, not about keeping the whole message legible.
    const top = rect.bottom - container.top + GAP_BELOW_TARGET;
    const anchorCentre = rect.left - container.left + rect.width / 2;

    // Keep the card on screen. Rather than let a phrase near the edge
    // drag the card half out of view, the card stops at the edge and the
    // arrow slides along its top to stay under the phrase.
    const half = cardWidthRef.current / 2;
    const left = Math.min(
      Math.max(anchorCentre, half + EDGE_MARGIN),
      Math.max(container.width - half - EDGE_MARGIN, half + EDGE_MARGIN),
    );
    const arrowOffset = clampArrow(anchorCentre - left, half);

    // Only if something ever pushes the card well away from its phrase
    // does it need to draw a line back. Sitting directly underneath, it
    // does not.
    const gap = top - (rect.bottom - container.top);
    setPosition({ top, left, gap, arrowOffset });

    // Grow the container only by however much the card overhangs the
    // phone's natural height.
    const phoneHeight = contentRef.current?.scrollHeight ?? 0;
    const overflow =
      top + cardHeightRef.current + BREATHING_ROOM - phoneHeight;
    if (overflow > 0) setContainerPad((prev) => Math.max(prev, overflow));
  }, [findTarget]);

  /** The card reports its real size once rendered. */
  const measure = useCallback(
    ({ height, width }) => {
      cardHeightRef.current = height;
      if (width) cardWidthRef.current = width;
      place();
    },
    [place],
  );

  /** Back to a clean slate for the next question. */
  const reset = useCallback(() => {
    setPosition({ top: 0, left: 0, gap: 0, arrowOffset: 0 });
    setContainerPad(0);
    cardHeightRef.current = ASSUMED_CARD_HEIGHT;
    cardWidthRef.current = ASSUMED_CARD_WIDTH;
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
      if (!containerRef.current || !target) return;

      const container = containerRef.current.getBoundingClientRect();
      const cardTop =
        target.getBoundingClientRect().bottom - container.top + GAP_BELOW_TARGET;

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
  }, [containerPad, active, findTarget]);

  return { containerRef, contentRef, position, containerPad, measure, reset };
}
