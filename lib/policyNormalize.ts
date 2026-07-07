import { classifyPolicy } from "./categoryMapping";
import { matchApiPolicy } from "./apiPolicyFilter";
import { describeApplicationPeriod } from "./deadlineUtils";
import type { Subsidy24Item } from "./subsidy24Client";
import type { Policy, UserInfo } from "./types";

export function normalizeAndFilter(items: Subsidy24Item[], user: UserInfo): Policy[] {
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
