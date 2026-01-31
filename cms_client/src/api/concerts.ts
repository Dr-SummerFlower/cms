import type {Concert, ConcertRaw, ConcertStatus, CreateConcertDto, Paginated, UpdateConcertDto,} from "../types";
import {delJson, getJson, patchForm, patchJson, postForm,} from "../utils/http";
import {toConcert, toPaginated} from "./_transform.ts";

export interface ConcertQuery {
  page?: number;
  limit?: number;
  status?: ConcertStatus;
  search?: string;

  [key: string]: unknown;
}

export async function listConcerts(
  q?: ConcertQuery,
): Promise<Paginated<Concert>> {
  const raw = await getJson<{
    concerts: ReadonlyArray<ConcertRaw>;
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  }>("/concerts", q);
  return toPaginated<Concert, ConcertRaw>(raw, "concerts", toConcert);
}

export async function getConcert(id: string): Promise<Concert> {
  const raw = await getJson<ConcertRaw>(`/concerts/${id}`);
  return toConcert(raw);
}

export async function createConcert(
  dto: CreateConcertDto,
  poster: File | undefined,
): Promise<Concert> {
  const form = new FormData();
  Object.entries(dto).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.set(k, String(v));
  });
  if (poster) form.set("poster", poster);
  const raw = await postForm<ConcertRaw>("/concerts", form);
  return toConcert(raw);
}

export async function updateConcert(
  id: string,
  dto: UpdateConcertDto,
): Promise<Concert> {
  const raw = await patchJson<ConcertRaw, UpdateConcertDto>(
    `/concerts/${id}`,
    dto,
  );
  return toConcert(raw);
}

export async function updateConcertPoster(
  id: string,
  poster: File,
): Promise<Concert> {
  const form = new FormData();
  form.set("poster", poster);
  const raw = await patchForm<ConcertRaw>(`/concerts/${id}`, form);
  return toConcert(raw);
}

export async function deleteConcert(id: string): Promise<void> {
  await delJson<unknown>(`/concerts/${id}`);
}
