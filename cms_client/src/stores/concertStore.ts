import { create } from 'zustand';
import { listConcerts } from '../api/concerts';
import type { Concert, ConcertStatus, Paginated } from '../types';

interface ConcertFilter {
  status?: ConcertStatus;
  search?: string;
  page: number;
  limit: number;

  [key: string]: unknown;
}

interface ConcertState {
  loading: boolean;
  data: Paginated<Concert> | null;
  filter: ConcertFilter;
  setFilter: (patch: Partial<ConcertFilter>) => void;
  fetch: () => Promise<void>;
}

export const useConcertStore = create<ConcertState>((set, get) => ({
  loading: false,
  data: null,
  filter: { page: 1, limit: 10 },
  setFilter(patch) {
    set(({ filter }) => ({ filter: { ...filter, ...patch } }));
  },
  async fetch() {
    set({ loading: true });
    const { filter } = get();
    const data = await listConcerts(filter);
    set({ data, loading: false });
  },
}));
