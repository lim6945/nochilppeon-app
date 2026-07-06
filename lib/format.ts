import { shortRegionName } from "./regionUtils";
import type { UserInfo } from "./types";

export function formatInfoChipLabel(info: UserInfo): string {
  return `${info.age}세·${shortRegionName(info.region)}·${info.employmentStatus}`;
}
