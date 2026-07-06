// 부스 시연용 하드코딩 설정입니다. (docs/subsidy24-api-info.md, docs/supabase-info.md 참고)
export const SUBSIDY24_BASE_URL = "https://api.odcloud.kr/api";
export const SUBSIDY24_LIST_ENDPOINT = "/gov24/v3/serviceList";
export const SUBSIDY24_SERVICE_KEY =
  "6029df3821ddadb857defac149730b0b3aeacd251597f62cdc5ec38ca1f21a53";

// 전체 페이지네이션(총 1만여 건, 페이지당 1000건 x 약 11회 병렬 호출)을 감안해
// 원래의 3초보다 넉넉하게 잡는다. 그래도 응답이 없거나 실패하면 fallback으로 전환된다.
export const SUBSIDY24_TIMEOUT_MS = 8000;
export const SUBSIDY24_PER_PAGE = 1000;

export const SUPABASE_URL = "https://eqrgoxrgwylgopvbrjhe.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_mqlpnZFQ14b8qmQFpH94eQ_OQdq5qVA";
