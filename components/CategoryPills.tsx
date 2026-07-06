"use client";

import { useRef } from "react";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/categories";
import type { CategoryName } from "@/lib/types";

interface Props {
  counts: Record<CategoryName, number>;
  total: number;
  selected: CategoryName | "전체";
  onSelect: (value: CategoryName | "전체") => void;
}

export default function CategoryPills({ counts, total, selected, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ isDown: false, dragged: false, startX: 0, startScrollLeft: 0 });

  const categories: { name: CategoryName | "전체"; count: number }[] = [
    { name: "전체", count: total },
    ...CATEGORY_ORDER.filter((cat) => counts[cat] > 0).map((cat) => ({
      name: cat,
      count: counts[cat],
    })),
  ];

  // 세로 휠 스크롤만으로는 가로 오버플로우 컨테이너가 움직이지 않는 브라우저가 많아
  // deltaY를 가로 스크롤로 변환해준다 (트랙패드 가로 스와이프는 원래도 잘 동작함).
  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
    }
  }

  // 스크롤바를 드래그하지 않아도 pill 영역을 직접 마우스로 클릭+드래그해서 스크롤할 수 있게 한다.
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = { isDown: true, dragged: false, startX: e.clientX, startScrollLeft: el.scrollLeft };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const state = dragRef.current;
    const el = scrollRef.current;
    if (!state.isDown || !el) return;
    const delta = e.clientX - state.startX;
    if (Math.abs(delta) > 4) state.dragged = true;
    el.scrollLeft = state.startScrollLeft - delta;
  }

  function endDrag() {
    dragRef.current.isDown = false;
  }

  // 드래그 동작 도중에 손을 뗐을 때 버튼의 onClick(카테고리 전환)이 실수로 발동하지 않도록 막는다.
  function handleClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (dragRef.current.dragged) {
      e.stopPropagation();
      e.preventDefault();
      dragRef.current.dragged = false;
    }
  }

  return (
    <div
      ref={scrollRef}
      className="category-scroll flex cursor-grab select-none gap-2 overflow-x-auto pb-2 active:cursor-grabbing"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onClickCapture={handleClickCapture}
    >
      {categories.map((cat) => {
        const isActive = selected === cat.name;
        const activeClass =
          cat.name === "전체" ? "bg-gray-900 text-white" : CATEGORY_META[cat.name].pillActive;
        return (
          <button
            key={cat.name}
            type="button"
            onClick={() => onSelect(cat.name)}
            className={`flex-shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
              isActive ? activeClass : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat.name} {cat.count}
          </button>
        );
      })}
    </div>
  );
}
