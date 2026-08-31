import React from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Tag,
  X,
  Trash2,
  Edit2,
  ExternalLink,
  Download,
  CheckCircle2,
} from "lucide-react";
import { CalendarEvent, CategoryType, PriorityType } from "../types";
import {
  getCategoryStyle,
  getPriorityBadge,
  formatDateKorean,
  getGoogleCalendarUrl,
  downloadICSFile,
} from "../utils/calendarUtils";

interface EventDetailModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onEdit,
  onDelete,
}) => {
  const catStyle = getCategoryStyle(event.category as CategoryType);
  const priStyle = getPriorityBadge(event.priority as PriorityType);
  const googleCalUrl = getGoogleCalendarUrl(event);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0F0F11] border border-[#27272A] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-zinc-200">
        
        {/* Top Accent bar */}
        <div className={`h-2 ${catStyle.dotColor}`} />

        <div className="p-6">
          
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-4">
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
          <h2 className="text-lg font-bold text-white mb-4 leading-snug">
            {event.title}
          </h2>

          {/* Date, Time & Location Card */}
          <div className="bg-[#18181B] rounded-xl p-4 space-y-3 border border-[#27272A] text-xs sm:text-sm mb-5">
            
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
            <div className="mb-5">
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
            <div className="mb-5 flex flex-wrap gap-1.5">
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
          <div className="pt-4 border-t border-[#27272A] flex flex-col sm:flex-row gap-2">
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

          {/* Action Buttons */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#27272A]">
            <button
              onClick={() => {
                onDelete(event.id);
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-950/40 rounded-lg flex items-center space-x-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>일정 삭제</span>
            </button>

            <button
              onClick={() => onEdit(event)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 accent-glow"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>일정 수정</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
