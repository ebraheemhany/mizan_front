// lib/motion/useSlidingIndicator.ts
// One marker (a tab's underline, a segment's pill, the sidebar's active item)
// that slides from the old choice to the new one, so the eye follows the change.
//
// The container must be `relative`; the marker is `absolute left-0 top-0` inside it.
// The chosen item is found by aria-selected="true" or aria-current="page".
// While the marker isn't placed yet the container has no data-indicator, so the
// items keep their own selected look (nothing flashes before it measures).
'use client';

import { useLayoutEffect, useRef } from 'react';

type Mode =
  /** Width + position along the row (an underline). */
  | 'underline'
  /** The whole box of the chosen item (a pill or a highlighted row). */
  | 'box';

export function useSlidingIndicator<C extends HTMLElement = HTMLDivElement>(
  /** Changes when the choice changes (the selected value, the pathname...). */
  selection: unknown,
  mode: Mode = 'box',
) {
  const containerRef = useRef<C>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;

    const place = (animate: boolean) => {
      const chosen = container.querySelector<HTMLElement>(
        '[aria-selected="true"], [aria-current="page"]',
      );
      if (!chosen) {
        indicator.style.opacity = '0';
        delete container.dataset.indicator;
        return;
      }
      // The first placement (and resizes) jump; a new choice slides.
      indicator.style.transition = animate ? '' : 'none';
      indicator.style.width = `${chosen.offsetWidth}px`;
      if (mode === 'box') indicator.style.height = `${chosen.offsetHeight}px`;
      indicator.style.transform =
        mode === 'box'
          ? `translate(${chosen.offsetLeft}px, ${chosen.offsetTop}px)`
          : `translateX(${chosen.offsetLeft}px)`;
      indicator.style.opacity = '1';
      container.dataset.indicator = 'on';
    };

    place(placed.current);
    placed.current = true;

    // Fonts loading, counts changing width, the window resizing: follow without sliding.
    // The observer's first call only reports the sizes it started with: skipping it keeps
    // the slide that just started (switching transitions off mid-way would cut it short).
    let initial = true;
    const resize = new ResizeObserver(() => {
      if (initial) {
        initial = false;
        return;
      }
      place(false);
    });
    resize.observe(container);
    container
      .querySelectorAll('[role="tab"], a')
      .forEach((item) => resize.observe(item));
    return () => resize.disconnect();
  }, [selection, mode]);

  return { containerRef, indicatorRef };
}
