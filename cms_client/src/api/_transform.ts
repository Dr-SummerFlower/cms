import type {
  Concert,
  ConcertRaw,
  Feedback,
  FeedbackRaw,
  Paginated,
  TicketItem,
  TicketItemRaw,
  User,
  UserRaw,
} from "../types";
import {getImageUrl} from "../utils/image";

export function toUser(u: UserRaw | User): User {
  if ("id" in u) return u;
  const id = u._id ?? (u as unknown as { userId?: string }).userId ?? "";
  return {
    id,
    username: u.username,
    email: u.email,
    role: u.role,
    avatar: getImageUrl(u.avatar) ?? undefined,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export function toConcert(c: ConcertRaw): Concert {
  return {
    id: c._id,
    name: c.name,
    poster: getImageUrl(c.poster) ?? undefined,
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
  const concertId = t.concert?._id ?? t.concertId ?? "";
  const concert = t.concert
    ? {
      id: t.concert._id,
      name: t.concert.name,
      date: t.concert.date ?? "",
      venue: t.concert.venue ?? "",
    }
    : undefined;

  const userId =
    typeof t.user === "string"
      ? t.user
      : (t.user && (t.user as { _id?: string })._id) || t.userId || "";

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

export function toFeedback(f: FeedbackRaw): Feedback {
  return {
    id: f._id,
    timestamp: f.timestamp,
    userAgent: f.userAgent,
    url: f.url,
    errorType: f.errorType,
    message: f.message,
    stack: f.stack,
    routeStatus: f.routeStatus,
    routeStatusText: f.routeStatusText,
    routeData: f.routeData,
    status: f.status,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  };
}

export function toPaginated<TModel, TRaw>(
  raw: {
    [k: string]: unknown;
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  },
  key: string,
  mapItem: (r: TRaw) => TModel,
): Paginated<TModel> {
  const arr = (raw[key] as ReadonlyArray<TRaw>) ?? [];
  return {
    items: arr.map(mapItem),
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
    totalPages: raw.totalPages,
  };
}
