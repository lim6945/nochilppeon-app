import type { ApplicationPeriodInfo } from "./deadlineUtils";

export const REGIONS = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
] as const;
export type Region = (typeof REGIONS)[number];

export const EMPLOYMENT_STATUSES = [
  "재직중",
  "구직중",
  "대학생",
  "프리랜서",
  "자영업",
  "은퇴",
  "무직·기타",
] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const HOUSEHOLD_TYPES = [
  "1인가구",
  "신혼부부·예비부부",
  "자녀있음",
  "다자녀가구",
  "한부모·조손가구",
  "다문화가정",
  "북한이탈주민",
  "장애인가구",
  "보훈대상자",
  "저소득층",
  "무주택가구",
  "해당없음",
] as const;
export type HouseholdType = (typeof HOUSEHOLD_TYPES)[number];

export const INCOME_RANGES = [
  "200만원 이하",
  "200~300만원",
  "300~400만원",
  "400만원 이상",
  "잘 모르겠음",
] as const;
export type IncomeRange = (typeof INCOME_RANGES)[number];

export const CATEGORY_NAMES = [
  "주거",
  "금융·자산형성",
  "취업",
  "창업",
  "신혼부부·결혼",
  "임신·출산·육아",
  "어르신·노후",
  "교육",
  "생활·복지",
] as const;
export type CategoryName = (typeof CATEGORY_NAMES)[number];

export interface UserInfo {
  age: number;
  region: Region;
  employmentStatus: EmploymentStatus;
  householdTypes: HouseholdType[];
  incomeRange: IncomeRange;
}

export interface Policy {
  id: string;
  category: CategoryName;
  name: string;
  summary: string;
  applyUrl: string;
  needsCheck: boolean;
  source: "api" | "fallback";
  /** API의 `조회수` — 카테고리 내 정렬(메이저 정책 우선 노출)에 사용. fallback 데이터는 0 */
  viewCount: number;
  /** `신청기한` 원문을 파싱한 표시용 정보 (lib/deadlineUtils.ts 참고) */
  applicationPeriod: ApplicationPeriodInfo;
}

export type { ApplicationPeriodInfo };
