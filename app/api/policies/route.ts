import { NextResponse } from "next/server";
import { fetchAllSubsidy24Items } from "@/lib/subsidy24Client";
import { normalizeAndFilter } from "@/lib/policyNormalize";
import { getFallbackPolicies } from "@/lib/fallbackPolicies";
import type { UserInfo } from "@/lib/types";

export async function POST(request: Request) {
  const user: UserInfo = await request.json();

  try {
    const started = Date.now();
    const raw = await fetchAllSubsidy24Items();
    const policies = normalizeAndFilter(raw, user);
    console.log(`[api/policies] 처리 완료: ${Date.now() - started}ms, 결과 ${policies.length}건`);
    return NextResponse.json({ policies, source: "api" });
  } catch (err) {
    console.warn("[api/policies] subsidy24 API 호출 실패, fallback 데이터로 대체합니다.", err);
    return NextResponse.json({ policies: getFallbackPolicies(user), source: "fallback" });
  }
}
