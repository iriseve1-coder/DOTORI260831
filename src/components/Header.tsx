import React from "react";
import { Calendar, Download, Trash2, Sparkles, Search, Filter } from "lucide-react";
import { CategoryType } from "../types";

interface HeaderProps {
  totalEventsCount: number;
  onDownloadAllICS: () => void;
  onClearAll: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: CategoryType | "전체";
  setSelectedCategory: (cat: CategoryType | "전체") => void;
}

const CATEGORIES: (CategoryType | "전체")[] = [
  "전체",
  "업무",
  "개인",
  "학업",
  "여행",
  "건강",
  "중요",
  "기타",
];

export const Header: React.FC<HeaderProps> = ({
  totalEventsCount,
  onDownloadAllICS,
  onClearAll,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
}) => {
  return (
    <header className="bg-[#0F0F11] border-b border-[#27272A] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  DocToCal <span className="text-indigo-400 text-sm font-semibold ml-1">5인 공유 캘린더</span>
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-900/40 text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="w-3 h-3 mr-1 text-indigo-400" />
                  실시간 협업
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                문서 내용을 붙여넣으면 일정만 파싱하여 5명이 함께 보고 실시간 저장합니다
              </p>
            </div>
          </div>

          {/* Quick Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56 min-w-[160px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="일정 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#18181B] border border-[#3F3F46] rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="pl-3 pr-8 py-1.5 text-xs bg-[#18181B] border border-[#3F3F46] rounded-lg text-zinc-200 focus:outline-none focus:border-indigo-500 appearance-none font-medium transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#18181B] text-zinc-200">
                    {cat === "전체" ? "모든 카테고리" : cat}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>

            {/* Event Count Badge */}
            <div className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#18181B] border border-[#3F3F46] text-zinc-300">
              저장된 일정 <span className="ml-1 text-indigo-400 font-bold">{totalEventsCount}개</span>
            </div>

            {/* ICS Download Button */}
            {totalEventsCount > 0 && (
              <>
                <button
                  onClick={onDownloadAllICS}
                  title="모든 일정을 iCal(.ics) 파일로 다운로드하여 구글/애플 달력에 불러오기"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-900/40 hover:bg-indigo-900/70 text-indigo-300 border border-indigo-500/30 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  iCal (.ics) 내보내기
                </button>

                <button
                  onClick={onClearAll}
                  title="모든 일정 삭제"
                  className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
