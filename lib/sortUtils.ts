import type { Policy } from "./types";

export const SORT_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "popular", label: "인기순" },
  { value: "deadline", label: "마감임박순" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

/** "인기순" 선택 시 화면에 실제로 보여주는 카드 개수. 전체 매칭 개수(pill/헤딩 표시)와는 별개다. */
export const POPULAR_DISPLAY_LIMIT = 10;

function hasConcreteDeadline(policy: Policy): boolean {
  return policy.applicationPeriod.kind === "dated" && policy.applicationPeriod.daysUntilEnd !== undefined;
}

/**
 * "마감임박순"은 구체적인 마감일이 없는 정책("상시지원"/"지원기간 별도 확인 필요")을 화면에서
 * 완전히 제외한다. "전체"/"인기순"은 아무 것도 걸러내지 않고 그대로 반환한다.
 */
export function filterPoliciesForSort(policies: Policy[], sortBy: SortOption): Policy[] {
  if (sortBy === "deadline") {
    return policies.filter(hasConcreteDeadline);
  }
  return policies;
}

function deadlineSortKey(policy: Policy): number {
  return policy.applicationPeriod.daysUntilEnd ?? Number.POSITIVE_INFINITY;
}

/**
 * filterPoliciesForSort로 이미 걸러진 목록의 "순서만" 바꾼다. "전체"는 API/fallback에서 받아온
 * 원본 순서를 그대로 유지하기 위해 아무 것도 하지 않는다.
 */
export function sortPolicies(policies: Policy[], sortBy: SortOption): Policy[] {
  if (sortBy === "all") return policies;

  const sorted = [...policies];
  switch (sortBy) {
    case "popular":
      sorted.sort((a, b) => b.viewCount - a.viewCount);
      break;
    case "deadline":
      sorted.sort((a, b) => deadlineSortKey(a) - deadlineSortKey(b));
      break;
  }
  return sorted;
}
