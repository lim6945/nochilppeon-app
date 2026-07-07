"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import Logo from "@/components/Logo";
import CategoryPills from "@/components/CategoryPills";
import CategorySection from "@/components/CategorySection";
import PolicyCard from "@/components/PolicyCard";
import { CATEGORY_ORDER } from "@/lib/categories";
import { formatInfoChipLabel } from "@/lib/format";
import { getPolicies } from "@/lib/policyService";
import { matchesSearchQuery } from "@/lib/searchUtils";
import { getCurrentQuery } from "@/lib/storage";
import { incrementAndGetUsageCount } from "@/lib/supabaseClient";
import type { CategoryName, Policy, UserInfo } from "@/lib/types";

const MAX_TOTAL_PREVIEW = 30;

export default function ResultPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null | undefined>(undefined);
  const [policies, setPolicies] = useState<Policy[] | null>(null);
  const [dataSource, setDataSource] = useState<"api" | "fallback" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryName | "전체">("전체");
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const current = getCurrentQuery();
    if (!current) {
      router.replace("/");
      return;
    }
    setUser(current);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    getPolicies(user).then((result) => {
      if (cancelled) return;
      setPolicies(result.policies);
      setDataSource(result.source);
    });

    incrementAndGetUsageCount().then((count) => {
      if (!cancelled) setUsageCount(count);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const counts = useMemo(() => {
    const base = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, 0])) as Record<
      CategoryName,
      number
    >;
    for (const p of policies ?? []) base[p.category] += 1;
    return base;
  }, [policies]);

  const total = policies?.length ?? 0;

  // "전체" 탭 기본 노출: 카테고리 무관 조회수 상위 30개까지만 (policies는 이미 조회수 내림차순 정렬됨)
  const topPolicies = useMemo(() => (policies ?? []).slice(0, MAX_TOTAL_PREVIEW), [policies]);

  const categoryFilteredPolicies = useMemo(() => {
    if (!policies) return [];
    if (selectedCategory === "전체") return policies;
    return policies.filter((p) => p.category === selectedCategory);
  }, [policies, selectedCategory]);

  const trimmedQuery = searchQuery.trim();

  const searchedPolicies = useMemo(() => {
    if (!trimmedQuery) return categoryFilteredPolicies;
    return categoryFilteredPolicies.filter((p) => matchesSearchQuery(trimmedQuery, p.name));
  }, [categoryFilteredPolicies, trimmedQuery]);

  // 카테고리 pill(상단 필터 또는 하단 "OO개 더 있어요" 바로가기 칩) 중 어떤 걸 눌러도 —
  // "전체"를 포함해서 — 로고/타이틀/검색창/카테고리 pill이 전부 보이는 페이지 맨 위로 스크롤한다.
  // (#results-top 같은 중간 앵커는 그 위의 로고·타이틀·검색창을 화면 밖으로 밀어내므로 쓰지 않는다.)
  // 페이지 첫 진입 시(초기값 "전체")에는 스킵한다.
  const isFirstCategoryChange = useRef(true);
  useEffect(() => {
    if (isFirstCategoryChange.current) {
      isFirstCategoryChange.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedCategory]);

  if (user === undefined) {
    return null;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full min-w-0 max-w-md flex-col px-5 py-8">
      <div className="flex items-center justify-between">
        <Logo size="sm" />
        {user && (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
          >
            <ArrowLeft className="h-3 w-3" />
            {formatInfoChipLabel(user)}
          </button>
        )}
      </div>

      <h1 className="mt-6 text-2xl font-extrabold text-gray-900">짜잔! 하마터면 놓칠 뻔한 것들</h1>

      {policies === null ? (
        <p className="mt-6 text-sm text-gray-500">지원정책을 찾아보는 중...</p>
      ) : (
        <>
          <p className="mt-1 text-sm font-medium text-gray-600">총 {total}개를 찾았어요!</p>

          {dataSource === "fallback" && (
            <p className="mt-1 text-xs text-gray-400">
              지금은 준비해둔 예비 데이터로 결과를 보여드리고 있어요 🙂
            </p>
          )}
          {user?.incomeRange === "잘 모르겠음" && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              이 정책들은 소득 기준이 있으니 신청 전 확인하세요.
            </p>
          )}

          {total === 0 ? (
            <p className="mt-10 text-center text-sm text-gray-500">
              음... 지금은 딱히 없네요.
              <br />
              다음에 또 놓칠 뻔한 거 생기면 알려드릴게요
            </p>
          ) : (
            <>
              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="정책 이름으로 찾아보기"
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <div className="mt-4 min-w-0">
                <CategoryPills
                  counts={counts}
                  total={total}
                  selected={selectedCategory}
                  onSelect={setSelectedCategory}
                />
              </div>

              <div className="mt-5 flex flex-col gap-8">
                {trimmedQuery ? (
                  searchedPolicies.length === 0 ? (
                    <p className="mt-6 text-center text-sm text-gray-500">
                      어? 그런 이름의 정책은 없나 봐요
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {searchedPolicies.map((p) => (
                        <PolicyCard key={p.id} policy={p} />
                      ))}
                    </div>
                  )
                ) : selectedCategory === "전체" ? (
                  <>
                    {CATEGORY_ORDER.filter((cat) =>
                      topPolicies.some((p) => p.category === cat)
                    ).map((cat) => (
                      <CategorySection
                        key={cat}
                        category={cat}
                        policies={topPolicies.filter((p) => p.category === cat)}
                        totalCount={counts[cat]}
                      />
                    ))}
                    {total > MAX_TOTAL_PREVIEW && (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-px flex-1 bg-gray-200" />
                          <span className="whitespace-nowrap text-xs text-gray-400">
                            여기까지가 가장 인기있는 정책이에요
                          </span>
                          <div className="h-px flex-1 bg-gray-200" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">
                            가장 많이 찾아본 정책 30개를 보여드렸어요! 더 궁금하면 위에서 관심있는
                            카테고리를 눌러보세요 👆
                          </p>
                          <div className="mt-3 flex flex-wrap justify-center gap-2">
                            {CATEGORY_ORDER.filter((cat) => counts[cat] > 0).map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                              >
                                {cat} {counts[cat]}개 →
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <CategorySection
                    key={selectedCategory}
                    category={selectedCategory}
                    policies={categoryFilteredPolicies}
                    totalCount={categoryFilteredPolicies.length}
                  />
                )}
              </div>
            </>
          )}
        </>
      )}

      <p className="mt-10 text-center text-xs text-gray-400">
        지금까지 {usageCount !== null ? `${usageCount.toLocaleString()}명이` : "많은 분들이"} 하마터면
        놓칠 뻔한 걸 잡았어요
      </p>
    </main>
  );
}