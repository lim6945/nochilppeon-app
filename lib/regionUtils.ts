import { REGIONS, type Region } from "./types";

const REGION_ALIASES: Record<Region, string[]> = {
  서울특별시: ["서울특별시", "서울시", "서울"],
  부산광역시: ["부산광역시", "부산시", "부산"],
  대구광역시: ["대구광역시", "대구시", "대구"],
  인천광역시: ["인천광역시", "인천시", "인천"],
  광주광역시: ["광주광역시", "광주"],
  대전광역시: ["대전광역시", "대전시", "대전"],
  울산광역시: ["울산광역시", "울산시", "울산"],
  세종특별자치시: ["세종특별자치시", "세종시", "세종"],
  경기도: ["경기도", "경기"],
  강원특별자치도: ["강원특별자치도", "강원도", "강원"],
  충청북도: ["충청북도", "충북"],
  충청남도: ["충청남도", "충남"],
  전북특별자치도: ["전북특별자치도", "전라북도", "전북"],
  전라남도: ["전라남도", "전남"],
  경상북도: ["경상북도", "경북"],
  경상남도: ["경상남도", "경남"],
  제주특별자치도: ["제주특별자치도", "제주도", "제주"],
};

const REGION_SHORT: Record<Region, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원특별자치도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전북특별자치도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};

export function shortRegionName(region: Region): string {
  return REGION_SHORT[region] ?? region;
}

/** 소관기관명 등 텍스트에서 특정 시/도 이름을 찾아 반환 (없으면 null) */
export function extractRegionFromText(text: string | undefined): Region | null {
  if (!text) return null;
  if (text.includes("전국")) return null;

  for (const region of REGIONS) {
    const aliases = REGION_ALIASES[region];
    if (aliases.some((alias) => text.includes(alias))) {
      return region;
    }
  }
  return null;
}

/** 텍스트에 특정 시/도(사용자가 선택한 거주지역)가 명시적으로 언급되어 있는지 확인 */
export function textMentionsRegion(text: string | undefined, region: Region): boolean {
  if (!text) return false;
  if (text.includes("전국")) return true;
  return REGION_ALIASES[region].some((alias) => text.includes(alias));
}

/**
 * 텍스트에 언급된 모든 시/도를 찾는다. "전국"이 언급되면 특정 지역 한정이 아니라는 뜻이므로
 * 빈 배열을 반환한다. (예: "인천발전본부 반경 5km 이내 ... 인천시 실거주 1년 이상"처럼
 * 소관기관유형은 "공공기관"이라 지자체로 분류되지 않지만 실제로는 특정 지역 주민만 대상인
 * 경우를 잡아내기 위해 사용)
 */
export function extractAllRegionsFromText(text: string | undefined): Region[] {
  if (!text) return [];
  if (text.includes("전국")) return [];
  return REGIONS.filter((region) => REGION_ALIASES[region].some((alias) => text.includes(alias)));
}
