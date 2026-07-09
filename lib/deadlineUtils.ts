/**
 * `신청기한` 텍스트에서 신청 기간을 최대한 유연하게 추출한다. 실제 API 표본(10,966건)을
 * 조사해 보면 아래처럼 형식이 매우 다양하다:
 *   - "상시신청", "연중", "수시" 등 상시성 문구 → 항상 유지, "상시지원"으로 표시
 *   - "2025.1.1.~2025.12.10." (양쪽 다 연도 포함, 구분자 ".")
 *   - "2025-3.~2025.11." (구분자가 "-"/"." 혼용, 일(day) 없이 연-월만)
 *   - "2025.10.13.(월) ~ 2025.11.30.(일)" (날짜 사이에 요일이 괄호로 끼어있음)
 *   - "'26. 3. 18. ~ 4. 6." (2자리 연도 + 작은따옴표, 종료일에는 연도 생략)
 *   - "2026. 2. 2.~11. 30." (종료일에 연도 생략, 시작 연도를 그대로 적용)
 *   - "공고에 따름", "사업별 상이" 등 날짜 자체가 없는 설명 → 파싱 불가, 유지
 * 파싱이 안 되는 값은 안전하게 "포함" 처리하되, 어떤 값이 파싱되지 않는지 콘솔에 남긴다.
 */

const ALWAYS_OPEN_KEYWORDS = ["상시", "연중", "수시"];

// 날짜와 "~" 사이에 끼는 잡음(요일 괄호, 마침표, 공백 등)을 허용
const JUNK = "[^0-9~]{0,15}";
const JUNK_AFTER_TILDE = "[^0-9]{0,10}";
const YEAR = "(?:\\d{4}|'\\d{2})";
const SEP = "[.\\-/]\\s*";
const MONTH_DAY = "(\\d{1,2})(?:" + SEP + "(\\d{1,2}))?";

// 패턴 A: 시작·종료 양쪽 모두 연도가 명시된 경우
const RANGE_WITH_BOTH_YEARS = new RegExp(
  `(${YEAR})${SEP}${MONTH_DAY}${JUNK}~${JUNK_AFTER_TILDE}(${YEAR})${SEP}${MONTH_DAY}`,
  "g"
);

// 패턴 B: 종료일에 연도가 생략된 경우 (예: "2026. 2. 2.~11. 30.", "2025.5.~12.") → 시작 연도를 재사용.
// 종료일의 일(day)도 없을 수 있어 선택적으로 둔다.
const RANGE_WITH_OMITTED_END_YEAR = new RegExp(
  `(${YEAR})${SEP}${MONTH_DAY}${JUNK}~${JUNK_AFTER_TILDE}(\\d{1,2})(?:${SEP}(\\d{1,2}))?`,
  "g"
);

function parseYear(raw: string): number {
  if (raw.startsWith("'")) return 2000 + Number(raw.slice(1));
  return Number(raw);
}

