import type { CategoryName, HouseholdType, UserInfo } from "./types";
import { textMentionsRegion } from "./regionUtils";
import { isApplicationDeadlinePassed } from "./deadlineUtils";
import { TARGET_GROUP_RULES, hasHousehold } from "./targetGroupRules";

interface AgeRange {
  min: number | null;
  max: number | null;
}

/**
 * "만 65세 이상", "만 O세 이하/까지", "19세부터 34세까지", "19~34세" 등 자유 텍스트에서
 * 나이 조건을 최대한 추출한다. ("만" 유무와 무관하게 매칭)
 */
// "18세 미만 부양자녀", "70세 이상 직계존속"처럼 선정기준에 흔히 등장하는 문구는
// 신청인 본인이 아니라 부양가족/세대원의 나이 조건이라 신청인 나이와 비교하면 안 된다.
// 이런 문구가 포함된 줄(문장) 전체를 나이 파싱 전에 제거한다.
const DEPENDENT_CONTEXT_KEYWORDS = ["부양자녀", "부양가족", "직계존속", "배우자", "가구원", "세대원"];

function stripDependentClauses(text: string): string {
  return text
    .split(/[\r\n]+/)
    .filter((line) => !DEPENDENT_CONTEXT_KEYWORDS.some((kw) => line.includes(kw)))
    .join(" ");
}

function parseAgeRange(text: string): AgeRange {
  // 두 번째 숫자 앞에 "만 "이 다시 붙는 "만 12세 ~ 만 24세" 같은 표기도 매칭되도록
  // 구분자 뒤에 선택적으로 "만 "을 허용한다.
  const rangeMatch = text.match(
    /(\d{1,3})\s*세?\s*(?:부터|~|-|∼)\s*(?:만\s*)?(\d{1,3})\s*세/
  );
  if (rangeMatch) {
    return { min: Number(rangeMatch[1]), max: Number(rangeMatch[2]) };
  }

  const overMatches = [...text.matchAll(/(\d{1,3})\s*세\s*(?:이상|초과|부터)/g)];
  const underMatches = [...text.matchAll(/(\d{1,3})\s*세\s*(?:이하|미만|까지)/g)];

  const min = overMatches.length > 0 ? Number(overMatches[0][1]) : null;
  const max = underMatches.length > 0 ? Number(underMatches[0][1]) : null;

  if (min === null && max === null && text.includes("청소년기본법")) {
    // 「청소년기본법」은 "청소년"을 9세 이상 24세 이하로 정의한다. 숫자로 된 나이 범위가
    // 따로 없어도 이 법령명이 언급되면 해당 정의를 암묵적인 나이 조건으로 적용한다.
    return { min: 9, max: 24 };
  }

  return { min, max };
}

// 우대·가산 성격으로도 흔히 쓰여 텍스트만으로 배타 여부를 단정하기 어려운 키워드.
// 겹치지 않아도 완전 제외하지 않고 "조건 확인 필요" 배지만 붙인다.
const AMBIGUOUS_HOUSEHOLD_KEYWORDS: { keywords: string[]; type: HouseholdType }[] = [
  { keywords: ["1인가구", "1인 가구"], type: "1인가구" },
  { keywords: ["신혼부부", "예비부부"], type: "신혼부부·예비부부" },
  { keywords: ["무주택"], type: "무주택가구" },
];

function findMatchingHouseholdTypes(
  text: string,
  rules: { keywords: string[]; type: HouseholdType }[]
): HouseholdType[] {
  const found: HouseholdType[] = [];
  for (const { keywords, type } of rules) {
    if (keywords.some((kw) => text.includes(kw))) found.push(type);
  }
  return found;
}

/**
 * 텍스트 파싱보다 먼저 적용하는 카테고리 기반 하드 필터.
 * 이미 분류해 둔 9개 고정 카테고리를 기준으로, 사용자 프로필과 명백히 맞지 않으면
 * 텍스트 파싱 로직을 타기도 전에 무조건 제외한다.
 */
function passesCategoryRule(category: CategoryName, user: UserInfo): boolean {
  switch (category) {
    case "어르신·노후":
      return user.age >= 60;
    case "임신·출산·육아":
      return hasHousehold(user, "자녀있음", "다자녀가구", "한부모·조손가구");
    case "신혼부부·결혼":
      return hasHousehold(user, "신혼부부·예비부부");
    case "창업":
      return user.employmentStatus === "자영업";
    case "교육":
      return user.employmentStatus === "대학생" || user.age <= 35;
    case "취업":
      return (["구직중", "프리랜서", "무직·기타"] as UserInfo["employmentStatus"][]).includes(
        user.employmentStatus
      );
    default:
      // 주거 / 금융·자산형성 / 생활·복지: 기존 텍스트 기반 로직을 그대로 적용
      return true;
  }
}

// 실제 API 데이터에는 "지방자치단체"라는 값이 그대로 내려오지 않고, 대신 시군구/광역시도/
// 교육청/지방출자_출연기관/지방공기업처럼 더 세분화된 값으로 내려온다("중앙행정기관", "공공기관"
// 도 별도 값). "중앙행정기관"(전국 대상)이 아닌 이 지역 소관 기관들을 "지방자치단체" 성격으로
// 간주해 지역 매칭을 요구한다. "공공기관"은 전국 단위 기관도 많아 애매하므로 제외 대상에서 뺐다.
const LOCAL_ORG_TYPES = ["시군구", "광역시도", "교육청", "지방출자_출연기관", "지방공기업"];

