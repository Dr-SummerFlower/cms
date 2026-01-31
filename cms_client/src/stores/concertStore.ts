import {create} from 'zustand';
import {listConcerts} from '../api/concerts';
import type {Concert, ConcertStatus, Paginated} from '../types';

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
  filter: {page: 1, limit: 10},
  setFilter(patch) {
    set(({filter}) => ({filter: {...filter, ...patch}}));
  },
  async fetch() {
    set({loading: true});
    try {
      const {filter} = get();
      const data = await listConcerts(filter);
      set({data, loading: false});
    } catch (error) {
      // 发生错误时确保 loading 状态被重置
      set({loading: false});
      // 错误已由全局错误处理函数处理,这里重新抛出以便调用方可选地进一步处理
      throw error;
    }
  },
}));
