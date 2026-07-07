import {
  SUBSIDY24_BASE_URL,
  SUBSIDY24_LIST_ENDPOINT,
  SUBSIDY24_PER_PAGE,
  SUBSIDY24_SERVICE_KEY,
  SUBSIDY24_CACHE_REVALIDATE_SECONDS,
  SUBSIDY24_SERVER_TIMEOUT_MS,
} from "./config";

export interface Subsidy24Item {
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

/**
 * 서버(API Route)에서만 호출한다. 원본 데이터(약 11,000건, 11페이지)는 사용자마다 다르지 않으므로
 * Next.js의 fetch 데이터 캐시로 일정 시간 재사용한다 — 매 방문마다 수 MB를 다시 받아오지 않게 해서
 * (1) 모바일처럼 느린 네트워크에서도 체감 속도가 빨라지고, (2) 공공데이터포털 일일 호출 한도도 보호한다.
 */
async function fetchSubsidy24Page(page: number, signal: AbortSignal): Promise<Subsidy24Response> {
  const url = new URL(`${SUBSIDY24_BASE_URL}${SUBSIDY24_LIST_ENDPOINT}`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("perPage", String(SUBSIDY24_PER_PAGE));
  url.searchParams.set("serviceKey", SUBSIDY24_SERVICE_KEY);

  const res = await fetch(url.toString(), {
    signal,
    next: { revalidate: SUBSIDY24_CACHE_REVALIDATE_SECONDS },
  });
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
 * (서버 환경에서 실행되므로 사용자의 네트워크 속도와 무관하게 빠르게 끝난다.)
 */
export async function fetchAllSubsidy24Items(): Promise<Subsidy24Item[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SUBSIDY24_SERVER_TIMEOUT_MS);

  try {
    const first = await fetchSubsidy24Page(1, controller.signal);
    const totalCount = first.totalCount ?? first.data!.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / SUBSIDY24_PER_PAGE));

    const restPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => fetchSubsidy24Page(i + 2, controller.signal))
    );

    const allItems = [first, ...restPages].flatMap((page) => page.data ?? []);

    console.log(
      `[subsidy24Client] totalCount=${totalCount}, totalPages=${totalPages}, 실제 fetch된 정책 개수=${allItems.length}`
    );

    return allItems;
  } finally {
    clearTimeout(timeoutId);
  }
}
