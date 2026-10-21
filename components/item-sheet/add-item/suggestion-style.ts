import { useSyncExternalStore } from 'react';

// Temporary, session-only comparison. Remove once a treatment is chosen.
export const SUGGESTION_STYLES = [
  {
    value: 'white',
    label: 'Sheet match',
    layout: 'grid',
    className: 'bg-background',
    textClassName: 'text-foreground',
  },
  {
    value: 'list',
    label: 'White list',
    layout: 'list',
    className: 'rounded-none bg-transparent',
    textClassName: 'text-neutral-900 dark:text-neutral-100',
  },
  {
    value: 'pills',
    label: 'Outlined pills',
    layout: 'chips',
    className:
      'rounded-full border-neutral-300 bg-white dark:border-neutral-500 dark:bg-neutral-800',
    textClassName: 'text-neutral-900 dark:text-neutral-100',
  },
  {
    value: 'ink',
    label: 'Ink',
    layout: 'grid',
    className: 'bg-neutral-900 dark:bg-neutral-100',
    textClassName: 'text-white dark:text-neutral-900',
  },
] as const;

type SuggestionStyle = (typeof SUGGESTION_STYLES)[number]['value'];

export const getSuggestionTreatment = (style: SuggestionStyle) =>
  SUGGESTION_STYLES.find(option => option.value === style) ??
  SUGGESTION_STYLES[0];

let currentStyle: SuggestionStyle = 'white';
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => currentStyle;

export const setSuggestionStyle = (style: SuggestionStyle) => {
  if (style === currentStyle) return;
  currentStyle = style;
  listeners.forEach(listener => listener());
};

export const useSuggestionStyle = () =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
