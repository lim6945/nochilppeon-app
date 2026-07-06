import type { CategoryName } from "./types";

/**
 * requirements.md 5번 "카테고리 매핑 전략(2단계)"를 그대로 구현.
 * 1단계: API의 `서비스분야` 값으로 기본 카테고리 부여.
 */
export function mapServiceFieldToCategory(serviceField: string | undefined): CategoryName {
  const field = (serviceField ?? "").trim();

  if (field === "주거·자립") return "주거";
  if (field === "보육·교육") return "교육";
  if (field === "고용·창업") return "취업";
  if (field === "임신·출산") return "임신·출산·육아";

  // "신체건강", "정신건강", "문화·환경", "행정·안전", "농림축산어업", "서민금융" 등
  // 및 목록에 없는 새로운 값은 전부 "생활·복지"
  return "생활·복지";
}

interface KeywordRule {
  keywords: string[];
  category: CategoryName;
}

// 2단계 — 서비스명 + 지원대상 텍스트 키워드로 세분화 (순서대로 첫 매칭 우선)
const KEYWORD_RULES: KeywordRule[] = [
  { keywords: ["신혼부부", "혼인", "예비부부"], category: "신혼부부·결혼" },
  { keywords: ["임신", "출산", "영유아", "보육", "어린이집"], category: "임신·출산·육아" },
  { keywords: ["노인", "어르신", "기초연금", "노후"], category: "어르신·노후" },
  { keywords: ["창업", "소상공인"], category: "창업" },
  { keywords: ["장학", "학자금", "등록금"], category: "교육" },
  { keywords: ["저축", "적금", "대출", "장려금"], category: "금융·자산형성" },
];

/**
 * 2단계: 서비스명 + 지원대상 텍스트 키워드로 1단계 분류를 덮어씀.
 */
export function classifyPolicy(params: {
  serviceField?: string;
  serviceName?: string;
  supportTarget?: string;
}): CategoryName {
  const baseCategory = mapServiceFieldToCategory(params.serviceField);
  const rawText = `${params.serviceName ?? ""} ${params.supportTarget ?? ""}`;
  // "창업보육센터"/"창업보육지원"처럼 비즈니스 인큐베이팅을 뜻하는 "창업보육"은 영유아 돌봄과
  // 무관한데 "보육" 키워드 때문에 임신·출산·육아로 잘못 분류되던 문제를 막기 위해 미리 제거한다.
  const text = rawText.replace(/창업\s*보육/g, "창업");

  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.category;
    }
  }

  return baseCategory;
}