function toDate(year: number, month: number, day: number, endOfDay: boolean): Date | null {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return endOfDay ? new Date(year, month - 1, day, 23, 59, 59) : new Date(year, month - 1, day);
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

interface DateRange {
  start: Date;
  end: Date;
}

function collectRanges(text: string): DateRange[] {
  const ranges: DateRange[] = [];

  for (const m of text.matchAll(RANGE_WITH_BOTH_YEARS)) {
    // m: [전체, y1, m1, d1, y2, m2, d2]
    const startYear = parseYear(m[1]);
    const startMonth = Number(m[2]);
    const startDay = m[3] ? Number(m[3]) : 1;
    const endYear = parseYear(m[4]);
    const endMonth = Number(m[5]);
    // 종료일에 일(day)이 생략되면(연-월만 있는 경우) 그 달 마지막 날까지로 보수적으로 간주
    const endDay = m[6] ? Number(m[6]) : lastDayOfMonth(endYear, endMonth);

    const start = toDate(startYear, startMonth, startDay, false);
    const end = toDate(endYear, endMonth, endDay, true);
    if (start && end) ranges.push({ start, end });
  }

  for (const m of text.matchAll(RANGE_WITH_OMITTED_END_YEAR)) {
    // m: [전체, y1, m1, d1, m2(bare), d2(bare, optional)] — 종료일 연도는 시작 연도(y1)를 재사용
    const startYear = parseYear(m[1]);
    const startMonth = Number(m[2]);
    const startDay = m[3] ? Number(m[3]) : 1;
    const endMonth = Number(m[4]);
    const endDay = m[5] ? Number(m[5]) : lastDayOfMonth(startYear, endMonth);

    const start = toDate(startYear, startMonth, startDay, false);
    const end = toDate(startYear, endMonth, endDay, true);
    if (start && end) ranges.push({ start, end });
  }

  return ranges;
}

const loggedParseFailures = new Set<string>();

function logParseFailureOnce(applicationPeriod: string) {
  if (loggedParseFailures.has(applicationPeriod)) return;
  loggedParseFailures.add(applicationPeriod);
  console.warn(`[deadlineUtils] 신청기한 파싱 실패(포함 처리): ${JSON.stringify(applicationPeriod)}`);
}

export interface ApplicationPeriodInfo {
  /** always: 상시 문구, dated: 구체적 기간 파싱됨, unknown: 파싱 불가 */
  kind: "always" | "dated" | "unknown";
  /** 화면에 그대로 보여줄 라벨 */
  label: string;
  /** kind === "dated"일 때만 존재. 오늘 기준 종료일까지 남은 일수(0=오늘 마감, 음수=이미 지남) */
  daysUntilEnd?: number;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function daysBetween(from: Date, to: Date): number {
  const startOfFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const startOfTo = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((startOfTo.getTime() - startOfFrom.getTime()) / (1000 * 60 * 60 * 24));
}

function parseSingleSegmentRange(segment: string): DateRange | null {
  const ranges = collectRanges(segment);
  if (ranges.length === 0) return null;
  // 한 구간 안에 매치가 여러 개 나오면(드묾) 가장 늦은 종료일을 대표로 삼는다.
  return ranges.reduce((a, b) => (b.end.getTime() > a.end.getTime() ? b : a));
}

/**
 * `신청기한` 원문을 파싱해서 화면에 보여줄 라벨과 마감 임박 여부 판단에 쓸 정보를 만든다.
 * - "상시"/"연중"/"수시" → { kind: "always", label: "상시지원" }
 * - "/"로 구분된 다회차(복수 접수기간) 텍스트는 각 구간을 순서대로 파싱해서, 오늘 기준
 *   아직 종료되지 않은 첫 번째 회차를 "N차 모집: 시작일 ~ 종료일"로 대표 표시한다.
 *   모든 회차가 이미 종료됐다면 마지막 회차(과거)를 대표로 삼아 daysUntilEnd가 음수가 되게 해서
 *   isApplicationDeadlinePassed가 자연스럽게 제외 판정을 내리게 한다.
 * - "/"가 없는 일반 텍스트는 기존처럼, 여러 구간이 매치되면 가장 늦은 종료일을 대표로 삼는다.
 * - 파싱 자체가 안 되면 { kind: "unknown", label: "지원기간 별도 확인 필요" } (콘솔에 1회 경고)
 */
export function describeApplicationPeriod(
  applicationPeriod: string | undefined,
  now: Date = new Date()
): ApplicationPeriodInfo {
  if (!applicationPeriod) {
    return { kind: "unknown", label: "지원기간 별도 확인 필요" };
  }
  if (ALWAYS_OPEN_KEYWORDS.some((kw) => applicationPeriod.includes(kw))) {
    return { kind: "always", label: "상시지원" };
  }

  if (applicationPeriod.includes("/")) {
    const segments = applicationPeriod.split("/");
    const rounds: { index: number; range: DateRange }[] = [];
    segments.forEach((segment, index) => {
      const range = parseSingleSegmentRange(segment);
      if (range) rounds.push({ index, range });
    });

    if (rounds.length === 0) {
      logParseFailureOnce(applicationPeriod);
      return { kind: "unknown", label: "지원기간 별도 확인 필요" };
    }

    // 오늘 기준 아직 종료되지 않은 첫 번째 회차. 전부 지났다면 마지막 회차를 그대로 대표로 사용.
    const current = rounds.find((r) => daysBetween(now, r.range.end) >= 0);
    const chosen = current ?? rounds[rounds.length - 1];

    return {
      kind: "dated",
      label: `${chosen.index + 1}차 모집: ${formatDate(chosen.range.start)} ~ ${formatDate(chosen.range.end)}`,
      daysUntilEnd: daysBetween(now, chosen.range.end),
    };
  }

  const ranges = collectRanges(applicationPeriod);
  if (ranges.length === 0) {
    logParseFailureOnce(applicationPeriod);
    return { kind: "unknown", label: "지원기간 별도 확인 필요" };
  }

  // 여러 회차/구간이 있을 수 있으므로, 그중 가장 늦은 종료일을 가진 구간을 대표로 삼는다.
  const latest = ranges.reduce((a, b) => (b.end.getTime() > a.end.getTime() ? b : a));

  return {
    kind: "dated",
    label: `${formatDate(latest.start)} ~ ${formatDate(latest.end)}`,
    daysUntilEnd: daysBetween(now, latest.end),
  };
}

/**
 * 신청기한이 지났는지 여부를 최대한 보수적으로 판단한다. describeApplicationPeriod와 동일한
 * 파싱 로직을 재사용하므로 화면 표시와 필터링 판단이 항상 일치한다.
 */
export function isApplicationDeadlinePassed(
  applicationPeriod: string | undefined,
  now: Date = new Date()
): boolean {
  const info = describeApplicationPeriod(applicationPeriod, now);
  if (info.kind !== "dated" || info.daysUntilEnd === undefined) return false;
  return info.daysUntilEnd < 0;
}
