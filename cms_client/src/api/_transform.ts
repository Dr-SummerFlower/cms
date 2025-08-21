import type { Concert, ConcertRaw, Paginated, TicketItem, TicketItemRaw, User, UserRaw } from '../types';

export function toUser(u: UserRaw | User): User {
  if ('id' in u) return u as User;
  const id = (u as UserRaw)._id ?? (u as unknown as { userId?: string }).userId ?? '';
  return {
    id,
    username: (u as UserRaw).username,
    email: (u as UserRaw).email,
    role: (u as UserRaw).role,
    avatar: (u as UserRaw).avatar,
    createdAt: (u as UserRaw).createdAt,
    updatedAt: (u as UserRaw).updatedAt,
  };
}

export function toConcert(c: ConcertRaw): Concert {
  return {
    id: c._id,
    name: c.name,
    poster: c.poster,
    date: c.date,
    venue: c.venue,
    adultPrice: c.adultPrice,
    childPrice: c.childPrice,
    totalTickets: c.totalTickets,
    soldTickets: c.soldTickets,
    status: c.status,
    maxAdultTicketsPerUser: c.maxAdultTicketsPerUser,
    maxChildTicketsPerUser: c.maxChildTicketsPerUser,
    description: c.description,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export function toTicket(t: TicketItemRaw): TicketItem {
  const concertId = t.concert?._id ?? t.concertId ?? '';
  const concert = t.concert
    ? { id: t.concert._id, name: t.concert.name, date: t.concert.date, venue: t.concert.venue }
    : undefined;

  const userId =
    typeof t.user === 'string'
      ? t.user
      : (t.user && (t.user as { _id?: string })._id) || t.userId || '';

  return {
    id: t._id,
    concertId,
    concert,
    userId,
    type: t.type,
    price: t.price,
    status: t.status,
    signature: t.signature,
    qrCodeData: t.qrCodeData,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export function toPaginated<TModel, TRaw>(
  raw: { [k: string]: unknown; total: number; page: number; limit: number; totalPages?: number },
  key: string,
  mapItem: (r: TRaw) => TModel,
): Paginated<TModel> {
  const arr = (raw[key] as unknown as ReadonlyArray<TRaw>) ?? [];
  return {
    items: arr.map(mapItem),
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
    totalPages: raw.totalPages,
  };
}
