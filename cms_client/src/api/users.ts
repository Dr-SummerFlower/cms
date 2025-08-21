import type { Paginated, Role, UpdateUserDto, User, UserRaw } from '../types';
import { delJson, getJson, patchForm, patchJson } from '../utils/http';
import { toPaginated, toUser } from './_transform.ts';

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;

  [key: string]: unknown;
}

export async function listUsers(q?: UserQuery): Promise<Paginated<User>> {
  const raw = await getJson<{
    users: ReadonlyArray<UserRaw>;
    total: number;
    page: number;
    limit: number;
    totalPages?: number
  }>('/users', q);
  return toPaginated<User, UserRaw>(raw, 'users', toUser);
}

export async function getUser(id: string): Promise<User> {
  const raw = await getJson<UserRaw>(`/users/${id}`);
  return toUser(raw);
}

export async function updateUser(id: string, dto: UpdateUserDto): Promise<User> {
  const raw = await patchJson<UserRaw, UpdateUserDto>(`/users/${id}`, dto);
  return toUser(raw);
}

export async function uploadAvatar(id: string, avatar: File): Promise<User> {
  const form = new FormData();
  form.set('avatar', avatar);
  const raw = await patchForm<UserRaw>(`/users/${id}/avatar`, form);
  return toUser(raw);
}

export async function deleteUser(id: string): Promise<void> {
  await delJson<unknown>(`/users/${id}`);
}

export async function updateUserRole(id: string, role: Role): Promise<User> {
  const raw = await patchJson<UserRaw, { role: Role }>(`/users/${id}/role`, { role });
  return toUser(raw);
}
