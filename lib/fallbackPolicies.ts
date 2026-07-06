import { describeApplicationPeriod } from "./deadlineUtils";
import type {
  CategoryName,
  EmploymentStatus,
  HouseholdType,
  Policy,
  UserInfo,
} from "./types";

interface FallbackConditions {
  ageMin?: number;
  ageMax?: number;
  /** "200만원 이하" | "300만원 이하" | "400만원 이하" 형태의 소득 상한 조건 */
  incomeMax?: string;
  employmentStatus?: EmploymentStatus | EmploymentStatus[];
  householdType?: HouseholdType | HouseholdType[];
}

interface FallbackPolicy {
  id: number;
  category: CategoryName;
  name: string;
  summary: string;
  conditions: FallbackConditions;
  applyUrl: string;
}

// requirements.md 5번 "Fallback용 정적 정책 데이터" — 부스 시연 중 API 장애 시 대신 노출 (12~15개)
export const FALLBACK_POLICIES: FallbackPolicy[] = [
  {
    id: 1,
    category: "주거",
    name: "청년월세 특별지원",
    summary: "월 최대 20만원, 12개월 지원",
    conditions: { ageMin: 19, ageMax: 34, incomeMax: "300만원 이하" },
    applyUrl: "https://www.gov.kr/",
  },
  {
    id: 2,
    category: "주거",
    name: "버팀목 전세자금대출",
    summary: "무주택 세대주 대상 저금리 전세자금 대출",
    conditions: { householdType: "무주택가구", incomeMax: "400만원 이하" },
    applyUrl: "https://www.gov.kr/",
  },
  {
    id: 3,
    category: "금융·자산형성",
    name: "청년내일저축계좌",
    summary: "3년간 저축하면 최대 1,440만원",
    conditions: { ageMin: 19, ageMax: 34, employmentStatus: "재직중" },
    applyUrl: "https://www.gov.kr/",
  },
  {
    id: 4,
    category: "금융·자산형성",
    name: "희망저축계좌Ⅰ",
    summary: "3년 만기 시 최대 1,440만원 자산형성 지원",
    conditions: { householdType: "저소득층" },
    applyUrl: "https://www.gov.kr/",
  },
  {
    id: 5,
    category: "취업",
    name: "국민취업지원제도",
    summary: "구직촉진수당 월 50만원 x 6개월",
    conditions: { employmentStatus: "구직중" },
    applyUrl: "https://www.gov.kr/",
  },
  {
    id: 6,
    category: "창업",
    name: "소상공인 정책자금",
    summary: "운영자금 최대 7천만원 저금리 지원",
    conditions: { employmentStatus: "자영업" },
    applyUrl: "https://www.gov.kr/",
  },
  {
    id: 7,
    category: "창업",
    name: "청년창업사관학교",
    summary: "창업 자금 최대 1억원 + 사업화 지원",
    conditions: { ageMin: 19, ageMax: 39 },
    applyUrl: "https://www.gov.kr/",
  },
  {
    id: 8,
    category: "신혼부부·결혼",
    name: "신혼부부 전세자금 대출",
    summary: "최대 2억원, 저금리 대출",
    conditions: { householdType: "신혼부부·예비부부" },
    applyUrl: "https://www.gov.kr/",
  },
  {
    id: 9,
    category: "임신·출산·육아",
    name: "부모급여",
    summary: "만 0세 월 100만원, 만 1세 월 50만원",
    conditions: { householdType: "자녀있음" },
    applyUrl: "https://www.gov.kr/",
  },
  {
    id: 10,
    category: "임신·출산·육아",
    name: "첫만남이용권",
    summary: "출생아 1인당 200만원 바우처 지급",
    conditions: { householdType: "자녀있음" },
    applyUrl: "https://www.gov.kr/",
  },
  {
    id: 11,
    category: "어르신·노후",
    name: "기초연금",
    summary: "만 65세 이상, 월 최대 33만원",
    conditions: { ageMin: 65 },
    applyUrl: "https://www.gov.kr/",
  },
  {
    id: 12,
    category: "어르신·노후",
    name: "노인일자리 및 사회활동지원",
    summary: "월 활동비 최대 29만원 지급",
    conditions: { ageMin: 60 },
    applyUrl: "https://www.gov.kr/",
  },
  {
    id: 13,
    category: "교육",
    name: "국가장학금",
    summary: "소득구간에 따라 등록금 일부~전액 지원",
    conditions: { employmentStatus: "대학생" },
    applyUrl: "https://www.gov.kr/",
  },
  {
    id: 14,
    category: "생활·복지",
    name: "에너지바우처",
    summary: "냉·난방비 지원용 바우처 지급",
    conditions: { householdType: "저소득층" },
    applyUrl: "https://www.gov.kr/",
  },
  {
    id: 15,
    category: "생활·복지",
    name: "긴급복지지원제도",
    summary: "위기상황 시 생계·의료·주거비 등 긴급 지원",
    conditions: {},
    applyUrl: "https://www.gov.kr/",
  },
];

function incomeMaxToLevel(incomeMax: string): number {
  const num = Number(incomeMax.match(/\d+/)?.[0] ?? "0");
  if (num <= 200) return 1;
  if (num <= 300) return 2;
  if (num <= 400) return 3;
  return 4;
}

function userIncomeLevel(incomeRange: UserInfo["incomeRange"]): number | null {
  switch (incomeRange) {
    case "200만원 이하":
      return 1;
    case "200~300만원":
      return 2;
    case "300~400만원":
      return 3;
    case "400만원 이상":
      return 4;
    default:
      return null;
  }
}

function toArray<T>(value: T | T[] | undefined): T[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value];
}

function matchesConditions(user: UserInfo, conditions: FallbackConditions) {
  let needsCheck = false;

  if (conditions.ageMin !== undefined && user.age < conditions.ageMin) return null;
  if (conditions.ageMax !== undefined && user.age > conditions.ageMax) return null;

  const employmentOptions = toArray(conditions.employmentStatus);
  if (employmentOptions && !employmentOptions.includes(user.employmentStatus)) return null;

  const householdOptions = toArray(conditions.householdType);
  if (householdOptions && !householdOptions.some((h) => user.householdTypes.includes(h))) {
    return null;
  }

  if (conditions.incomeMax) {
    const userLevel = userIncomeLevel(user.incomeRange);
    if (userLevel === null) {
      needsCheck = true; // "잘 모르겠음" 선택 시 소득 필터는 건너뛰고 확인 배지 표시
    } else if (userLevel > incomeMaxToLevel(conditions.incomeMax)) {
      return null;
    }
  }

  return { needsCheck };
}

export function getFallbackPolicies(user: UserInfo): Policy[] {
  const results: Policy[] = [];

  for (const policy of FALLBACK_POLICIES) {
    const match = matchesConditions(user, policy.conditions);
    if (!match) continue;

    results.push({
      id: `fallback-${policy.id}`,
      category: policy.category,
      name: policy.name,
      summary: policy.summary,
      applyUrl: policy.applyUrl,
      needsCheck: match.needsCheck,
      source: "fallback",
      viewCount: 0,
      applicationPeriod: describeApplicationPeriod(undefined),
    });
  }

  return results;
}
