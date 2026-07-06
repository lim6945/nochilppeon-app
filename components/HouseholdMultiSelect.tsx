"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { HOUSEHOLD_TYPES, type HouseholdType } from "@/lib/types";

interface Props {
  value: HouseholdType[];
  onChange: (value: HouseholdType[]) => void;
}

export default function HouseholdMultiSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggle(option: HouseholdType) {
    if (option === "해당없음") {
      onChange(["해당없음"]);
      return;
    }
    const withoutNone = value.filter((v) => v !== "해당없음");
    if (withoutNone.includes(option)) {
      const next = withoutNone.filter((v) => v !== option);
      onChange(next.length === 0 ? ["해당없음"] : next);
    } else {
      onChange([...withoutNone, option]);
    }
  }

  const label =
    value.length === 0 || (value.length === 1 && value[0] === "해당없음")
      ? "해당없음"
      : `${value.length}개 선택됨`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-sm text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
      >
        <span>{label}</span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
          {HOUSEHOLD_TYPES.map((option) => {
            const checked = value.includes(option);
            return (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-800 hover:bg-amber-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(option)}
                  className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                {option}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
