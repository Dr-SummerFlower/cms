import { getJson } from "../utils/http";

export interface HealthStatus {
  status: "ok";
  uptime: number;
}

export async function getHealth(): Promise<HealthStatus> {
  return getJson<HealthStatus>("/health");
}
