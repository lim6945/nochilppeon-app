import {
  SUBSIDY24_BASE_URL,
  SUBSIDY24_LIST_ENDPOINT,
  SUBSIDY24_PER_PAGE,
  SUBSIDY24_SERVICE_KEY,
  SUBSIDY24_TIMEOUT_MS,
} from "./config";
import { classifyPolicy } from "./categoryMapping";
import { matchApiPolicy } from "./apiPolicyFilter";
import { describeApplicationPeriod } from "./deadlineUtils";
import { getFallbackPolicies } from "./fallbackPolicies";
import type { Policy, UserInfo } from "./types";

interface Subsidy24Item {
  서비스ID?: string;
  서비스명?: string;
  서비스목적요약?: string;
  서비스분야?: string;
  지원대상?: string;
  지원내용?: string;
  선정기준?: string;
  소관기관명?: string;
  소관기관유형?: string;
  신청기한?: string;
  상세조회URL?: string;
  조회수?: number;
  사용자구분?: string;
}

interface Subsidy24Response {
  data?: Subsidy24Item[];
  totalCount?: number;
}

export interface PolicyFetchResult {
  policies: Policy[];
  source: "api" | "fallback";
}

async function fetchSubsidy24Page(
  page: number,
  signal: AbortSignal
): Promise<Subsidy24Response> {
  const url = new URL(`${SUBSIDY24_BASE_URL}${SUBSIDY24_LIST_ENDPOINT}`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("perPage", String(SUBSIDY24_PER_PAGE));
  url.searchParams.set("serviceKey", SUBSIDY24_SERVICE_KEY);

  const res = await fetch(url.toString(), { signal, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`subsidy24 API 응답 오류: ${res.status} (page ${page})`);
  }

  const json: Subsidy24Response = await res.json();
  if (!Array.isArray(json.data)) {
    throw new Error(`subsidy24 API 응답 형식 오류: data 배열이 없습니다 (page ${page})`);
  }

  return json;
}

/**
 * serviceList는 totalCount 기준 페이지네이션 API라 한 번 호출로는 전체 데이터를 받을 수 없다.
 * 1페이지를 먼저 호출해 totalCount를 확인한 뒤, 나머지 페이지를 병렬로 마저 가져와 합친다.
 */
async function fetchSubsidy24Raw(): Promise<Subsidy24Item[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SUBSIDY24_TIMEOUT_MS);

  try {
    const first = await fetchSubsidy24Page(1, controller.signal);
    const totalCount = first.totalCount ?? first.data!.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / SUBSIDY24_PER_PAGE));

    const restPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => fetchSubsidy24Page(i + 2, controller.signal))
    );

    const allItems = [first, ...restPages].flatMap((page) => page.data ?? []);

    console.log(
      `[policyService] subsidy24 totalCount=${totalCount}, totalPages=${totalPages}, 실제 fetch된 정책 개수=${allItems.length}`
    );

    return allItems;
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeAndFilter(items: Subsidy24Item[], user: UserInfo): Policy[] {
  const policies: Policy[] = [];

  for (const item of items) {
    const category = classifyPolicy({
      serviceField: item.서비스분야,
      serviceName: item.서비스명,
      supportTarget: item.지원대상,
    });

    const { excluded, needsCheck } = matchApiPolicy(user, category, {
      serviceName: item.서비스명,
      purposeSummary: item.서비스목적요약,
      supportTarget: item.지원대상,
      selectionCriteria: item.선정기준,
      orgType: item.소관기관유형,
      orgName: item.소관기관명,
      applicationPeriod: item.신청기한,
      userType: item.사용자구분,
    });

    if (excluded) continue;

    const summary =
      item.지원내용?.trim() || item.서비스목적요약?.trim() || "상세 내용은 신청 페이지에서 확인해주세요.";

    policies.push({
      id: `api-${item.서비스ID ?? item.서비스명}`,
      category,
      name: item.서비스명 ?? "이름 미상 서비스",
      summary: summary.length > 80 ? `${summary.slice(0, 80)}…` : summary,
      applyUrl: item.상세조회URL || "https://www.gov.kr/",
      needsCheck,
      source: "api",
      viewCount: typeof item.조회수 === "number" ? item.조회수 : 0,
      applicationPeriod: describeApplicationPeriod(item.신청기한),
    });
  }

  // 메이저 정책(조회수가 높은 = 많이 찾아본) 우선 노출
  policies.sort((a, b) => b.viewCount - a.viewCount);

  return policies;
}

/**
 * requirements.md 5번 안정성 대책: API가 3초 이상 걸리거나 실패하면 fallback 정적 데이터로 대체.
 */
export async function getPolicies(user: UserInfo): Promise<PolicyFetchResult> {
  try {
    const raw = await fetchSubsidy24Raw();
    const policies = normalizeAndFilter(raw, user);
    return { policies, source: "api" };
  } catch (err) {
    console.warn("[policyService] subsidy24 API 호출 실패, fallback 데이터로 대체합니다.", err);
    return { policies: getFallbackPolicies(user), source: "fallback" };
  }
}
