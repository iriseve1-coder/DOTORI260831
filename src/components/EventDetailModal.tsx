import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  MapPin,
  Tag,
  X,
  Trash2,
  Edit2,
  ExternalLink,
  Download,
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  Clock,
  History,
  Undo2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  PenTool,
} from "lucide-react";
import { CalendarEvent, CategoryType, PriorityType, TeamMember, EventRevision } from "../types";
import {
  getCategoryStyle,
  getPriorityBadge,
  formatDateKorean,
  formatFullDateTimeKorean,
  getGoogleCalendarUrl,
  downloadICSFile,
} from "../utils/calendarUtils";

interface EventDetailModalProps {
  event: CalendarEvent;
  members: TeamMember[];
  currentMemberId: string;
  revisions?: EventRevision[];
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  onToggleSelfAssign?: (eventId: string, assigned: boolean) => void;
  onRevertRevision?: (revision: EventRevision) => Promise<void> | void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  members,
  currentMemberId,
  revisions = [],
  onClose,
  onEdit,
  onDelete,
  onToggleSelfAssign,
  onRevertRevision,
}) => {
  const [showRevisions, setShowRevisions] = useState(false);
  const [revertingId, setRevertingId] = useState<string | null>(null);

  const catStyle = getCategoryStyle(event.category as CategoryType);
  const priStyle = getPriorityBadge(event.priority as PriorityType);
  const googleCalUrl = getGoogleCalendarUrl(event);

  const assignedMembers = members.filter((m) =>
    (event.assignedMembers || []).includes(m.id)
  );
  const isAssignedToMe = (event.assignedMembers || []).includes(currentMemberId);
  
  // Find creator details
  const creatorMember = members.find((m) => m.id === event.createdById);
  const creatorName = creatorMember?.name || event.createdByName || "팀원";
  const creatorRole = creatorMember?.role || "팀원";
  const creatorColor = creatorMember?.colorHex || "#6366F1";

  // Find updater details (if any)
  const updaterMember = event.updatedById ? members.find((m) => m.id === event.updatedById) : null;
  const updaterName = updaterMember?.name || event.updatedByName;
  const updaterRole = updaterMember?.role || "팀원";
  const updaterColor = updaterMember?.colorHex || "#06B6D4";

  // Filter revisions for this specific event
  const eventRevisions = revisions.filter((r) => r.eventId === event.id);

  const handleRevert = async (rev: EventRevision) => {
    if (!onRevertRevision) return;
    setRevertingId(rev.id);
    try {
      await onRevertRevision(rev);
      onClose();
    } finally {
      setRevertingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0F0F11] border border-[#27272A] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-zinc-200 max-h-[90vh] flex flex-col">
        
        {/* Top Accent bar */}
        <div className={`h-2 ${catStyle.dotColor}`} />

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          
          {/* Header Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${catStyle.badgeBg}`}>
                {event.category}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${priStyle.color}`}>
                우선순위: {priStyle.text}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-white leading-snug">
            {event.title}
          </h2>

          {/* 👤 Schedule Creator & Editor Info Card (스케줄 입력자 및 수정자 이력) */}
          <div className="bg-[#18181B] rounded-xl p-3.5 border border-[#27272A] space-y-2.5">
            <div className="flex items-center justify-between text-xs border-b border-[#27272A] pb-2">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-indigo-400" />
                스케줄 입력 및 수정 정보
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {event.createdAt ? formatFullDateTimeKorean(event.createdAt) : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Creator */}
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-[#09090B] border border-[#27272A]">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-2xs shrink-0"
                  style={{ backgroundColor: creatorColor }}
                >
                  {creatorName.slice(0, 1)}
                </div>
                <div className="truncate">
                  <div className="text-[10px] text-zinc-500 font-medium">최초 입력자 (작성자)</div>
                  <div className="font-bold text-white truncate flex items-center gap-1">
                    <span>{creatorName}</span>
                    <span className="text-[10px] text-zinc-400 font-normal">({creatorRole})</span>
                  </div>
                </div>
              </div>

              {/* Last Updater (if any) */}
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-[#09090B] border border-[#27272A]">
                {updaterName ? (
                  <>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-2xs shrink-0"
                      style={{ backgroundColor: updaterColor }}
                    >
                      {updaterName.slice(0, 1)}
                    </div>
                    <div className="truncate">
                      <div className="text-[10px] text-cyan-400 font-medium">최근 수정자</div>
                      <div className="font-bold text-white truncate flex items-center gap-1">
                        <span>{updaterName}</span>
                        <span className="text-[10px] text-zinc-400 font-normal">({updaterRole})</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-2 text-zinc-500 text-[11px] p-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>최초 등록 이후 수정 이력 없음</span>
                  </div>
                )}
              </div>
            </div>

            {/* Revision Accordion Toggle (if revisions exist) */}
            {eventRevisions.length > 0 && (
              <div className="pt-1">
                <button
                  onClick={() => setShowRevisions(!showRevisions)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-[#27272A]/60 hover:bg-[#27272A] text-xs text-cyan-300 font-medium transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-cyan-400" />
                    이 일정의 과거 수정 이력 ({eventRevisions.length}개 버전)
                  </span>
                  {showRevisions ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {showRevisions && (
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto custom-scrollbar pt-1">
                    {eventRevisions.map((rev) => {
                      const isRevReverting = revertingId === rev.id;
                      return (
                        <div
                          key={rev.id}
                          className="p-2.5 rounded-lg bg-[#09090B] border border-cyan-500/30 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-white">{rev.modifiedByName}</span>
                              <span className="text-zinc-500 font-normal">수정함</span>
                            </div>
                            <span className="text-zinc-500 font-mono text-[10px]">
                              {formatFullDateTimeKorean(rev.modifiedAt)}
                            </span>
                          </div>

                          <div className="text-[11px] text-zinc-300 bg-[#18181B] p-2 rounded border border-[#27272A]">
                            <div className="font-semibold text-zinc-200">"{rev.snapshot?.title}"</div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">
                              일시: {formatDateKorean(rev.snapshot?.startDate || "")}
                            </div>
                            {rev.changesSummary && (
                              <div className="text-[10px] text-cyan-300 mt-0.5 font-medium">
                                변경점: {rev.changesSummary}
                              </div>
                            )}
                          </div>

                          {onRevertRevision && (
                            <button
                              disabled={isRevReverting}
                              onClick={() => handleRevert(rev)}
                              className="w-full py-1.5 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 rounded-md text-xs font-semibold flex items-center justify-center space-x-1 border border-cyan-500/40 transition-colors"
                            >
                              <Undo2 className={`w-3 h-3 ${isRevReverting ? "animate-spin" : ""}`} />
                              <span>{isRevReverting ? "되돌리는 중..." : "이 버전의 데이터로 복원하기"}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5-Member Team Assignees Section */}
          <div className="bg-[#18181B] rounded-xl p-3.5 border border-[#27272A] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                담당 팀원 ({assignedMembers.length}명)
              </span>

              {onToggleSelfAssign && (
                <button
                  onClick={() => onToggleSelfAssign(event.id, !isAssignedToMe)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors flex items-center space-x-1 ${
                    isAssignedToMe
                      ? "bg-rose-950/50 text-rose-300 border border-rose-500/30 hover:bg-rose-900/60"
                      : "bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-900/80"
                  }`}
                >
                  {isAssignedToMe ? (
                    <>
                      <UserMinus className="w-3 h-3" />
                      <span>내 담당에서 제외</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3" />
                      <span>내 담당으로 추가</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {assignedMembers.length === 0 ? (
                <span className="text-xs text-zinc-500">배정된 담당자가 없습니다.</span>
              ) : (
                assignedMembers.map((m) => (
                  <div
                    key={m.id}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#27272A] border border-[#3F3F46] text-xs font-medium text-white"
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-2xs shrink-0"
                      style={{ backgroundColor: m.colorHex }}
                    >
                      {m.name.slice(0, 1)}
                    </div>
                    <span>{m.name}</span>
                    <span className="text-[10px] text-zinc-400">({m.role})</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Date, Time & Location Card */}
          <div className="bg-[#18181B] rounded-xl p-4 space-y-3 border border-[#27272A] text-xs sm:text-sm">
            <div className="flex items-start space-x-3 text-zinc-300">
              <CalendarIcon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-white">일시</span>
                <span>{formatDateKorean(event.startDate)}</span>
                {event.endDate && event.endDate !== event.startDate && (
                  <span> ~ {formatDateKorean(event.endDate)}</span>
                )}
                {event.allDay && (
                  <span className="ml-2 text-xs font-semibold text-indigo-400">
                    [종일]
                  </span>
                )}
              </div>
            </div>

            {event.location && (
              <div className="flex items-start space-x-3 text-zinc-300">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-white">장소 / 링크</span>
                  <span>{event.location}</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                상세 내용
              </h4>
              <p className="text-xs sm:text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed bg-[#18181B] p-3 rounded-xl border border-[#27272A]">
                {event.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {event.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center text-xs font-medium text-zinc-300 bg-[#27272A] px-2.5 py-1 rounded-md"
                >
                  <Tag className="w-3 h-3 mr-1 text-zinc-400" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Integration Links (Google Calendar & iCal Export) */}
          <div className="pt-2 border-t border-[#27272A] flex flex-col sm:flex-row gap-2">
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-3 bg-indigo-900/40 hover:bg-indigo-900/70 text-indigo-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border border-indigo-500/30 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Google 달력에 등록</span>
            </a>

            <button
              onClick={() => downloadICSFile([event], `${event.title.slice(0, 15)}.ics`)}
              className="flex-1 py-2 px-3 bg-[#18181B] hover:bg-[#27272A] text-zinc-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border border-[#3F3F46] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.ics 다운로드</span>
            </button>
          </div>

        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-[#18181B] border-t border-[#27272A] flex items-center justify-between">
          <button
            onClick={() => {
              onDelete(event.id);
              onClose();
            }}
            className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-950/40 rounded-lg flex items-center space-x-1 transition-colors"
            title="삭제된 일정은 '이력 및 복구' 메뉴에서 언제든지 1클릭으로 복구할 수 있습니다"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>일정 삭제 (복구 가능)</span>
          </button>

          <button
            onClick={() => onEdit(event)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 accent-glow"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>일정 수정하기</span>
          </button>
        </div>

      </div>
    </div>
  );
};
