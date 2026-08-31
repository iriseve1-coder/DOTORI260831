import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  List,
  Grid,
  CalendarDays,
  Sparkles,
  Users,
} from "lucide-react";
import { CalendarEvent, CategoryType, CalendarViewMode, TeamMember } from "../types";
import {
  getCategoryStyle,
  formatTimeOnly,
  formatDateKorean,
  isEventOnDate,
} from "../utils/calendarUtils";

interface CalendarViewProps {
  events: CalendarEvent[];
  members: TeamMember[];
  currentMemberId: string;
  onSelectEvent: (event: CalendarEvent) => void;
  onAddEventForDate: (dateStr: string) => void;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  members,
  currentMemberId,
  onSelectEvent,
  onAddEventForDate,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === "week") {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentDate(prevWeek);
    } else {
      const prevDay = new Date(currentDate);
      prevDay.setDate(prevDay.getDate() - 1);
      setCurrentDate(prevDay);
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === "week") {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentDate(nextWeek);
    } else {
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setCurrentDate(nextDay);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Build Month Days Matrix
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Previous month padding days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevPaddingDays = Array.from({ length: startingDayOfWeek }, (_, i) => ({
    day: prevMonthLastDay - startingDayOfWeek + i + 1,
    isCurrentMonth: false,
    month: month - 1,
    year: month === 0 ? year - 1 : year,
  }));

  // Current month days
  const currentMonthDays = Array.from({ length: totalDaysInMonth }, (_, i) => ({
    day: i + 1,
    isCurrentMonth: true,
    month: month,
    year: year,
  }));

  // Next month padding days
  const totalCellsSoFar = prevPaddingDays.length + currentMonthDays.length;
  const targetTotalCells = totalCellsSoFar > 35 ? 42 : 35;
  const nextPaddingDays = Array.from({ length: targetTotalCells - totalCellsSoFar }, (_, i) => ({
    day: i + 1,
    isCurrentMonth: false,
    month: month + 1,
    year: month === 11 ? year + 1 : year,
  }));

  const calendarGridDays = [...prevPaddingDays, ...currentMonthDays, ...nextPaddingDays];

  const todayObj = new Date();
  const isToday = (cellYear: number, cellMonth: number, cellDay: number) => {
    return (
      todayObj.getFullYear() === cellYear &&
      todayObj.getMonth() === cellMonth &&
      todayObj.getDate() === cellDay
    );
  };

  // Week View Days calculation
  const getWeekDays = () => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay();
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  // Agenda / Sequential Events list
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  return (
    <div className="bg-[#09090B] border border-[#27272A] rounded-2xl shadow-xs overflow-hidden flex flex-col h-full">
      
      {/* Calendar Navigation Toolbar */}
      <div className="p-4 sm:p-5 border-b border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F0F11]">
        
        {/* Navigation & Title */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-[#18181B] border border-[#3F3F46] rounded-xl p-0.5">
            <button
              onClick={handlePrev}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="이전"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              오늘
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="다음"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base sm:text-xl font-bold text-white tracking-tight">
            {year}년 {month + 1}월
          </h2>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-2">
          <div className="bg-[#18181B] border border-[#3F3F46] p-1 rounded-xl flex items-center text-xs font-semibold text-zinc-400">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                viewMode === "month"
                  ? "bg-indigo-600 text-white font-bold accent-glow"
                  : "hover:text-white"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>월간</span>
            </button>

            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                viewMode === "week"
                  ? "bg-indigo-600 text-white font-bold accent-glow"
                  : "hover:text-white"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>주간</span>
            </button>

            <button
              onClick={() => setViewMode("agenda")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                viewMode === "agenda"
                  ? "bg-indigo-600 text-white font-bold accent-glow"
                  : "hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>목록 ({events.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              const todayStr = new Date().toISOString().split("T")[0];
              onAddEventForDate(todayStr);
            }}
            className="p-2 sm:px-3 sm:py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 accent-glow"
            title="새 일정 직접 작성"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">일정 추가</span>
          </button>
        </div>

      </div>

      {/* View Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        {/* MONTH VIEW */}
        {viewMode === "month" && (
          <div className="flex flex-col h-full min-w-[640px]">
            
            {/* Weekday Header */}
            <div className="grid grid-cols-7 border-b border-[#27272A] bg-[#18181B] text-center py-2.5 text-xs font-bold text-zinc-500 uppercase">
              {WEEKDAYS.map((dayName, idx) => (
                <div
                  key={dayName}
                  className={idx === 0 ? "text-rose-400" : idx === 6 ? "text-indigo-400" : ""}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Month Grid Cells */}
            <div className="grid grid-cols-7 auto-rows-fr flex-1 border-b border-[#27272A] bg-[#27272A] gap-px">
              {calendarGridDays.map((cell, cellIdx) => {
                const cellIsToday = isToday(cell.year, cell.month, cell.day);
                const cellEvents = events.filter((evt) =>
                  isEventOnDate(evt, cell.year, cell.month, cell.day)
                );

                const cellDateStr = `${cell.year}-${String(cell.month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;

                return (
                  <div
                    key={cellIdx}
                    onClick={() => onAddEventForDate(cellDateStr)}
                    className={`min-h-[105px] sm:min-h-[120px] p-2 transition-colors group relative flex flex-col ${
                      cellIsToday
                        ? "bg-[#18181B] ring-1 ring-inset ring-indigo-500 text-white"
                        : !cell.isCurrentMonth
                        ? "bg-[#09090B] text-zinc-700"
                        : "bg-[#09090B] text-zinc-300 hover:bg-[#18181B]/80"
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          cellIsToday
                            ? "bg-indigo-600 text-white accent-glow"
                            : !cell.isCurrentMonth
                            ? "text-zinc-700"
                            : cellIdx % 7 === 0
                            ? "text-rose-400"
                            : cellIdx % 7 === 6
                            ? "text-indigo-400"
                            : "text-zinc-300"
                        }`}
                      >
                        {cell.day}
                      </span>

                      {/* Add Button on Hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddEventForDate(cellDateStr);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-white transition-opacity"
                        title="이 날짜에 일정 추가"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Events Badges inside Cell */}
                    <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] custom-scrollbar">
                      {cellEvents.map((evt) => {
                        const catStyle = getCategoryStyle(evt.category as CategoryType);
                        const assignedList = members.filter((m) =>
                          (evt.assignedMembers || []).includes(m.id)
                        );

                        return (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEvent(evt);
                            }}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium border truncate cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between gap-1 ${catStyle.bgColor} ${catStyle.textColor} ${catStyle.borderColor}`}
                            title={`${evt.title} (${formatTimeOnly(evt.startDate)}) - 입력자: ${evt.createdByName || "팀원"}${evt.updatedByName ? ` (수정: ${evt.updatedByName})` : ""} - 담당: ${assignedList.map((m) => m.name).join(", ")}`}
                          >
                            <span className="truncate">
                              <span className="font-semibold">{formatTimeOnly(evt.startDate)}</span> • {evt.title}
                            </span>

                            {/* Member Avatar Dots */}
                            {assignedList.length > 0 && (
                              <div className="flex -space-x-1 shrink-0">
                                {assignedList.slice(0, 3).map((m) => (
                                  <div
                                    key={m.id}
                                    className="w-3 h-3 rounded-full border border-[#09090B] flex items-center justify-center text-[7px] text-white font-bold"
                                    style={{ backgroundColor: m.colorHex }}
                                  >
                                    {m.name.slice(0, 1)}
                                  </div>
                                ))}
                                {assignedList.length > 3 && (
                                  <div className="w-3 h-3 rounded-full bg-zinc-700 text-[6px] text-white flex items-center justify-center">
                                    +
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* WEEK VIEW */}
        {viewMode === "week" && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {getWeekDays().map((d, idx) => {
                const dayYear = d.getFullYear();
                const dayMonth = d.getMonth();
                const dayNum = d.getDate();
                const dayDateStr = `${dayYear}-${String(dayMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const cellIsToday = isToday(dayYear, dayMonth, dayNum);
                const dayEvents = events.filter((evt) =>
                  isEventOnDate(evt, dayYear, dayMonth, dayNum)
                );

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border transition-colors ${
                      cellIsToday
                        ? "border-indigo-500 bg-[#18181B] ring-1 ring-indigo-500"
                        : "border-[#27272A] bg-[#18181B]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#27272A]">
                      <div>
                        <span className="text-xs font-bold text-zinc-500 uppercase">
                          {WEEKDAYS[d.getDay()]}요일
                        </span>
                        <div
                          className={`text-sm font-bold ${
                            cellIsToday ? "text-indigo-400" : "text-zinc-200"
                          }`}
                        >
                          {dayMonth + 1}월 {dayNum}일
                        </div>
                      </div>

                      <button
                        onClick={() => onAddEventForDate(dayDateStr)}
                        className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200"
                        title="일정 추가"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {dayEvents.length === 0 ? (
                        <p className="text-[11px] text-zinc-600 py-4 text-center">일정 없음</p>
                      ) : (
                        dayEvents.map((evt) => {
                          const catStyle = getCategoryStyle(evt.category as CategoryType);
                          const assignedList = members.filter((m) =>
                            (evt.assignedMembers || []).includes(m.id)
                          );

                          return (
                            <div
                              key={evt.id}
                              onClick={() => onSelectEvent(evt)}
                              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.01] ${catStyle.bgColor} ${catStyle.borderColor}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${catStyle.badgeBg}`}>
                                  {evt.category}
                                </span>

                                {/* Member avatars */}
                                <div className="flex -space-x-1">
                                  {assignedList.map((m) => (
                                    <div
                                      key={m.id}
                                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] text-white font-bold shadow-xs"
                                      style={{ backgroundColor: m.colorHex }}
                                      title={m.name}
                                    >
                                      {m.name.slice(0, 1)}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <h4 className="font-bold text-white mt-1.5 truncate">
                                {evt.title}
                              </h4>
                              <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1 pt-1 border-t border-[#27272A]/60">
                                <span>{formatTimeOnly(evt.startDate)}</span>
                                <span className="text-zinc-500 font-medium truncate max-w-[80px]" title={`입력: ${evt.createdByName || "팀원"}`}>
                                  ✍️ {evt.createdByName || "팀원"}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AGENDA VIEW */}
        {viewMode === "agenda" && (
          <div className="p-5 max-w-4xl mx-auto space-y-3">
            {sortedEvents.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 space-y-2">
                <CalendarIcon className="w-12 h-12 mx-auto text-zinc-700" />
                <p className="text-sm font-semibold text-zinc-300">
                  등록된 일정이 없습니다.
                </p>
                <p className="text-xs text-zinc-500">
                  문서 내용을 붙여넣고 AI 파싱을 실행해보세요!
                </p>
              </div>
            ) : (
              sortedEvents.map((evt) => {
                const catStyle = getCategoryStyle(evt.category as CategoryType);
                const assignedList = members.filter((m) =>
                  (evt.assignedMembers || []).includes(m.id)
                );

                return (
                  <div
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className="p-4 rounded-2xl border border-[#27272A] bg-[#18181B] hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className={`w-3 h-12 rounded-full ${catStyle.dotColor} shrink-0 mt-0.5`} />
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${catStyle.badgeBg}`}>
                            {evt.category}
                          </span>
                          <span className="text-xs font-semibold text-zinc-400">
                            {formatDateKorean(evt.startDate)}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white">
                          {evt.title}
                        </h3>
                        {evt.description && (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                            {evt.description}
                          </p>
                        )}
                        {/* Creator / Modifier info badge */}
                        <div className="flex items-center space-x-2 text-[11px] text-zinc-500 mt-1.5">
                          <span>입력자: <strong className="text-zinc-300">{evt.createdByName || "팀원"}</strong></span>
                          {evt.updatedByName && (
                            <>
                              <span>•</span>
                              <span className="text-cyan-400">수정자: {evt.updatedByName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 text-xs text-zinc-400 shrink-0 self-end sm:self-center">
                      {/* Assigned Member Avatars */}
                      {assignedList.length > 0 && (
                        <div className="flex items-center space-x-1 bg-[#09090B] border border-[#3F3F46] px-2.5 py-1 rounded-lg">
                          <Users className="w-3.5 h-3.5 text-indigo-400 mr-0.5" />
                          <div className="flex -space-x-1.5">
                            {assignedList.map((m) => (
                              <div
                                key={m.id}
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-2xs"
                                style={{ backgroundColor: m.colorHex }}
                                title={`${m.name} (${m.role})`}
                              >
                                {m.name.slice(0, 1)}
                              </div>
                            ))}
                          </div>
                          <span className="text-[11px] text-zinc-300 font-medium ml-1">
                            {assignedList.map((m) => m.name).join(", ")}
                          </span>
                        </div>
                      )}

                      {evt.location && (
                        <div className="flex items-center space-x-1 bg-[#09090B] border border-[#3F3F46] px-2.5 py-1 rounded-lg">
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          <span className="truncate max-w-[120px]">{evt.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1 bg-[#09090B] border border-[#3F3F46] px-2.5 py-1 rounded-lg font-medium">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{formatTimeOnly(evt.startDate)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>

    </div>
  );
};
