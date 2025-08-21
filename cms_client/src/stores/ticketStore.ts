import { create } from 'zustand';
import { myTickets } from '../api/tickets';
import type { TicketItem } from '../types';

interface TicketState {
  loading: boolean;
  items: ReadonlyArray<TicketItem>;
  fetch: (params?: { status?: 'valid' | 'used' | 'refunded'; concertId?: string }) => Promise<void>;
  reset: () => void;
}

export const useTicketStore = create<TicketState>((set) => ({
  loading: false,
  items: [],
  async fetch(params) {
    set({ loading: true });
    try {
      const items = await myTickets(params);
      set({ items, loading: false });
    } catch {
      set({ items: [], loading: false });
    }
  },
  reset() {
    set({ items: [], loading: false });
  },
}));
