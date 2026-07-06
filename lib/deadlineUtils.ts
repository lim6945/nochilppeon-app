/**
 * `신청기한` 텍스트에서 "YYYY.M.D~YYYY.M.D" 처럼 종료일에도 4자리 연도가 명시된
 * 구체적인 기간만 신뢰해서 파싱한다. "5.1.~5.31."처럼 연도가 없는 매년 반복 기간이나
 * "공고에 따름" 같은 표현은 마감 여부를 확정할 수 없으므로 건드리지 않는다(포함 유지).
 */
const DATED_RANGE_PATTERN =
  /(\d{4})\s*[.\-]\s*(\d{1,2})\s*[.\-]\s*(\d{1,2})\s*\.?\s*[~\-]\s*(\d{4})\s*[.\-]\s*(\d{1,2})\s*[.\-]\s*(\d{1,2})\s*\.?/;

function toDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return new Date(year, month - 1, day, 23, 59, 59);
}

/**
 * 신청기한이 지났는지 여부를 최대한 보수적으로 판단한다.
 * "상시신청"이거나 구체적인(연도 포함) 종료일을 확정할 수 없으면 항상 false(유지)를 반환한다.
 */
export function isApplicationDeadlinePassed(
  applicationPeriod: string | undefined,
  now: Date = new Date()
): boolean {
  if (!applicationPeriod) return false;
  if (applicationPeriod.includes("상시")) return false;

  const match = applicationPeriod.match(DATED_RANGE_PATTERN);
  if (!match) return false;

  const endDate = toDate(Number(match[4]), Number(match[5]), Number(match[6]));
  if (!endDate) return false;

  return endDate.getTime() < now.getTime();
}
