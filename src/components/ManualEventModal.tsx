import React, { useState } from "react";
import { X, Calendar, Plus, Save } from "lucide-react";
import { CalendarEvent, CategoryType, PriorityType } from "../types";

interface ManualEventModalProps {
  initialEvent?: CalendarEvent | null;
  defaultDate?: string; // YYYY-MM-DD
  onSave: (eventData: Omit<CalendarEvent, "id" | "createdAt">, id?: string) => void;
  onClose: () => void;
}

export const ManualEventModal: React.FC<ManualEventModalProps> = ({
  initialEvent,
  defaultDate,
  onSave,
  onClose,
}) => {
  const today = defaultDate || new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState(initialEvent?.title || "");
  const [startDate, setStartDate] = useState(
    initialEvent?.startDate || (defaultDate ? `${defaultDate}T09:00` : `${today}T09:00`)
  );
  const [endDate, setEndDate] = useState(
    initialEvent?.endDate || (defaultDate ? `${defaultDate}T10:00` : `${today}T10:00`)
  );
  const [allDay, setAllDay] = useState(initialEvent?.allDay || false);
  const [category, setCategory] = useState<CategoryType>(initialEvent?.category || "업무");
  const [priority, setPriority] = useState<PriorityType>(initialEvent?.priority || "medium");
  const [location, setLocation] = useState(initialEvent?.location || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [tagsInput, setTagsInput] = useState(initialEvent?.tags ? initialEvent.tags.join(", ") : "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("일정 제목을 입력해주세요.");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onSave(
      {
        title: title.trim(),
        startDate,
        endDate: endDate || startDate,
        allDay,
        category,
        priority,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      },
      initialEvent?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0F0F11] border border-[#27272A] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-zinc-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#27272A] bg-[#18181B] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-900/60 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">
              {initialEvent ? "일정 수정하기" : "새 일정 직접 추가"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          
          {/* Title */}
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              일정 제목 <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: 프로젝트 팀 회의, 정기 검진"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-[#09090B] border border-[#3F3F46] rounded-xl text-zinc-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center justify-between bg-[#18181B] p-2.5 rounded-xl border border-[#27272A]">
            <span className="font-semibold text-zinc-300">하루 종일 일정</span>
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer bg-zinc-800 border-zinc-700"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                시작 일시
              </label>
              <input
                type={allDay ? "date" : "datetime-local"}
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-[#09090B] border border-[#3F3F46] rounded-xl text-zinc-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                종료 일시
              </label>
              <input
                type={allDay ? "date" : "datetime-local"}
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 bg-[#09090B] border border-[#3F3F46] rounded-xl text-zinc-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                카테고리
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full p-2.5 bg-[#09090B] border border-[#3F3F46] rounded-xl text-zinc-200 focus:border-indigo-500 focus:outline-none"
              >
                {["업무", "개인", "학업", "여행", "건강", "중요", "기타"].map((c) => (
                  <option key={c} value={c} className="bg-[#18181B] text-zinc-200">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                우선순위
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityType)}
                className="w-full p-2.5 bg-[#09090B] border border-[#3F3F46] rounded-xl text-zinc-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="low" className="bg-[#18181B] text-zinc-200">낮음</option>
                <option value="medium" className="bg-[#18181B] text-zinc-200">보통</option>
                <option value="high" className="bg-[#18181B] text-zinc-200">높음</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              장소 / 회의 링크 (선택)
            </label>
            <input
              type="text"
              placeholder="예: 3층 회의실 또는 Zoom/Google Meet 링크"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2.5 bg-[#09090B] border border-[#3F3F46] rounded-xl text-zinc-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              상세 메모 (선택)
            </label>
            <textarea
              rows={2}
              placeholder="일정과 관련된 주요 메모 사항을 입력하세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-[#09090B] border border-[#3F3F46] rounded-xl text-zinc-200 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              태그 (쉼표로 구분)
            </label>
            <input
              type="text"
              placeholder="예: 회의, 프로젝트A, 중요"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full p-2.5 bg-[#09090B] border border-[#3F3F46] rounded-xl text-zinc-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#27272A] flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-[#27272A] rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 accent-glow transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{initialEvent ? "수정사항 저장" : "일정 저장하기"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
