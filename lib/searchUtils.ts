function normalizeForSearch(text: string): string {
  return text.replace(/[·\s]/g, "");
}

/**
 * "근로장려금"으로 검색해도 실제 정책명 "근로·자녀장려금"(가운데 다른 단어가 낀 경우)을
 * 찾을 수 있도록, 완전 부분일치를 먼저 시도하고 실패하면 문자 순서만 같은
 * subsequence 매치로 한 번 더 시도한다.
 */
export function matchesSearchQuery(query: string, target: string): boolean {
  const q = normalizeForSearch(query);
  const t = normalizeForSearch(target);
  if (q.length === 0) return true;
  if (t.includes(q)) return true;

  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}
