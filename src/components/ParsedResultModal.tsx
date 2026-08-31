import React, { useState } from "react";
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Tag,
  AlertTriangle,
  X,
  Trash2,
  Edit2,
  PlusCircle,
  Sparkles,
  Users,
  Check,
} from "lucide-react";
import { CalendarEvent, CategoryType, PriorityType, TeamMember } from "../types";
import { getCategoryStyle, getPriorityBadge, formatDateKorean } from "../utils/calendarUtils";

interface ParsedResultModalProps {
  summary: string;
  parsedEvents: (Omit<CalendarEvent, "id" | "createdAt"> & { suggestedMemberNames?: string[] })[];
  members: TeamMember[];
  currentMemberId: string;
  onConfirmAdd: (selectedEvents: Omit<CalendarEvent, "id" | "createdAt">[]) => void;
  onClose: () => void;
}

export const ParsedResultModal: React.FC<ParsedResultModalProps> = ({
  summary,
  parsedEvents: initialParsedEvents,
  members,
  currentMemberId,
  onConfirmAdd,
  onClose,
}) => {
  const currentMember = members.find((m) => m.id === currentMemberId);

  // Map initial suggestedMemberNames into assignedMembers
  const formattedInitial = initialParsedEvents.map((evt) => {
    let assigned = evt.assignedMembers || [];
    if (assigned.length === 0 && evt.suggestedMemberNames && evt.suggestedMemberNames.length > 0) {
      // match names
      const matched = members.filter((m) =>
        evt.suggestedMemberNames!.some(
          (name) => m.name.includes(name) || name.includes(m.name) || (m.role && name.includes(m.role))
        )
      );
      if (matched.length > 0) {
        assigned = matched.map((m) => m.id);
      }
    }
    if (assigned.length === 0) {
      // default: assign to all 5 or current member
      assigned = [currentMemberId];
    }
    return {
      ...evt,
      assignedMembers: assigned,
      createdById: currentMemberId,
      createdByName: currentMember?.name || "팀원",
    };
  });

  const [events, setEvents] = useState<Omit<CalendarEvent, "id" | "createdAt">[]>(formattedInitial);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(formattedInitial.map((_, i) => i))
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Omit<CalendarEvent, "id" | "createdAt"> | null>(null);

  const toggleSelect = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === events.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(events.map((_, i) => i)));
    }
  };

  const toggleMemberForEvent = (eventIndex: number, memberId: string) => {
    setEvents((prev) => {
      const updated = [...prev];
      const currentAssigned = updated[eventIndex].assignedMembers || [];
      const nextAssigned = currentAssigned.includes(memberId)
        ? currentAssigned.filter((id) => id !== memberId)
        : [...currentAssigned, memberId];
      updated[eventIndex] = {
        ...updated[eventIndex],
        assignedMembers: nextAssigned.length > 0 ? nextAssigned : [currentMemberId],
      };
      return updated;
    });
  };

  const assignAllMembersToEvent = (eventIndex: number) => {
    setEvents((prev) => {
      const updated = [...prev];
      const isAll = (updated[eventIndex].assignedMembers || []).length === members.length;
      updated[eventIndex] = {
        ...updated[eventIndex],
        assignedMembers: isAll ? [currentMemberId] : members.map((m) => m.id),
      };
      return updated;
    });
  };

  const handleDelete = (index: number) => {
    const updated = events.filter((_, i) => i !== index);
    setEvents(updated);
    const nextSel = new Set<number>();
    updated.forEach((_, i) => {
      if (selectedIndices.has(i)) nextSel.add(i);
    });
    setSelectedIndices(nextSel);
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...events[index] });
  };

  const saveEdit = () => {
    if (editingIndex !== null && editForm) {
      const updated = [...events];
      updated[editingIndex] = editForm;
      setEvents(updated);
      setEditingIndex(null);
      setEditForm(null);
    }
  };

  const handleConfirm = () => {
    const selected = events.filter((_, i) => selectedIndices.has(i));
    if (selected.length === 0) {
      alert("추가할 일정을 하나 이상 선택해주세요.");
      return;
    }
    onConfirmAdd(selected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0F0F11] border border-[#27272A] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#18181B] border-b border-[#27272A] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center accent-glow">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AI 파싱 완료 · 5인 공유 캘린더 등록
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-900/60 text-indigo-300 border border-indigo-500/30">
                  {events.length}개 추출됨
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {summary}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls Bar */}
        <div className="px-6 py-2.5 bg-[#09090B] border-b border-[#27272A] flex items-center justify-between text-xs">
          <button
            onClick={toggleSelectAll}
            className="inline-flex items-center font-medium text-zinc-300 hover:text-indigo-400"
          >
            <input
              type="checkbox"
              checked={selectedIndices.size === events.length && events.length > 0}
              onChange={toggleSelectAll}
              className="mr-2 rounded-md text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer bg-zinc-800 border-zinc-700"
            />
            {selectedIndices.size === events.length ? "전체 해제" : "전체 선택"} ({selectedIndices.size}/{events.length})
          </button>

          <span className="text-zinc-500 text-[11px]">
            각 일정의 5인 팀원 배정 상태를 확인 후 [캘린더에 등록]을 누르세요.
          </span>
        </div>

        {/* Extracted Events List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5 custom-scrollbar">
          {events.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
              <p className="text-sm">추출된 일정이 없습니다.</p>
            </div>
          ) : (
            events.map((evt, idx) => {
              const isSelected = selectedIndices.has(idx);
              const catStyle = getCategoryStyle(evt.category as CategoryType);
              const priStyle = getPriorityBadge(evt.priority as PriorityType);
              const isEditing = editingIndex === idx;
              const assignedIds = evt.assignedMembers || [];

              if (isEditing && editForm) {
                return (
                  <div
                    key={idx}
                    className="p-4 border-2 border-indigo-500 rounded-xl bg-[#18181B] space-y-3"
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-indigo-400">
                      <span>일정 정보 수정</span>
                      <div className="space-x-2">
                        <button
                          onClick={saveEdit}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-md text-xs hover:bg-indigo-500 font-semibold accent-glow"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="px-3 py-1 bg-[#27272A] text-zinc-300 rounded-md text-xs hover:bg-zinc-700"
                        >
                          취소
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block text-zinc-400 font-medium mb-1">제목</label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full p-2 border border-[#3F3F46] rounded-lg bg-[#09090B] text-zinc-200 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-400 font-medium mb-1">시작 일시</label>
                        <input
                          type={editForm.allDay ? "date" : "datetime-local"}
                          value={editForm.startDate}
                          onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                          className="w-full p-2 border border-[#3F3F46] rounded-lg bg-[#09090B] text-zinc-200 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-400 font-medium mb-1">종료 일시</label>
                        <input
                          type={editForm.allDay ? "date" : "datetime-local"}
                          value={editForm.endDate}
                          onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                          className="w-full p-2 border border-[#3F3F46] rounded-lg bg-[#09090B] text-zinc-200 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-400 font-medium mb-1">카테고리</label>
                        <select
                          value={editForm.category}
                          onChange={(e) =>
                            setEditForm({ ...editForm, category: e.target.value as CategoryType })
                          }
                          className="w-full p-2 border border-[#3F3F46] rounded-lg bg-[#09090B] text-zinc-200 focus:border-indigo-500 focus:outline-none"
                        >
                          {["업무", "개인", "학업", "여행", "건강", "중요", "기타"].map((c) => (
                            <option key={c} value={c} className="bg-[#18181B] text-zinc-200">
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-zinc-400 font-medium mb-1">위치/장소</label>
                        <input
                          type="text"
                          value={editForm.location || ""}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          className="w-full p-2 border border-[#3F3F46] rounded-lg bg-[#09090B] text-zinc-200 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-zinc-400 font-medium mb-1">세부 설명</label>
                        <textarea
                          value={editForm.description || ""}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          rows={2}
                          className="w-full p-2 border border-[#3F3F46] rounded-lg bg-[#09090B] text-zinc-200 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  onClick={() => toggleSelect(idx)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start space-x-3.5 ${
                    isSelected
                      ? "bg-[#18181B] border-indigo-500/60 shadow-sm"
                      : "bg-[#09090B] border-[#27272A] opacity-50"
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(idx)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 rounded-md text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer bg-zinc-800 border-zinc-700"
                  />

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${catStyle.badgeBg}`}>
                        {evt.category}
                      </span>

                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${priStyle.color}`}>
                        우선순위: {priStyle.text}
                      </span>

                      {evt.confidence && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-900/60 text-emerald-300 border border-emerald-500/30">
                          신뢰도 {evt.confidence}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white truncate">
                      {evt.title}
                    </h3>

                    {/* 5-Member Assignee Selector Chips inside Card */}
                    <div
                      className="mt-2.5 p-2 rounded-lg bg-[#141417] border border-[#27272A] space-y-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 font-semibold flex items-center gap-1">
                          <Users className="w-3 h-3 text-indigo-400" />
                          담당 배정 ({assignedIds.length}명)
                        </span>
                        <button
                          type="button"
                          onClick={() => assignAllMembersToEvent(idx)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          {assignedIds.length === members.length ? "나만 배정" : "5명 전체 배정"}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {members.map((m) => {
                          const isAssigned = assignedIds.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => toggleMemberForEvent(idx, m.id)}
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] transition-colors border ${
                                isAssigned
                                  ? "bg-[#27272A] border-indigo-500/60 text-white font-semibold"
                                  : "bg-[#09090B] border-transparent text-zinc-500 hover:text-zinc-300"
                              }`}
                            >
                              <div
                                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                                style={{ backgroundColor: m.colorHex }}
                              >
                                {m.name.slice(0, 1)}
                              </div>
                              <span>{m.name}</span>
                              {isAssigned && <Check className="w-2.5 h-2.5 text-indigo-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Date/Time and Location */}
                    <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-zinc-400">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">
                          {formatDateKorean(evt.startDate)}
                          {evt.endDate && evt.endDate !== evt.startDate && ` ~ ${formatDateKorean(evt.endDate)}`}
                        </span>
                      </div>

                      {evt.location && (
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {evt.description && (
                      <p className="mt-2 text-xs text-zinc-400 bg-[#09090B] border border-[#3F3F46] p-2 rounded-lg line-clamp-2">
                        {evt.description}
                      </p>
                    )}

                    {/* Tags */}
                    {evt.tags && evt.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {evt.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center text-[10px] text-zinc-400 bg-[#27272A] px-1.5 py-0.5 rounded-md"
                          >
                            <Tag className="w-2.5 h-2.5 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => startEdit(idx)}
                      className="p-1.5 text-zinc-500 hover:text-indigo-400 rounded-lg hover:bg-zinc-800"
                      title="수정"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(idx)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#18181B] border-t border-[#27272A] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-[#27272A] rounded-xl transition-colors"
          >
            취소
          </button>

          <button
            onClick={handleConfirm}
            disabled={selectedIndices.size === 0}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 accent-glow transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>선택한 {selectedIndices.size}개 일정 5인 캘린더에 등록</span>
          </button>
        </div>

      </div>
    </div>
  );
};
