import React, { useState } from "react";
import { Users, Wifi, Copy, Check, Settings, History, UserCheck, ShieldCheck, ChevronDown } from "lucide-react";
import { TeamMember } from "../types";

interface TeamMembersBarProps {
  members: TeamMember[];
  currentMemberId: string;
  onSelectCurrentMember: (memberId: string) => void;
  selectedFilterMemberId: string | "all" | "mine";
  onSelectFilterMember: (filter: string | "all" | "mine") => void;
  roomCode: string;
  isSyncing: boolean;
  onOpenSettings: () => void;
  onOpenActivityLogs: () => void;
  activityCount: number;
  trashCount?: number;
  revisionsCount?: number;
}

export const TeamMembersBar: React.FC<TeamMembersBarProps> = ({
  members,
  currentMemberId,
  onSelectCurrentMember,
  selectedFilterMemberId,
  onSelectFilterMember,
  roomCode,
  isSyncing,
  onOpenSettings,
  onOpenActivityLogs,
  activityCount,
  trashCount = 0,
  revisionsCount = 0,
}) => {
  const [copied, setCopied] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const currentMember = members.find((m) => m.id === currentMemberId) || members[0];

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomCode);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#141417] border-b border-[#27272A] px-4 sm:px-6 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        
        {/* Left: 5 Team Members Presence & Current Profile */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Current User Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowMemberDropdown(!showMemberDropdown)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#1F1F23] border border-[#3F3F46] hover:border-indigo-500/60 text-xs font-semibold text-white transition-all shadow-xs"
              title="내 프로필 전환하기"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs"
                style={{ backgroundColor: currentMember.colorHex }}
              >
                {currentMember.name.slice(0, 1)}
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-zinc-400 font-normal">현재 사용자:</span>
                <span className="text-white font-bold">{currentMember.name}</span>
                <span className="text-[10px] text-zinc-400">({currentMember.role})</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {/* Dropdown for Switching Current Active Member */}
            {showMemberDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMemberDropdown(false)}
                />
                <div className="absolute left-0 mt-1.5 w-64 bg-[#18181B] border border-[#3F3F46] rounded-xl shadow-2xl z-50 p-2 text-xs divide-y divide-[#27272A]">
                  <div className="px-2.5 py-1.5 text-zinc-400 font-medium text-[11px] flex items-center justify-between">
                    <span>5인 팀원 중 내 프로필 선택</span>
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="py-1 space-y-1">
                    {members.map((member) => {
                      const isCurrent = member.id === currentMemberId;
                      return (
                        <button
                          key={member.id}
                          onClick={() => {
                            onSelectCurrentMember(member.id);
                            setShowMemberDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                            isCurrent
                              ? "bg-indigo-950/60 border border-indigo-500/40 text-white"
                              : "hover:bg-[#27272A] text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs shrink-0"
                              style={{ backgroundColor: member.colorHex }}
                            >
                              {member.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-semibold leading-tight">{member.name}</div>
                              <div className="text-[10px] text-zinc-400">{member.role}</div>
                            </div>
                          </div>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-600 text-white font-bold">
                              선택됨
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-1.5 px-2 text-[10px] text-zinc-500">
                    선택된 사용자의 이름으로 새 일정이 등록되고 활동 로그가 기록됩니다.
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 5 Members Filter Buttons Bar */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
            <span className="text-zinc-500 text-[11px] hidden sm:inline-block mr-1 font-medium">
              일정 필터:
            </span>

            {/* All */}
            <button
              onClick={() => onSelectFilterMember("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedFilterMemberId === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-[#18181B] text-zinc-400 hover:text-zinc-200 border border-[#27272A]"
              }`}
            >
              전체 5명
            </button>

            {/* Mine */}
            <button
              onClick={() => onSelectFilterMember("mine")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                selectedFilterMemberId === "mine"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-[#18181B] text-zinc-400 hover:text-zinc-200 border border-[#27272A]"
              }`}
            >
              <UserCheck className="w-3 h-3" />
              <span>내 담당만</span>
            </button>

            <div className="h-4 w-px bg-[#27272A] mx-1" />

            {/* Individual 5 Members */}
            {members.map((m) => {
              const isSelected = selectedFilterMemberId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectFilterMember(isSelected ? "all" : m.id)}
                  title={`${m.name} (${m.role}): ${m.statusText || ""}`}
                  className={`inline-flex items-center space-x-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-[#1F1F23] ring-2 ring-indigo-500 text-white shadow-xs"
                      : "bg-[#18181B] text-zinc-300 hover:bg-[#1F1F23] border border-[#27272A]"
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: m.colorHex }}
                  >
                    {m.name.slice(0, 1)}
                  </div>
                  <span className="text-[11px]">{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Cloud Sync, Room Link & Actions */}
        <div className="flex items-center justify-between lg:justify-end gap-2.5 shrink-0 text-xs">
          
          {/* Cloud Sync Status */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#18181B] border border-[#27272A] text-zinc-400">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  isSyncing ? "bg-amber-400 opacity-75" : "bg-emerald-400 opacity-75"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isSyncing ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
            </span>
            <span className="text-[11px] font-medium text-zinc-300">
              {isSyncing ? "실시간 동기화 중..." : "5인 실시간 공유 중"}
            </span>
          </div>

          {/* Share Link Button */}
          <button
            onClick={handleCopyLink}
            title="다른 4명의 팀원에게 전달할 공유 링크 복사"
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#18181B] hover:bg-[#1F1F23] border border-[#3F3F46] text-zinc-200 font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold text-[11px]">링크 복사됨!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[11px]">팀 공유 링크</span>
              </>
            )}
          </button>

          {/* Activity Logs & Recovery Button */}
          <button
            onClick={onOpenActivityLogs}
            title="실시간 변경 활동 및 삭제/수정 이력 복구 센터 열기"
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              trashCount > 0
                ? "bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/60"
                : "bg-[#18181B] hover:bg-[#1F1F23] border-[#27272A] text-zinc-300 hover:text-white"
            }`}
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>이력 및 복구</span>
            {trashCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                휴지통 {trashCount}
              </span>
            ) : activityCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-600/80 text-white text-[10px] font-bold">
                {activityCount}
              </span>
            ) : null}
          </button>

          {/* Team Settings Button */}
          <button
            onClick={onOpenSettings}
            title="5인 팀원 정보 및 공유 캘린더 방 설정"
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-[#18181B] hover:bg-[#1F1F23] border border-[#27272A] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

        </div>

      </div>
    </div>
  );
};
