import { POLICIES_API_TIMEOUT_MS } from "./config";
import { getFallbackPolicies } from "./fallbackPolicies";
import type { Policy, UserInfo } from "./types";

export interface PolicyFetchResult {
  policies: Policy[];
  source: "api" | "fallback";
}

/**
 * 실제 데이터 수집(공공데이터포털 전체 페이지네이션, 약 9MB)은 서버(app/api/policies)에서만
 * 수행하고, 클라이언트는 이미 필터링·정렬까지 끝난 훨씬 작은 결과만 받는다. 모바일처럼 느린
 * 네트워크에서도 사용자가 직접 수 MB를 내려받지 않게 하기 위함.
 */
export async function getPolicies(user: UserInfo): Promise<PolicyFetchResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), POLICIES_API_TIMEOUT_MS);

  try {
    const res = await fetch("/api/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`/api/policies 응답 오류: ${res.status}`);
    }

    return (await res.json()) as PolicyFetchResult;
  } catch (err) {
    console.warn("[policyService] /api/policies 호출 실패, fallback 데이터로 대체합니다.", err);
    return { policies: getFallbackPolicies(user), source: "fallback" };
  } finally {
    clearTimeout(timeoutId);
  }
}
