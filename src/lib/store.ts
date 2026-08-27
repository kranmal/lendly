import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { generateId } from './id';

import type { Item, LoanRecord, Person } from '@/types/models';

const KEYS = {
  items: 'lendly:items',
  people: 'lendly:people',
  loans: 'lendly:loans',
};

interface State {
  items: Item[];
  people: Person[];
  loans: LoanRecord[];
  loaded: boolean;
}

let state: State = { items: [], people: [], loans: [], loaded: false };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function setState(partial: Partial<State>) {
  state = { ...state, ...partial };
  notify();
  void persist();
}

async function persist() {
  await Promise.all([
    AsyncStorage.setItem(KEYS.items, JSON.stringify(state.items)),
    AsyncStorage.setItem(KEYS.people, JSON.stringify(state.people)),
    AsyncStorage.setItem(KEYS.loans, JSON.stringify(state.loans)),
  ]);
}

async function load() {
  const [items, people, loans] = await Promise.all([
    AsyncStorage.getItem(KEYS.items),
    AsyncStorage.getItem(KEYS.people),
    AsyncStorage.getItem(KEYS.loans),
  ]);
  state = {
    items: items ? JSON.parse(items) : [],
    people: people ? JSON.parse(people) : [],
    loans: loans ? JSON.parse(loans) : [],
    loaded: true,
  };
  notify();
}

void load();

/** Subscribes the calling component to store changes and returns the current state. */
export function useStore(): State {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return state;
}

// ---- Mutations ----

export function addPerson(input: { name: string; contact?: string }): Person {
  const person: Person = { id: generateId(), name: input.name.trim(), contact: input.contact?.trim() || undefined, createdAt: Date.now() };
  setState({ people: [...state.people, person] });
  return person;
}

/** Finds a person by case-insensitive exact name match, or creates one. */
export function findOrCreatePerson(name: string, contact?: string): Person {
  const trimmed = name.trim();
  const existing = state.people.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing;
  return addPerson({ name: trimmed, contact });
}

export function addItem(input: { name: string; category?: string; notes?: string; estValue?: number; ownerId?: string }): Item {
  const item: Item = {
    id: generateId(),
    name: input.name.trim(),
    category: input.category?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    estValue: input.estValue,
    ownerId: input.ownerId,
    createdAt: Date.now(),
  };
  setState({ items: [...state.items, item] });
  return item;
}

export function lendItem(input: { itemId: string; personId: string; expectedReturn?: number; notes?: string }): LoanRecord {
  const loan: LoanRecord = {
    id: generateId(),
    itemId: input.itemId,
    personId: input.personId,
    direction: 'lent_out',
    dateOut: Date.now(),
    expectedReturn: input.expectedReturn,
    status: 'active',
    notes: input.notes?.trim() || undefined,
  };
  setState({ loans: [...state.loans, loan] });
  return loan;
}

/** Logs something you've borrowed: creates the item (owned by the lender) and an active loan in one step. */
export function borrowItem(input: {
  name: string;
  category?: string;
  personId: string;
  expectedReturn?: number;
  notes?: string;
}): { item: Item; loan: LoanRecord } {
  const item = addItem({ name: input.name, category: input.category, ownerId: input.personId });
  const loan: LoanRecord = {
    id: generateId(),
    itemId: item.id,
    personId: input.personId,
    direction: 'borrowed_in',
    dateOut: Date.now(),
    expectedReturn: input.expectedReturn,
    status: 'active',
    notes: input.notes?.trim() || undefined,
  };
  setState({ loans: [...state.loans, loan] });
  return { item, loan };
}

export function markReturned(loanId: string) {
  setState({
    loans: state.loans.map((l) => (l.id === loanId ? { ...l, status: 'returned', actualReturn: Date.now() } : l)),
  });
}

// ---- Selectors ----

export interface EnrichedLoan extends LoanRecord {
  item: Item;
  person: Person;
}

function enrich(loan: LoanRecord, s: State): EnrichedLoan | null {
  const item = s.items.find((i) => i.id === loan.itemId);
  const person = s.people.find((p) => p.id === loan.personId);
  if (!item || !person) return null;
  return { ...loan, item, person };
}

export function getActiveLoans(s: State): EnrichedLoan[] {
  return s.loans
    .filter((l) => l.status === 'active')
    .map((l) => enrich(l, s))
    .filter((l): l is EnrichedLoan => l !== null)
    .sort((a, b) => {
      if (a.expectedReturn && b.expectedReturn) return a.expectedReturn - b.expectedReturn;
      if (a.expectedReturn) return -1;
      if (b.expectedReturn) return 1;
      return b.dateOut - a.dateOut;
    });
}

export function getLoanForItem(s: State, itemId: string): EnrichedLoan | undefined {
  return getActiveLoans(s).find((l) => l.itemId === itemId);
}

export function getLoansForPerson(s: State, personId: string): EnrichedLoan[] {
  return s.loans
    .filter((l) => l.personId === personId)
    .map((l) => enrich(l, s))
    .filter((l): l is EnrichedLoan => l !== null)
    .sort((a, b) => b.dateOut - a.dateOut);
}

export function isOverdue(loan: LoanRecord, now: number): boolean {
  return loan.status === 'active' && !!loan.expectedReturn && loan.expectedReturn < now;
}
