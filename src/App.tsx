import React, { useState, useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { DocumentInputPanel } from "./components/DocumentInputPanel";
import { CalendarView } from "./components/CalendarView";
import { ParsedResultModal } from "./components/ParsedResultModal";
import { EventDetailModal } from "./components/EventDetailModal";
import { ManualEventModal } from "./components/ManualEventModal";
import { CalendarEvent, CategoryType } from "./types";
import {
  loadEventsFromStorage,
  saveEventsToStorage,
  downloadICSFile,
} from "./utils/calendarUtils";
import { Check, Sparkles, Calendar as CalendarIcon, Info } from "lucide-react";

export default function App() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | "전체">("전체");

  // Parser state
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<{
    summary: string;
    events: Omit<CalendarEvent, "id" | "createdAt">[];
  } | null>(null);

  // Modals state
  const [activeEventDetail, setActiveEventDetail] = useState<CalendarEvent | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [defaultDateForNew, setDefaultDateForNew] = useState<string | undefined>(undefined);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load events on mount
  useEffect(() => {
    const saved = loadEventsFromStorage();
    if (saved && saved.length > 0) {
      setEvents(saved);
    }
  }, []);

  // Save events on change
  useEffect(() => {
    saveEventsToStorage(events);
  }, [events]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Parser handlers
  const handleParseStart = () => {
    setIsParsing(true);
    setParsedData(null);
  };

  const handleParseSuccess = (
    summary: string,
    extractedEvents: Omit<CalendarEvent, "id" | "createdAt">[]
  ) => {
    setIsParsing(false);
    setParsedData({ summary, events: extractedEvents });
  };

  const handleParseError = (err: string) => {
    setIsParsing(false);
  };

  const handleConfirmAddParsedEvents = (
    selectedParsed: Omit<CalendarEvent, "id" | "createdAt">[]
  ) => {
    const newEvents: CalendarEvent[] = selectedParsed.map((p, idx) => ({
      ...p,
      id: `evt-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    }));

    setEvents((prev) => [...newEvents, ...prev]);
    setParsedData(null);
    showToast(`달력에 ${newEvents.length}개의 새로운 일정이 등록되었습니다! 🎉`);
  };

  // Manual event save
  const handleSaveManualEvent = (
    eventData: Omit<CalendarEvent, "id" | "createdAt">,
    existingId?: string
  ) => {
    if (existingId) {
      // Update
      setEvents((prev) =>
        prev.map((e) => (e.id === existingId ? { ...e, ...eventData } : e))
      );
      showToast("일정이 수정되었습니다.");
    } else {
      // Create
      const newEvt: CalendarEvent = {
        ...eventData,
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      setEvents((prev) => [newEvt, ...prev]);
      showToast("새 일정이 등록되었습니다.");
    }
  };

  // Delete event
  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    showToast("일정이 삭제되었습니다.");
  };

  const handleClearAll = () => {
    if (confirm("정말로 등록된 모든 일정을 삭제하시겠습니까?")) {
      setEvents([]);
      showToast("모든 일정이 초기화되었습니다.");
    }
  };

  const handleDownloadAllICS = () => {
    if (events.length === 0) return;
    downloadICSFile(events, `DocToCal-전체일정-${new Date().toISOString().split("T")[0]}.ics`);
    showToast("iCal (.ics) 파일 다운로드가 시작되었습니다.");
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchCategory = selectedCategory === "전체" || evt.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        evt.title.toLowerCase().includes(q) ||
        (evt.description && evt.description.toLowerCase().includes(q)) ||
        (evt.location && evt.location.toLowerCase().includes(q)) ||
        (evt.tags && evt.tags.some((t) => t.toLowerCase().includes(q)));

      return matchCategory && matchQuery;
    });
  }, [events, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        totalEventsCount={events.length}
        onDownloadAllICS={handleDownloadAllICS}
        onClearAll={handleClearAll}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Main App Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col gap-6">
        
        {/* Split View Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
          
          {/* Left Column: Text Input & Parser */}
          <section className="lg:col-span-5 h-full flex flex-col min-h-[460px]">
            <DocumentInputPanel
              onParseStart={handleParseStart}
              onParseSuccess={handleParseSuccess}
              onParseError={handleParseError}
              isParsing={isParsing}
            />
          </section>

          {/* Right Column: Calendar Dashboard */}
          <section className="lg:col-span-7 h-full flex flex-col min-h-[550px]">
            <CalendarView
              events={filteredEvents}
              onSelectEvent={(evt) => setActiveEventDetail(evt)}
              onAddEventForDate={(dateStr) => {
                setDefaultDateForNew(dateStr);
                setEditingEvent(null);
                setManualModalOpen(true);
              }}
            />
          </section>

        </div>

      </main>

      {/* Parsed Result Review Modal */}
      {parsedData && (
        <ParsedResultModal
          summary={parsedData.summary}
          parsedEvents={parsedData.events}
          onConfirmAdd={handleConfirmAddParsedEvents}
          onClose={() => setParsedData(null)}
        />
      )}

      {/* Event Detail Modal */}
      {activeEventDetail && (
        <EventDetailModal
          event={activeEventDetail}
          onClose={() => setActiveEventDetail(null)}
          onEdit={(evt) => {
            setActiveEventDetail(null);
            setEditingEvent(evt);
            setManualModalOpen(true);
          }}
          onDelete={(id) => {
            handleDeleteEvent(id);
            setActiveEventDetail(null);
          }}
        />
      )}

      {/* Manual Event Creator / Editor Modal */}
      {manualModalOpen && (
        <ManualEventModal
          initialEvent={editingEvent}
          defaultDate={defaultDateForNew}
          onSave={handleSaveManualEvent}
          onClose={() => {
            setManualModalOpen(false);
            setEditingEvent(null);
            setDefaultDateForNew(undefined);
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-bold animate-in slide-in-from-bottom-5 duration-200 border border-slate-700/50">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
