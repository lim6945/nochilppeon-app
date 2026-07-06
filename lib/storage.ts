import type { UserInfo } from "./types";

const SAVED_INFO_KEY = "nochilppeon:savedInfo";
const CURRENT_QUERY_KEY = "nochilppeon:currentQuery";

// "내 정보 저장하기" 체크 시에만 사용하는 영구 저장소
export function saveUserInfo(info: UserInfo) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVED_INFO_KEY, JSON.stringify(info));
}

export function loadSavedUserInfo(): UserInfo | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SAVED_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}

export function clearSavedUserInfo() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SAVED_INFO_KEY);
}

// 입력 화면 -> 결과 화면으로 이번 조회 정보를 넘기기 위한 임시 저장소
// (저장 여부 체크박스와 무관하게 항상 사용, 브라우저 탭을 닫으면 사라짐)
export function setCurrentQuery(info: UserInfo) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CURRENT_QUERY_KEY, JSON.stringify(info));
}

export function getCurrentQuery(): UserInfo | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(CURRENT_QUERY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}
