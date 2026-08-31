import { TeamMember } from "../types";

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "member-1",
    name: "김민지",
    role: "PM & 총괄",
    avatar: "민지",
    colorHex: "#6366F1", // Indigo
    bgClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/40",
    textClass: "text-indigo-400",
    borderClass: "border-indigo-500",
    badgeClass: "bg-indigo-500 text-white shadow-indigo-500/30",
    statusText: "프로젝트 진행 관리 중",
  },
  {
    id: "member-2",
    name: "박지훈",
    role: "서비스 기획",
    avatar: "지훈",
    colorHex: "#10B981", // Emerald
    bgClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500",
    badgeClass: "bg-emerald-500 text-white shadow-emerald-500/30",
    statusText: "신규 기능 PRD 작성",
  },
  {
    id: "member-3",
    name: "이수아",
    role: "UI/UX 디자인",
    avatar: "수아",
    colorHex: "#F43F5E", // Rose
    bgClass: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    textClass: "text-rose-400",
    borderClass: "border-rose-500",
    badgeClass: "bg-rose-500 text-white shadow-rose-500/30",
    statusText: "디자인 시스템 고도화",
  },
  {
    id: "member-4",
    name: "정도윤",
    role: "풀스택 개발",
    avatar: "도윤",
    colorHex: "#F59E0B", // Amber
    bgClass: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    textClass: "text-amber-400",
    borderClass: "border-amber-500",
    badgeClass: "bg-amber-500 text-white shadow-amber-500/30",
    statusText: "API 및 DB 실시간 동기화",
  },
  {
    id: "member-5",
    name: "최서연",
    role: "마케팅 & 운영",
    avatar: "서연",
    colorHex: "#A855F7", // Purple
    bgClass: "bg-purple-500/15 text-purple-300 border-purple-500/40",
    textClass: "text-purple-400",
    borderClass: "border-purple-500",
    badgeClass: "bg-purple-500 text-white shadow-purple-500/30",
    statusText: "출시 캠페인 준비",
  },
];

export const DEFAULT_CALENDAR_ID = "team-sprint-shared-2026";
export const DEFAULT_CALENDAR_NAME = "우리 5인 팀 스프린트 캘린더";
