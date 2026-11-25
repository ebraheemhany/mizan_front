// component/dialog-chrome.ts
// Mizan's dialog layout, shared by the app's dialogs: a tinted header bar with an icon
// tile, the title and a close button; a padded body (px-6 py-5); and a footer bar flush
// with the popup's edges. Pass these to DialogContent / DialogFooter and the header parts.

export const thinScrollbar =
  '[scrollbar-color:var(--color-line-strong)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-line-strong [&::-webkit-scrollbar-thumb:hover]:bg-brand';

/** The popup; it scrolls as a whole on screens too short for it. Add the width (e.g. sm:max-w-lg). */
export const dialogPopup = `rounded-card border-line bg-surface text-ink shadow-float max-h-[90dvh] gap-0 overflow-x-hidden overflow-y-auto border p-0 ${thinScrollbar}`;

/**
 * For tall dialogs: the header and footer stay put and only the body scrolls. Give the
 * body dialogScrollBody (and a wrapping form `flex min-h-0 flex-1 flex-col`).
 */
export const dialogPopupPinned =
  'rounded-card border-line bg-surface text-ink shadow-float flex max-h-[90dvh] flex-col gap-0 overflow-hidden border p-0';
export const dialogScrollBody = `min-h-0 flex-1 overflow-x-hidden overflow-y-auto ${thinScrollbar}`;

export type DialogTone = 'brand' | 'danger';

export const dialogHeaderBar = (tone: DialogTone = 'brand') =>
  `border-line relative flex shrink-0 items-center gap-3.5 border-b px-6 py-5 ${tone === 'danger' ? 'bg-danger-soft/60' : 'bg-brand-soft/60'}`;

export const dialogIconTile = (tone: DialogTone = 'brand') =>
  `bg-surface flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ${tone === 'danger' ? 'text-danger ring-danger/10' : 'text-brand ring-brand/10'}`;

/** DialogHeader next to the tile: leaves room for the close button. */
export const dialogHeading = 'min-w-0 gap-0.5 pe-8 text-start';
export const dialogTitle = 'text-ink text-lg font-extrabold';
export const dialogDescription = 'text-muted text-xs leading-5';

export const dialogClose =
  'text-muted hover:bg-surface hover:text-ink focus-visible:ring-brand/30 absolute end-4 top-4 rounded-lg p-1.5 transition-colors outline-none focus-visible:ring-2';

export const dialogFooterBar = 'border-line bg-canvas shrink-0 gap-2 border-t px-6 py-4 sm:gap-2';

// Side sheets use the same parts: SheetContent sheetPopup (+ sm:max-w-*), SheetHeader
// sheetHeaderBar, then a form `flex min-h-0 flex-1 flex-col` holding the fields in
// dialogScrollBody and the buttons in sheetFooterBar.
export const sheetPopup = 'border-line bg-surface text-ink shadow-float w-full gap-0 border p-0';
export const sheetHeaderBar = (tone: DialogTone = 'brand') => `${dialogHeaderBar(tone)} flex-row text-start`;
export const sheetFooterBar =
  'border-line bg-canvas flex shrink-0 flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end';
export const dialogCancelButton = 'rounded-btn border-line-strong bg-surface text-ink h-11 px-6 font-bold';
/** Add the colour: bg-brand hover:bg-brand/90, or bg-danger hover:bg-danger/90. */
export const dialogConfirmButton = 'rounded-btn h-11 gap-2 px-8 font-bold text-white';
