import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

/** 입력 화면의 모든 드롭다운(select, 커스텀 다중선택)이 공유하는 높이 클래스 */
export const FIELD_HEIGHT_CLASS = "h-12";

/**
 * 네이티브 select의 화살표는 브라우저마다 위치가 달라 정렬이 안 맞으므로, 화살표를 직접
 * 숨기고(appearance-none) 동일한 높이 + 절대위치(top:50%, translateY(-50%)) 아이콘으로 통일한다.
 */
export default function SelectField({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full appearance-none rounded-xl border border-gray-300 bg-white ${FIELD_HEIGHT_CLASS} pl-4 pr-10 text-sm text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 ${className ?? ""}`}
      />
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
    </div>
  );
}
