import { useCallback, useEffect, useRef, useState } from 'react';

// The card sits just below whatever is highlighted, with a little room
// underneath so it is never flush against the bottom of the phone.
const GAP_BELOW_TARGET = 12;
const BREATHING_ROOM = 48;
const MIN_TOP_MARGIN = 80;
const ASSUMED_CARD_HEIGHT = 260;

// Every screen marks its highlighted element with one of these.
const TARGET = '.active, .safe-active, .upi-active';

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
export function useFlagCardPosition({ active }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const cardHeightRef = useRef(ASSUMED_CARD_HEIGHT);

  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [containerPad, setContainerPad] = useState(0);

  const findTarget = useCallback(
    () => containerRef.current?.querySelector(TARGET) ?? null,
    [],
  );

  const place = useCallback(() => {
    const target = findTarget();
    if (!containerRef.current || !target) return;

    const container = containerRef.current.getBoundingClientRect();
    const rect = target.getBoundingClientRect();

    const top = rect.bottom - container.top + GAP_BELOW_TARGET;
    const left = rect.left - container.left + rect.width / 2;
    setPosition({ top, left });

    // Grow the container only by however much the card overhangs the
    // phone's natural height.
    const phoneHeight = contentRef.current?.scrollHeight ?? 0;
    const overflow =
      top + cardHeightRef.current + BREATHING_ROOM - phoneHeight;
    if (overflow > 0) setContainerPad((prev) => Math.max(prev, overflow));
  }, [findTarget]);

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
    setPosition({ top: 0, left: 0 });
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
      if (!containerRef.current || !target) return;

      const container = containerRef.current.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      const cardTop = rect.bottom - container.top + GAP_BELOW_TARGET;

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
