export type Id = string;

export interface Person {
  id: Id;
  name: string;
  contact?: string;
  createdAt: number;
}

export interface Item {
  id: Id;
  name: string;
  category?: string;
  notes?: string;
  estValue?: number;
  /** undefined = you own it. Set when the item belongs to someone else (a "borrowed_in" loan). */
  ownerId?: Id;
  createdAt: number;
}

export type LoanDirection = 'lent_out' | 'borrowed_in';
export type LoanStatus = 'active' | 'returned';

export interface LoanRecord {
  id: Id;
  itemId: Id;
  /** The other party in the loan (not you). */
  personId: Id;
  direction: LoanDirection;
  dateOut: number;
  expectedReturn?: number;
  actualReturn?: number;
  status: LoanStatus;
  notes?: string;
}
