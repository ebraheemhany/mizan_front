'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { QUOTES, type Quote } from '@/lib/mock/quotes';

const STORAGE_KEY = 'mezan.quotes';
const QUOTE_STATUSES = [
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
];

const QuotesContext = createContext<
  | {
      quotes: Quote[];
      setQuotes: Dispatch<SetStateAction<Quote[]>>;
      hydrated: boolean;
    }
  | undefined
>(undefined);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isQuoteList(value: unknown): value is Quote[] {
  return (
    Array.isArray(value) &&
    value.every(
      (quote) =>
        isRecord(quote) &&
        typeof quote.id === 'string' &&
        typeof quote.number === 'number' &&
        typeof quote.customer === 'string' &&
        typeof quote.issueDate === 'string' &&
        typeof quote.validUntil === 'string' &&
        typeof quote.total === 'number' &&
        typeof quote.status === 'string' &&
        QUOTE_STATUSES.some((status) => status === quote.status) &&
        (quote.sentDate === undefined || typeof quote.sentDate === 'string') &&
        (quote.acceptedDate === undefined ||
          typeof quote.acceptedDate === 'string') &&
        (quote.rejectedDate === undefined ||
          typeof quote.rejectedDate === 'string') &&
        (quote.shareToken === undefined ||
          typeof quote.shareToken === 'string') &&
        (quote.notes === undefined || typeof quote.notes === 'string') &&
        (quote.items === undefined ||
          (Array.isArray(quote.items) &&
            quote.items.every(
              (item) =>
                isRecord(item) &&
                typeof item.description === 'string' &&
                typeof item.quantity === 'number' &&
                typeof item.unitPrice === 'number',
            ))),
    )
  );
}

function parseStoredQuotes(value: string): Quote[] | undefined {
  try {
    const parsed: unknown = JSON.parse(value);
    if (isQuoteList(parsed)) return parsed;
    console.error('Saved quote data has an invalid format.');
  } catch (error) {
    console.error('Could not parse saved quotes from local storage.', error);
  }
  return undefined;
}

export function QuotesProvider({ children }: { children: ReactNode }) {
  const [quotes, setQuotes] = useState<Quote[]>(QUOTES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseStoredQuotes(stored);
        if (parsed) setQuotes(parsed);
      }
    } catch (error) {
      console.error('Could not load saved quotes from local storage.', error);
    }
    setHydrated(true);

    function syncAcrossTabs(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      if (event.newValue === null) {
        setQuotes(QUOTES);
        return;
      }
      const parsed = parseStoredQuotes(event.newValue);
      if (parsed) {
        setQuotes((currentQuotes) =>
          JSON.stringify(currentQuotes) === event.newValue
            ? currentQuotes
            : parsed,
        );
      }
    }

    window.addEventListener('storage', syncAcrossTabs);
    return () => window.removeEventListener('storage', syncAcrossTabs);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
    } catch (error) {
      console.error('Could not save quotes to local storage.', error);
    }
  }, [hydrated, quotes]);

  return (
    <QuotesContext.Provider value={{ quotes, setQuotes, hydrated }}>
      {children}
    </QuotesContext.Provider>
  );
}

export function useQuotes() {
  const context = useContext(QuotesContext);
  if (!context) {
    throw new Error('useQuotes must be used within a QuotesProvider');
  }
  return context;
}
