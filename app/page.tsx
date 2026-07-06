"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import HouseholdMultiSelect from "@/components/HouseholdMultiSelect";
import {
  EMPLOYMENT_STATUSES,
  INCOME_RANGES,
  REGIONS,
  type EmploymentStatus,
  type HouseholdType,
  type IncomeRange,
  type Region,
  type UserInfo,
} from "@/lib/types";
import { getCurrentQuery, loadSavedUserInfo, saveUserInfo, setCurrentQuery } from "@/lib/storage";

export default function InputPage() {
  const router = useRouter();
  const [age, setAge] = useState("");
  const [region, setRegion] = useState<Region | "">("");
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus | "">("");
  const [householdTypes, setHouseholdTypes] = useState<HouseholdType[]>(["해당없음"]);
  const [incomeRange, setIncomeRange] = useState<IncomeRange | "">("");
  const [saveInfo, setSaveInfo] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = loadSavedUserInfo() ?? getCurrentQuery();
    if (!existing) return;
    setAge(String(existing.age));
    setRegion(existing.region);
    setEmploymentStatus(existing.employmentStatus);
    setHouseholdTypes(existing.householdTypes);
    setIncomeRange(existing.incomeRange);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const ageNum = Number(age);
    if (!age || Number.isNaN(ageNum) || ageNum < 19 || ageNum > 100) {
      setError("나이는 19세부터 100세 사이로 입력해주세요.");
      return;
    }
    if (!region) {
      setError("거주 지역을 선택해주세요.");
      return;
    }
    if (!employmentStatus) {
      setError("현재 상태를 선택해주세요.");
      return;
    }
    if (!incomeRange) {
      setError("소득 구간을 선택해주세요.");
      return;
    }

    const info: UserInfo = {
      age: ageNum,
      region,
      employmentStatus,
      householdTypes,
      incomeRange,
    };

    setCurrentQuery(info);
    if (saveInfo) {
      saveUserInfo(info);
    }

    router.push("/result");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      <Logo />
      <p className="mt-3 text-lg font-semibold text-gray-800">어? 이거 나 놓칠 뻔했잖아?!</p>
      <p className="mt-1 text-sm text-gray-500">
        간단한 정보만 입력하면 나한테 맞는 지원정책을 바로 찾아드려요.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-800">나이</label>
          <input
            type="number"
            inputMode="numeric"
            min={19}
            max={100}
            placeholder="예: 28"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-800">거주 지역</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value as Region)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          >
            <option value="" disabled>
              지역을 선택해주세요
            </option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-800">현재 상태</label>
          <select
            value={employmentStatus}
            onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatus)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          >
            <option value="" disabled>
              현재 상태를 선택해주세요
            </option>
            {EMPLOYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-800">
            가구 상황 (중복 선택 가능)
          </label>
          <HouseholdMultiSelect value={householdTypes} onChange={setHouseholdTypes} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-800">
            한 달에 대충 얼마 벌어? (몰라도 괜찮아요 &gt;,&lt;)
          </label>
          <select
            value={incomeRange}
            onChange={(e) => setIncomeRange(e.target.value as IncomeRange)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          >
            <option value="" disabled>
              소득 구간을 선택해주세요
            </option>
            {INCOME_RANGES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={saveInfo}
            onChange={(e) => setSaveInfo(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
          />
          내 정보 저장하기 — 다음엔 또 안 물어볼게요
        </label>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          className="mt-2 rounded-xl bg-amber-600 px-4 py-3.5 text-base font-bold text-white shadow-sm transition-all hover:scale-105 hover:bg-amber-700"
        >
          내 돈 어디 숨었나 찾아보기
        </button>
      </form>
    </main>
  );
}
