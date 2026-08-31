import React, { useState } from "react";
import {
  X,
  History,
  PlusCircle,
  Edit,
  Trash2,
  Sparkles,
  Clock,
  RotateCcw,
  Undo2,
  Calendar,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { ActivityLog, DeletedEvent, EventRevision, TeamMember, CategoryType } from "../types";
import {
  formatDateKorean,
  formatTimeOnly,
  formatFullDateTimeKorean,
  getCategoryStyle,
} from "../utils/calendarUtils";

interface ActivityLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLog[];
  trashEvents: DeletedEvent[];
  revisions: EventRevision[];
  members: TeamMember[];
  onRestoreEvent: (trashId: string) => Promise<void> | void;
  onPermanentDeleteTrash?: (trashId: string) => Promise<void> | void;
  onClearTrash?: () => Promise<void> | void;
  onRevertRevision: (revision: EventRevision) => Promise<void> | void;
  onClearLogs?: () => void;
  initialTab?: "logs" | "trash" | "revisions";
}

export const ActivityLogDrawer: React.FC<ActivityLogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  trashEvents,
  revisions,
  members,
  onRestoreEvent,
  onPermanentDeleteTrash,
  onClearTrash,
  onRevertRevision,
  onClearLogs,
  initialTab = "logs",
}) => {
  const [activeTab, setActiveTab] = useState<"logs" | "trash" | "revisions">(initialTab);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [revertingId, setRevertingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRestore = async (trashId: string) => {
    setRestoringId(trashId);
    try {
      await onRestoreEvent(trashId);
    } finally {
      setRestoringId(null);
    }
  };

  const handleRevert = async (revision: EventRevision) => {
    setRevertingId(revision.id);
    try {
      await onRevertRevision(revision);
    } finally {
      setRevertingId(null);
    }
  };

  const getActionIcon = (action: ActivityLog["action"]) => {
    switch (action) {
      case "create":
        return <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case "update":
        return <Edit className="w-3.5 h-3.5 text-indigo-400" />;
      case "delete":
        return <Trash2 className="w-3.5 h-3.5 text-rose-400" />;
      case "parse":
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
      case "restore":
        return <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />;
      case "revert":
        return <Undo2 className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getActionLabel = (action: ActivityLog["action"]) => {
    switch (action) {
      case "create":
        return "일정 등록";
      case "update":
        return "일정 수정";
      case "delete":
        return "일정 삭제";
      case "parse":
        return "AI 문서 파싱 등록";
      case "restore":
        return "삭제 일정 복구됨";
      case "revert":
        return "이전 버전으로 복원됨";
      default:
        return "변경";
    }
  };

  const formatLogTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const hours = d.getHours();
      const mins = d.getMinutes();
      const ampm = hours >= 12 ? "오후" : "오전";
      const displayH = hours % 12 || 12;
      const minStr = mins < 10 ? `0${mins}` : mins;
      return `${d.getMonth() + 1}/${d.getDate()} ${ampm} ${displayH}:${minStr}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#0F0F11] border-l border-[#27272A] w-full max-w-lg h-full flex flex-col shadow-2xl overflow-hidden text-zinc-200">
        
        {/* Header */}
        <div className="px-5 py-4 bg-[#18181B] border-b border-[#27272A] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">5인 활동 이력 및 복구 센터</h2>
              <p className="text-[11px] text-zinc-400">입력자 확인 · 삭제된 일정 복구 · 수정 버전 되돌리기</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Tabs Navigation */}
        <div className="flex items-center border-b border-[#27272A] bg-[#141417] px-3 pt-2 gap-1.5 text-xs font-semibold">
          
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-2 rounded-t-xl transition-all flex items-center space-x-1.5 ${
              activeTab === "logs"
                ? "bg-[#18181B] text-indigo-300 border-t-2 border-indigo-500 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>활동 내역 ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("trash")}
            className={`px-3 py-2 rounded-t-xl transition-all flex items-center space-x-1.5 relative ${
              activeTab === "trash"
                ? "bg-[#18181B] text-rose-300 border-t-2 border-rose-500 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>삭제 일정 복구 ({trashEvents.length})</span>
            {trashEvents.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("revisions")}
            className={`px-3 py-2 rounded-t-xl transition-all flex items-center space-x-1.5 ${
              activeTab === "revisions"
                ? "bg-[#18181B] text-cyan-300 border-t-2 border-cyan-500 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>수정 버전 복원 ({revisions.length})</span>
          </button>

        </div>

        {/* Tab 1: Realtime Activity Logs */}
        {activeTab === "logs" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="text-center py-20 text-zinc-500 text-xs">
                <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>아직 기록된 팀 활동 내역이 없습니다.</p>
                <p className="mt-1 text-[11px] text-zinc-600">일정을 등록하거나 수정하면 실시간으로 표시됩니다.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-zinc-700 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs"
                        style={{ backgroundColor: log.memberColor || "#6366F1" }}
                      >
                        {log.memberName ? log.memberName.slice(0, 1) : "팀"}
                      </div>
                      <span className="font-bold text-white">{log.memberName}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-[#27272A] text-zinc-300">
                        {getActionIcon(log.action)}
                        {getActionLabel(log.action)}
                      </span>
                    </div>

                    <span className="text-[10px] text-zinc-500 font-mono">
                      {formatLogTime(log.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-200 font-medium pl-7 truncate">
                    "{log.eventTitle}"
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Deleted Schedules Recovery (Trash Bin) */}
        {activeTab === "trash" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs text-rose-300 flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-white">삭제된 일정 안전 복구 시스템</strong>
                <span>어떤 팀원이 실수로 일정을 삭제했더라도 언제든지 1클릭으로 원래 캘린더에 즉시 되살릴 수 있습니다.</span>
              </div>
            </div>

            {trashEvents.length === 0 ? (
              <div className="text-center py-20 text-zinc-500 text-xs space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/40" />
                <p className="text-sm font-semibold text-zinc-400">휴지통이 비어 있습니다.</p>
                <p className="text-[11px] text-zinc-600">삭제된 일정이 발생하면 여기에 보관되어 복구할 수 있습니다.</p>
              </div>
            ) : (
              trashEvents.map((item) => {
                const evt = item.eventData;
                const catStyle = getCategoryStyle((evt?.category as CategoryType) || "업무");
                const isRestoring = restoringId === item.id;
                const originalCreatorName = evt?.createdByName || "팀원";

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-rose-500/40 transition-all space-y-3 shadow-sm"
                  >
                    {/* Header: Title & Category */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${catStyle.badgeBg}`}>
                            {evt?.category || "일정"}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            원래 작성자: <strong className="text-zinc-300">{originalCreatorName}</strong>
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white leading-tight">
                          {evt?.title || "삭제된 일정"}
                        </h3>
                      </div>

                      {/* Restore Button */}
                      <button
                        disabled={isRestoring}
                        onClick={() => handleRestore(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shrink-0 shadow-xs transition-all active:scale-95"
                        title="이 일정을 다시 캘린더에 복구하기"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? "animate-spin" : ""}`} />
                        <span>{isRestoring ? "복구 중..." : "캘린더로 복구"}</span>
                      </button>
                    </div>

                    {/* Schedule Snapshot Info */}
                    <div className="p-2.5 rounded-lg bg-[#09090B] border border-[#27272A] text-xs text-zinc-300 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{formatDateKorean(evt?.startDate || "")}</span>
                      </div>
                      {evt?.location && (
                        <div className="flex items-center space-x-2 text-zinc-400">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                      )}
                      {evt?.description && (
                        <p className="text-[11px] text-zinc-400 line-clamp-1 italic pt-0.5">
                          "{evt.description}"
                        </p>
                      )}
                    </div>

                    {/* Deletion Info Footer */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#27272A] text-[11px] text-zinc-400">
                      <div className="flex items-center space-x-1.5">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                          style={{ backgroundColor: item.deletedByColor || "#E11D48" }}
                        >
                          {item.deletedByName ? item.deletedByName.slice(0, 1) : "삭"}
                        </div>
                        <span>삭제자: <strong className="text-zinc-200">{item.deletedByName}</strong></span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-500 font-mono text-[10px]">
                          {formatFullDateTimeKorean(item.deletedAt)}
                        </span>
                        {onPermanentDeleteTrash && (
                          <button
                            onClick={() => onPermanentDeleteTrash(item.id)}
                            className="text-zinc-600 hover:text-rose-400 p-1 text-[10px]"
                            title="완전 삭제"
                          >
                            완전 삭제
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 3: Event Revision History & Version Rollback */}
        {activeTab === "revisions" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-300 flex items-start space-x-2.5">
              <Undo2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-white">수정 이력 및 과거 버전 복원</strong>
                <span>누가 언제 어떤 내용을 수정했는지 타임라인을 확인하고 원하는 이전 상태로 즉시 되돌릴 수 있습니다.</span>
              </div>
            </div>

            {revisions.length === 0 ? (
              <div className="text-center py-20 text-zinc-500 text-xs space-y-2">
                <History className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm font-semibold text-zinc-400">저장된 수정 이력이 없습니다.</p>
                <p className="text-[11px] text-zinc-600">일정을 수정하면 이전 버전 스냅샷이 여기에 자동 보관됩니다.</p>
              </div>
            ) : (
              revisions.map((rev) => {
                const snapshot = rev.snapshot;
                const isReverting = revertingId === rev.id;

                return (
                  <div
                    key={rev.id}
                    className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-cyan-500/40 transition-all space-y-3 shadow-sm"
                  >
                    {/* Top: Modified by & Timestamp */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ backgroundColor: rev.modifiedByColor || "#06B6D4" }}
                        >
                          {rev.modifiedByName ? rev.modifiedByName.slice(0, 1) : "수"}
                        </div>
                        <span className="font-bold text-white">{rev.modifiedByName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-medium">
                          {rev.changesSummary || "내용 수정"}
                        </span>
                      </div>

                      <span className="text-[10px] text-zinc-500 font-mono">
                        {formatFullDateTimeKorean(rev.modifiedAt)}
                      </span>
                    </div>

                    {/* Snapshot Card (Previous State) */}
                    <div className="p-3 rounded-lg bg-[#09090B] border border-[#27272A] text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                          [수정 전 저장 상태]
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                          {snapshot?.category}
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-xs">
                        "{snapshot?.title}"
                      </h4>

                      <div className="text-[11px] text-zinc-400 space-y-0.5">
                        <div>📅 {formatDateKorean(snapshot?.startDate || "")}</div>
                        {snapshot?.location && <div>📍 {snapshot.location}</div>}
                        {snapshot?.description && (
                          <div className="text-zinc-500 italic line-clamp-2">
                            "{snapshot.description}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action: Revert Button */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#27272A]">
                      <span className="text-[11px] text-zinc-500">
                        대상 일정: <strong className="text-zinc-300">{rev.eventTitle}</strong>
                      </span>

                      <button
                        disabled={isReverting}
                        onClick={() => handleRevert(rev)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all active:scale-95"
                        title="이 과거 버전의 데이터로 일정을 되돌리기"
                      >
                        <Undo2 className={`w-3.5 h-3.5 ${isReverting ? "animate-spin" : ""}`} />
                        <span>{isReverting ? "되돌리는 중..." : "이 버전으로 복원"}</span>
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-[#18181B] border-t border-[#27272A] flex items-center justify-between text-xs text-zinc-400">
          <div>
            {activeTab === "trash" && trashEvents.length > 0 && onClearTrash && (
              <button
                onClick={onClearTrash}
                className="text-xs text-zinc-500 hover:text-rose-400 transition-colors"
              >
                휴지통 비우기
              </button>
            )}
            {activeTab === "logs" && logs.length > 0 && onClearLogs && (
              <button
                onClick={onClearLogs}
                className="text-xs text-zinc-500 hover:text-rose-400 transition-colors"
              >
                내역 지우기
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#27272A] hover:bg-[#3F3F46] text-white rounded-lg text-xs font-medium transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
