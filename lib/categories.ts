import {
  Home,
  PiggyBank,
  Briefcase,
  Rocket,
  Heart,
  Baby,
  Sunset,
  GraduationCap,
  HandHeart,
  type LucideIcon,
} from "lucide-react";
import type { CategoryName } from "./types";

interface CategoryMeta {
  name: CategoryName;
  icon: LucideIcon;
  badge: string; // badge bg + text classes
  pillActive: string; // active pill bg + text classes
  iconBg: string; // section icon circle bg
  iconText: string;
}

export const CATEGORY_META: Record<CategoryName, CategoryMeta> = {
  주거: {
    name: "주거",
    icon: Home,
    badge: "bg-blue-100 text-blue-700",
    pillActive: "bg-blue-600 text-white",
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
  },
  "금융·자산형성": {
    name: "금융·자산형성",
    icon: PiggyBank,
    badge: "bg-teal-100 text-teal-700",
    pillActive: "bg-teal-600 text-white",
    iconBg: "bg-teal-100",
    iconText: "text-teal-600",
  },
  취업: {
    name: "취업",
    icon: Briefcase,
    badge: "bg-amber-100 text-amber-700",
    pillActive: "bg-amber-600 text-white",
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
  },
  창업: {
    name: "창업",
    icon: Rocket,
    badge: "bg-purple-100 text-purple-700",
    pillActive: "bg-purple-600 text-white",
    iconBg: "bg-purple-100",
    iconText: "text-purple-600",
  },
  "신혼부부·결혼": {
    name: "신혼부부·결혼",
    icon: Heart,
    badge: "bg-pink-100 text-pink-700",
    pillActive: "bg-pink-600 text-white",
    iconBg: "bg-pink-100",
    iconText: "text-pink-600",
  },
  "임신·출산·육아": {
    name: "임신·출산·육아",
    icon: Baby,
    badge: "bg-rose-100 text-rose-700",
    pillActive: "bg-rose-500 text-white",
    iconBg: "bg-rose-100",
    iconText: "text-rose-500",
  },
  "어르신·노후": {
    name: "어르신·노후",
    icon: Sunset,
    badge: "bg-green-100 text-green-700",
    pillActive: "bg-green-600 text-white",
    iconBg: "bg-green-100",
    iconText: "text-green-600",
  },
  교육: {
    name: "교육",
    icon: GraduationCap,
    badge: "bg-red-100 text-red-700",
    pillActive: "bg-red-600 text-white",
    iconBg: "bg-red-100",
    iconText: "text-red-600",
  },
  "생활·복지": {
    name: "생활·복지",
    icon: HandHeart,
    badge: "bg-gray-200 text-gray-700",
    pillActive: "bg-gray-600 text-white",
    iconBg: "bg-gray-200",
    iconText: "text-gray-600",
  },
};

export const CATEGORY_ORDER: CategoryName[] = [
  "주거",
  "금융·자산형성",
  "취업",
  "창업",
  "신혼부부·결혼",
  "임신·출산·육아",
  "어르신·노후",
  "교육",
  "생활·복지",
];
