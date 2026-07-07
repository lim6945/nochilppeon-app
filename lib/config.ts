// 부스 시연용 하드코딩 설정입니다. (docs/subsidy24-api-info.md, docs/supabase-info.md 참고)
export const SUBSIDY24_BASE_URL = "https://api.odcloud.kr/api";
export const SUBSIDY24_LIST_ENDPOINT = "/gov24/v3/serviceList";
export const SUBSIDY24_SERVICE_KEY =
  "6029df3821ddadb857defac149730b0b3aeacd251597f62cdc5ec38ca1f21a53";

// 이 전체 페이지네이션(총 1만여 건, 페이지당 1000건 x 약 11회 병렬 호출)은 이제 서버(API Route)에서만
// 실행된다 — Vercel 서버 ↔ 공공데이터포털 구간은 사용자의 네트워크 속도와 무관하게 항상 빠르므로
// 넉넉하게 잡아도 된다. 실패 시 fallback으로 전환된다.
export const SUBSIDY24_SERVER_TIMEOUT_MS = 15000;
export const SUBSIDY24_PER_PAGE = 1000;
// 원본 데이터는 자주 바뀌지 않으므로 Next.js fetch 캐시로 이 시간(초) 동안 재사용한다.
// 모든 사용자가 이 캐시를 공유하므로, 캐시가 살아있는 동안은 외부 API를 다시 호출하지 않는다.
export const SUBSIDY24_CACHE_REVALIDATE_SECONDS = 1800;

// 클라이언트가 우리 서버의 /api/policies를 호출할 때 쓰는 타임아웃.
// 서버가 캐시된 응답을 즉시 돌려주는 경우가 대부분이라 짧게 잡아도 되지만,
// 캐시가 막 만료돼 서버가 외부 API를 다시 호출해야 하는 경우(최대 SUBSIDY24_SERVER_TIMEOUT_MS)까지
// 감안해 여유 있게 잡는다.
export const POLICIES_API_TIMEOUT_MS = 20000;

export const SUPABASE_URL = "https://eqrgoxrgwylgopvbrjhe.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_mqlpnZFQ14b8qmQFpH94eQ_OQdq5qVA";
