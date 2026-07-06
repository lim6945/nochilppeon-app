import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

/**
 * database/schema.sql의 increment_usage_counter() RPC를 호출해 누적 이용자 수를 1 증가시키고
 * 최신 합계를 반환합니다. 개인정보나 입력값은 저장하지 않고 순수 카운트만 다룹니다.
 * 아직 스키마가 준비되지 않았거나 네트워크 문제가 있으면 null을 반환해 화면에서 우아하게 대체합니다.
 */
export async function incrementAndGetUsageCount(): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc("increment_usage_counter");
    if (error) throw error;
    return typeof data === "number" ? data : null;
  } catch (err) {
    console.warn("[supabase] 이용자 수 카운트 실패", err);
    return null;
  }
}
