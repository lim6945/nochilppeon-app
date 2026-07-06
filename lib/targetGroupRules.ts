import type { HouseholdType, UserInfo } from "./types";

export interface TargetGroupRule {
  keywords: string[];
  /** true면 사용자가 이 특정 대상군에 해당함(제외하지 않음) */
  matches: (user: UserInfo) => boolean;
}

export const hasHousehold = (user: UserInfo, ...types: HouseholdType[]) =>
  types.some((t) => user.householdTypes.includes(t));

/**
 * 지금까지 발견된 "특정 대상군을 한정하는" 제외 키워드를 하나의 배열로 통합 관리한다.
 * 카테고리 분류(주거/취업/교육 등)와 무관하게 모든 정책에 공통으로 적용된다 — 어떤 카테고리로
 * 분류됐든, 지원대상/서비스명/서비스목적요약 텍스트에 이 키워드가 있으면 matches 조건을
 * 만족하는 사용자만 통과하고, 그렇지 않으면 완전히 제외한다.
 *
 * 사용자 입력 항목(나이/가구상황/현재상태)으로는 절대 대응할 수 없는 키워드는 matches가
 * 항상 false라서 발견되기만 하면 무조건 제외된다(한센인/노숙인/청소년/미성년 학생 등).
 */
export const TARGET_GROUP_RULES: TargetGroupRule[] = [
  { keywords: ["장애인", "장애"], matches: (u) => hasHousehold(u, "장애인가구") },
  { keywords: ["국가유공자", "보훈대상자", "보훈"], matches: (u) => hasHousehold(u, "보훈대상자") },
  { keywords: ["다문화가정", "다문화"], matches: (u) => hasHousehold(u, "다문화가정") },
  { keywords: ["북한이탈주민", "탈북민", "새터민"], matches: (u) => hasHousehold(u, "북한이탈주민") },
  {
    keywords: ["한부모", "조손가정", "조손가구", "미혼모", "미혼부"],
    matches: (u) => hasHousehold(u, "한부모·조손가구"),
  },
  {
    keywords: ["저소득층", "기초생활수급자", "기초생활수급", "차상위계층", "차상위"],
    matches: (u) => hasHousehold(u, "저소득층"),
  },
  { keywords: ["다자녀"], matches: (u) => hasHousehold(u, "다자녀가구") },
  {
    keywords: ["임산부", "영유아", "유아", "아동", "육아"],
    matches: (u) => hasHousehold(u, "자녀있음", "다자녀가구"),
  },
  { keywords: ["농업인", "어업인", "축산업인"], matches: (u) => u.employmentStatus === "자영업" },
  { keywords: ["구직자", "실업자"], matches: (u) => u.employmentStatus === "구직중" },
  {
    keywords: ["대학생", "대학교", "재학생", "휴학생"],
    matches: (u) => u.employmentStatus === "대학생",
  },
  { keywords: ["노인", "어르신", "경로"], matches: (u) => u.age >= 60 },
  // 「청년기본법」 등에서 폭넓게 쓰이는 19~39세 기준을 적용 (지자체별로 34/39세 등 차이가 있어
  // 더 넓은 쪽으로 잡아 과소 배제를 피함)
  { keywords: ["청년"], matches: (u) => u.age >= 19 && u.age <= 39 },
  // 사용자 입력 항목으로는 절대 대응할 수 없는, 특수 상황군·연령군 한정 키워드 → 발견 시 항상 제외
  {
    keywords: [
      "한센인",
      "노숙인",
      "재해",
      "재난",
      "범죄피해자",
      "성폭력",
      "가정폭력",
      "자활사업 참여자",
      "시설 입소자",
      "위기가구",
      "소년소녀가장",
      "청소년",
      "위탁청소년",
      "가정 밖 청소년",
      "청소년가장",
      "학대피해자",
      "가정폭력피해자",
      "성매매피해자",
      "고등학생",
      "중학생",
      "초등학생",
      // "보호종료아동"/"자립준비청년"의 "아동"은 신청인이 자녀가 있다는 뜻이 아니라 신청인
      // 본인이 과거 보호시설에서 자란 이력을 가리키므로, "자녀있음" 가구로는 통과시키면 안 된다.
      "자립준비청년",
      "보호종료아동",
    ],
    matches: () => false,
  },
];
