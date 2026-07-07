"use client";

import { useState } from "react";
import { CATEGORY_META } from "@/lib/categories";
import type { CategoryName, Policy } from "@/lib/types";
import PolicyCard from "./PolicyCard";

const INITIAL_VISIBLE_COUNT = 5;
const LOAD_MORE_STEP = 10;

export default function CategorySection({
  category,
  policies,
  totalCount,
}: {
  category: CategoryName;
  /** 실제 카드로 렌더링할 후보 목록 (이미 조회수 내림차순 정렬됨). "전체" 탭에서는 상위 30개로
   * 미리 추려진 부분집합일 수 있고, 단일 카테고리 선택 시에는 해당 카테고리 전체 목록이다. */
  policies: Policy[];
  /** 헤더에 표시할 해당 카테고리의 전체 매칭 개수 (policies.length와 다를 수 있음) */
  totalCount: number;
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;

  const visible = policies.slice(0, visibleCount);
  // 버튼에 표시할 숫자는 "이번 클릭으로 늘어나는 개수"가 아니라 "전체 중 아직 안 보여준 개수"다.
  const remaining = policies.length - visibleCount;

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${meta.iconBg}`}>
          <Icon className={`h-4 w-4 ${meta.iconText}`} />
        </span>
        <h2 className="text-base font-bold text-gray-900">
          {category} ({totalCount})
        </h2>
      </div>
      <div className="flex flex-col gap-3">
        {visible.map((p) => (
          <PolicyCard key={p.id} policy={p} />
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + LOAD_MORE_STEP)}
            className="rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            더보기 ({remaining}개 더 있어요)
          </button>
        )}
      </div>
    </section>
  );
}
