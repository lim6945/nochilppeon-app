import { ArrowUpRight, Calendar, Siren } from "lucide-react";
import type { Policy } from "@/lib/types";

export default function PolicyCard({ policy }: { policy: Policy }) {
  const { applicationPeriod } = policy;
  const isUrgent =
    applicationPeriod.kind === "dated" &&
    applicationPeriod.daysUntilEnd !== undefined &&
    applicationPeriod.daysUntilEnd >= 0 &&
    applicationPeriod.daysUntilEnd <= 7;

  return (
    <div className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      {policy.needsCheck && (
        <span className="absolute right-4 top-4 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
          조건 확인 필요
        </span>
      )}
      <h3 className="pr-24 text-base font-bold text-gray-900">{policy.name}</h3>
      <p className="mt-1 text-sm text-gray-600">{policy.summary}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="h-3.5 w-3.5" />
          {applicationPeriod.label}
        </span>
        {isUrgent && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
            <Siren className="h-3.5 w-3.5" />
            마감임박! D-{applicationPeriod.daysUntilEnd}
          </span>
        )}
      </div>

      <a
        href={policy.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-amber-700"
      >
        신청 바로가기
        <ArrowUpRight className="h-4 w-4" />
      </a>
    </div>
  );
}
