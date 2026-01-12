import type {
  CreateFeedbackDto,
  Feedback,
  FeedbackListResponse,
  FeedbackQueryDto,
  FeedbackRaw,
  FeedbackStatus,
  UpdateFeedbackStatusDto,
} from "../types";
import { delJson, getJson, patchJson, postJson } from "../utils/http";
import { toFeedback } from "./_transform"; // 提交错误反馈（无需认证）

// 提交错误反馈（无需认证）
export async function createFeedback(
  dto: CreateFeedbackDto,
): Promise<{ ok: boolean; data: Feedback }> {
  const result = await postJson<
    { ok: boolean; data: FeedbackRaw },
    CreateFeedbackDto
  >("/feedback", dto);
  return {
    ok: result.ok,
    data: toFeedback(result.data),
  };
}

// 获取错误反馈列表（需要管理员权限）
export async function getFeedbackList(
  query: FeedbackQueryDto = {},
): Promise<FeedbackListResponse> {
  const params: Record<string, unknown> = {};

  if (query.page !== undefined) params.page = query.page;
  if (query.limit !== undefined) params.limit = query.limit;
  if (query.status) params.status = query.status;
  if (query.errorType) params.errorType = query.errorType;
  if (query.search) params.search = query.search;

  const result = await getJson<{
    data: FeedbackRaw[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>("/feedback", params);
  return {
    data: result.data.map(toFeedback),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

// 获取单个错误反馈详情（需要管理员权限）
export async function getFeedbackById(id: string): Promise<Feedback> {
  const result = await getJson<FeedbackRaw>(`/feedback/${id}`);
  return toFeedback(result);
}

// 更新错误反馈状态（需要管理员权限）
export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
): Promise<Feedback> {
  const result = await patchJson<FeedbackRaw, UpdateFeedbackStatusDto>(
    `/feedback/${id}/status`,
    { status },
  );
  return toFeedback(result);
}

// 删除错误反馈（需要管理员权限）
export async function deleteFeedback(id: string): Promise<{ ok: boolean }> {
  return await delJson<{ ok: boolean }>(`/feedback/${id}`);
}