const INCOME_KEYWORDS = ["소득", "중위소득", "만원 이하", "만원 이상"];

export interface ApiFilterResult {
  excluded: boolean;
  needsCheck: boolean;
}

/**
 * requirements.md 5번 + 사용자 피드백: 특정 대상군을 한정하는 키워드/나이/재직상태 조건은
 * 최대한 엄격하게 걸러내고(맞지 않으면 완전 제외), 정말 일반적인(대상 한정 없는) 정책만
 * 노출하되 소득 조건이 텍스트만으로 애매할 때만 "조건 확인 필요" 배지를 붙인다.
 */
export function matchApiPolicy(
  user: UserInfo,
  category: CategoryName,
  fields: {
    serviceName?: string;
    purposeSummary?: string;
    supportTarget?: string;
    selectionCriteria?: string;
    orgType?: string;
    orgName?: string;
    applicationPeriod?: string;
    userType?: string;
  }
): ApiFilterResult {
  // 0) 카테고리 기반 하드 필터 — 텍스트 파싱보다 먼저 적용
  if (!passesCategoryRule(category, user)) {
    return { excluded: true, needsCheck: false };
  }

  // 0-1) 신청기한이 지났으면 무조건 제외 ("상시신청"이거나 연도까지 명시된 구체적 마감일이
  //      아직 지나지 않았으면 그대로 유지 — 연도 없는 매년 반복 기간 등 애매한 경우는 건드리지 않음)
  if (isApplicationDeadlinePassed(fields.applicationPeriod)) {
    return { excluded: true, needsCheck: false };
  }

  // 0-2) 사용자구분: "개인"/"가구"가 전혀 포함되지 않고 "법인/시설/단체"만 대상이면 개인
  //      신청자와 무관하므로 무조건 제외. "소상공인"만 있으면 자영업 사용자에 한해 통과.
  const userType = fields.userType ?? "";
  const targetsIndividual = userType.includes("개인") || userType.includes("가구");
  if (userType && !targetsIndividual) {
    const targetsSmallBusiness = userType.includes("소상공인");
    if (!targetsSmallBusiness || user.employmentStatus !== "자영업") {
      return { excluded: true, needsCheck: false };
    }
  }

  // TARGET_GROUP_RULES 전용: 지원대상 + 서비스명 + 서비스목적요약만 사용 (선정기준 제외)
  const targetKeywordText = [fields.serviceName, fields.purposeSummary, fields.supportTarget]
    .filter(Boolean)
    .join(" ");

  // 나이/소득 파싱용: 선정기준까지 포함하되, 부양가족 관련 문장은 제거하고 사용
  const fullText = [
    fields.serviceName,
    fields.purposeSummary,
    fields.supportTarget,
    fields.selectionCriteria,
  ]
    .filter(Boolean)
    .join(" ");
  const ageParsingText = stripDependentClauses(fullText);
  let needsCheck = false;

  // 1) 특정 대상군을 한정하는 키워드 → 사용자 프로필과 대응되지 않으면 완전 제외
  for (const rule of TARGET_GROUP_RULES) {
    if (rule.keywords.some((kw) => targetKeywordText.includes(kw)) && !rule.matches(user)) {
      return { excluded: true, needsCheck: false };
    }
  }

  // 2) 나이: "만 O세 이상/이하/부터/까지" 등 조건을 벗어나면 하드 제외
  //    (부양가족·세대원의 나이를 신청인 본인 나이로 오인하지 않도록 관련 문장은 미리 제거함)
  const { min, max } = parseAgeRange(ageParsingText);
  if (min !== null && user.age < min) return { excluded: true, needsCheck: false };
  if (max !== null && user.age > max) return { excluded: true, needsCheck: false };

  // 3) 지역: 중앙행정기관/공공기관 등은 전국 대상으로 간주. 지자체성 기관(시군구/광역시도 등)은
  //    소관기관명 또는 지원대상 텍스트에 사용자의 거주지역이 명시적으로 없으면 하드 제외.
  const orgType = fields.orgType ?? "";
  if (LOCAL_ORG_TYPES.some((t) => orgType.includes(t))) {
    const combinedText = `${fields.orgName ?? ""} ${fields.supportTarget ?? ""}`;
    if (!textMentionsRegion(combinedText, user.region)) {
      return { excluded: true, needsCheck: false };
    }
  }

  // 4) 우대성 가구 키워드(1인가구/신혼부부/무주택)는 배타 여부를 단정할 수 없으므로 애매 처리
  const ambiguousHouseholds = findMatchingHouseholdTypes(fullText, AMBIGUOUS_HOUSEHOLD_KEYWORDS);
  if (ambiguousHouseholds.length > 0) {
    const hasOverlap = ambiguousHouseholds.some((t) => user.householdTypes.includes(t));
    if (!hasOverlap) needsCheck = true;
  }

  // 5) 소득: 텍스트에 소득 기준이 있으면 자동 판별이 어려우므로 애매 처리
  if (INCOME_KEYWORDS.some((kw) => fullText.includes(kw))) {
    needsCheck = true;
  }
  if (user.incomeRange === "잘 모르겠음" && fullText.includes("소득")) {
    needsCheck = true;
  }

  return { excluded: false, needsCheck };
}
