import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  Clipboard,
  Upload,
  RotateCcw,
  Loader2,
  Briefcase,
  GraduationCap,
  Plane,
  HeartPulse,
  AlertCircle,
} from "lucide-react";
import { SAMPLE_DOCUMENTS } from "../data/samples";
import { CalendarEvent } from "../types";

interface DocumentInputPanelProps {
  onParseStart: () => void;
  onParseSuccess: (summary: string, events: (Omit<CalendarEvent, "id" | "createdAt"> & { suggestedMemberNames?: string[] })[]) => void;
  onParseError: (err: string) => void;
  isParsing: boolean;
  teamMembers?: { id: string; name: string; role: string }[];
}

export const DocumentInputPanel: React.FC<DocumentInputPanelProps> = ({
  onParseStart,
  onParseSuccess,
  onParseError,
  isParsing,
  teamMembers,
}) => {
  const [inputText, setInputText] = useState("");
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectSample = (sample: typeof SAMPLE_DOCUMENTS[0]) => {
    setInputText(sample.content);
    setSelectedSampleId(sample.id);
    setErrorMessage(null);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
        setSelectedSampleId(null);
        setErrorMessage(null);
      }
    } catch {
      alert("클립보드 읽기 권한이 필요합니다. 텍스트 상자에 직접 붙여넣어주세요 (Ctrl+V).");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        setSelectedSampleId(null);
        setErrorMessage(null);
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    setInputText("");
    setSelectedSampleId(null);
    setErrorMessage(null);
  };

  const handleParseSchedule = async () => {
    if (!inputText.trim()) {
      setErrorMessage("문서 내용을 입력하거나 샘플을 선택해주세요.");
      return;
    }

    setErrorMessage(null);
    onParseStart();

    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/parse-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          referenceDate: todayStr,
          userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul",
          teamMembers: teamMembers || [],
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "일정 파싱에 실패했습니다.");
      }

      onParseSuccess(data.summary, data.events);
    } catch (err: any) {
      console.error("Parse error:", err);
      const errMsg = err.message || "서버 통신 오류가 발생했습니다.";
      setErrorMessage(errMsg);
      onParseError(errMsg);
    }
  };

  const getSampleIcon = (name: string) => {
    switch (name) {
      case "Briefcase":
        return <Briefcase className="w-3.5 h-3.5 text-blue-500 mr-1.5" />;
      case "GraduationCap":
        return <GraduationCap className="w-3.5 h-3.5 text-purple-500 mr-1.5" />;
      case "Plane":
        return <Plane className="w-3.5 h-3.5 text-amber-500 mr-1.5" />;
      case "HeartPulse":
        return <HeartPulse className="w-3.5 h-3.5 text-rose-500 mr-1.5" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-500 mr-1.5" />;
    }
  };

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 shadow-xs flex flex-col h-full">
      
      {/* Header section */}
      <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-900/50 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Document Input
            </h2>
            <p className="text-xs text-zinc-400">
              회의록, 강의안, 여행계획, 이메일 등 텍스트를 입력하세요
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handlePasteClipboard}
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-zinc-300 bg-[#27272A] hover:bg-zinc-700 rounded-md transition-colors"
            title="클립보드에서 붙여넣기"
          >
            <Clipboard className="w-3.5 h-3.5 mr-1 text-zinc-400" />
            붙여넣기
          </button>

          <label className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-zinc-300 bg-[#27272A] hover:bg-zinc-700 rounded-md cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 mr-1 text-zinc-400" />
            파일
            <input
              type="file"
              accept=".txt,.md,.csv,.log"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {inputText && (
            <button
              onClick={handleClear}
              className="p-1 text-zinc-500 hover:text-zinc-300 rounded-md hover:bg-[#27272A]"
              title="지우기"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sample presets chips */}
      <div className="py-3">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
          💡 빠른 예시 불러오기:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_DOCUMENTS.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            return (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                  isSelected
                    ? "bg-indigo-900/60 border-indigo-500/50 text-indigo-300 shadow-2xs"
                    : "bg-[#09090B] border-[#3F3F46] text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {getSampleIcon(sample.iconName)}
                {sample.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Textarea */}
      <div className="flex-1 relative flex flex-col min-h-[220px]">
        <textarea
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setSelectedSampleId(null);
            setErrorMessage(null);
          }}
          placeholder={`이곳에 일정이 포함된 문서나 메시지를 붙여넣어보세요.

예시:
"다음주 월요일 14:00 팀 전체 회의 (대회의실)
 7월 28일 출장 준비 및 자료 제출
 8월 1일~4일 제주도 여름 휴가"

AI가 날짜, 시간, 위치, 내용을 정확하게 파싱해드립니다.`}
          className="w-full flex-1 p-3.5 text-xs sm:text-sm bg-[#09090B] border border-[#3F3F46] rounded-xl text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed font-mono custom-scrollbar"
        />

        {inputText && (
          <div className="absolute bottom-2.5 right-3 text-[11px] text-zinc-500 bg-[#18181B]/90 px-2 py-0.5 rounded-md border border-[#3F3F46]">
            {inputText.length.toLocaleString()}자
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mt-3 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-snug">{errorMessage}</div>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-4">
        <button
          onClick={handleParseSchedule}
          disabled={isParsing || !inputText.trim()}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center space-x-2 transition-all ${
            isParsing || !inputText.trim()
              ? "bg-zinc-800 text-zinc-600 border border-zinc-700/50 cursor-not-allowed shadow-none"
              : "bg-indigo-600 hover:bg-indigo-500 text-white accent-glow active:scale-[0.99]"
          }`}
        >
          {isParsing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
              <span>AI가 일정을 해석하고 있습니다...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI 일정 파싱하기</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
