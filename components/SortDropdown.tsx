"use client";

import { ChevronDown } from "lucide-react";
import { SORT_OPTIONS, type SortOption } from "@/lib/sortUtils";

export default function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="appearance-none rounded-lg border border-gray-200 bg-white py-1.5 pl-3 pr-7 text-xs font-semibold text-gray-600 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
    </div>
  );
}
