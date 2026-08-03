export type HistoryEntry<T> = {
  id: string;
  label: string;
  before: T;
  after: T;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type HistoryState<T> = {
  past: HistoryEntry<T>[];
  present: T;
  future: HistoryEntry<T>[];
  savedPresent: T;
  limit: number;
};

export type HistoryTransaction<T> = {
  label: string;
  before: T;
  after: T;
  metadata?: Record<string, unknown>;
};

export function createHistoryState<T>(initial: T, limit = 50): HistoryState<T> {
  return {
    past: [],
    present: cloneValue(initial),
    future: [],
    savedPresent: cloneValue(initial),
    limit: Math.max(1, limit),
  };
}

export function commitHistory<T>(
  state: HistoryState<T>,
  transaction: HistoryTransaction<T>,
  equals: (a: T, b: T) => boolean = defaultEquals,
): HistoryState<T> {
  if (equals(transaction.before, transaction.after)) return state;

  const entry: HistoryEntry<T> = {
    id: createHistoryId(),
    label: transaction.label,
    before: cloneValue(transaction.before),
    after: cloneValue(transaction.after),
    createdAt: new Date().toISOString(),
    metadata: transaction.metadata,
  };

  return {
    ...state,
    past: [...state.past, entry].slice(-state.limit),
    present: cloneValue(transaction.after),
    future: [],
  };
}

export function replacePresent<T>(state: HistoryState<T>, present: T): HistoryState<T> {
  return {
    ...state,
    present: cloneValue(present),
  };
}

export function undoHistory<T>(state: HistoryState<T>): HistoryState<T> {
  const entry = state.past.at(-1);
  if (!entry) return state;

  return {
    ...state,
    past: state.past.slice(0, -1),
    present: cloneValue(entry.before),
    future: [entry, ...state.future].slice(0, state.limit),
  };
}

export function redoHistory<T>(state: HistoryState<T>): HistoryState<T> {
  const entry = state.future[0];
  if (!entry) return state;

  return {
    ...state,
    past: [...state.past, entry].slice(-state.limit),
    present: cloneValue(entry.after),
    future: state.future.slice(1),
  };
}

export function markHistorySaved<T>(state: HistoryState<T>): HistoryState<T> {
  return {
    ...state,
    savedPresent: cloneValue(state.present),
  };
}

export function resetHistory<T>(state: HistoryState<T>, present: T): HistoryState<T> {
  return {
    past: [],
    present: cloneValue(present),
    future: [],
    savedPresent: cloneValue(present),
    limit: state.limit,
  };
}

export function clearHistory<T>(state: HistoryState<T>): HistoryState<T> {
  return {
    ...state,
    past: [],
    future: [],
  };
}

export function canUndo<T>(state: HistoryState<T>) {
  return state.past.length > 0;
}

export function canRedo<T>(state: HistoryState<T>) {
  return state.future.length > 0;
}

export function isHistoryDirty<T>(
  state: HistoryState<T>,
  equals: (a: T, b: T) => boolean = defaultEquals,
) {
  return !equals(state.present, state.savedPresent);
}

export function getUndoLabel<T>(state: HistoryState<T>) {
  return state.past.at(-1)?.label ?? null;
}

export function getRedoLabel<T>(state: HistoryState<T>) {
  return state.future[0]?.label ?? null;
}

export function squashTransactions<T>(
  label: string,
  transactions: HistoryTransaction<T>[],
  metadata?: Record<string, unknown>,
): HistoryTransaction<T> | null {
  if (!transactions.length) return null;

  return {
    label,
    before: cloneValue(transactions[0].before),
    after: cloneValue(transactions.at(-1)!.after),
    metadata: {
      ...metadata,
      transactionCount: transactions.length,
      labels: transactions.map((transaction) => transaction.label),
    },
  };
}

export function mapHistoryPresent<T>(
  state: HistoryState<T>,
  label: string,
  updater: (present: T) => T,
  metadata?: Record<string, unknown>,
  equals: (a: T, b: T) => boolean = defaultEquals,
): HistoryState<T> {
  const before = cloneValue(state.present);
  const after = updater(cloneValue(state.present));

  return commitHistory(
    state,
    {
      label,
      before,
      after,
      metadata,
    },
    equals,
  );
}

function createHistoryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `history-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function defaultEquals<T>(a: T, b: T) {
  return JSON.stringify(a) === JSON.stringify(b);
}
