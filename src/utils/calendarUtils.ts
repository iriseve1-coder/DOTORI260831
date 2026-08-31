import { CalendarEvent, CategoryType, PriorityType } from "../types";

export interface CategoryStyle {
  label: CategoryType;
  bgColor: string;
  textColor: string;
  borderColor: string;
  badgeBg: string;
  dotColor: string;
}

export const CATEGORY_STYLES: Record<CategoryType, CategoryStyle> = {
  업무: {
    label: "업무",
    bgColor: "bg-indigo-900/40 hover:bg-indigo-900/60 border-indigo-500/30",
    textColor: "text-indigo-300",
    borderColor: "border-indigo-500/30",
    badgeBg: "bg-indigo-900/60 text-indigo-300 border border-indigo-500/30",
    dotColor: "bg-indigo-500",
  },
  개인: {
    label: "개인",
    bgColor: "bg-emerald-900/40 hover:bg-emerald-900/60 border-emerald-500/30",
    textColor: "text-emerald-300",
    borderColor: "border-emerald-500/30",
    badgeBg: "bg-emerald-900/60 text-emerald-300 border border-emerald-500/30",
    dotColor: "bg-emerald-500",
  },
  학업: {
    label: "학업",
    bgColor: "bg-purple-900/40 hover:bg-purple-900/60 border-purple-500/30",
    textColor: "text-purple-300",
    borderColor: "border-purple-500/30",
    badgeBg: "bg-purple-900/60 text-purple-300 border border-purple-500/30",
    dotColor: "bg-purple-500",
  },
  여행: {
    label: "여행",
    bgColor: "bg-amber-900/40 hover:bg-amber-900/60 border-amber-500/30",
    textColor: "text-amber-300",
    borderColor: "border-amber-500/30",
    badgeBg: "bg-amber-900/60 text-amber-300 border border-amber-500/30",
    dotColor: "bg-amber-500",
  },
  건강: {
    label: "건강",
    bgColor: "bg-rose-900/40 hover:bg-rose-900/60 border-rose-500/30",
    textColor: "text-rose-300",
    borderColor: "border-rose-500/30",
    badgeBg: "bg-rose-900/60 text-rose-300 border border-rose-500/30",
    dotColor: "bg-rose-500",
  },
  중요: {
    label: "중요",
    bgColor: "bg-red-900/40 hover:bg-red-900/60 border-red-500/30",
    textColor: "text-red-300",
    borderColor: "border-red-500/30",
    badgeBg: "bg-red-900/60 text-red-300 border border-red-500/30",
    dotColor: "bg-red-500",
  },
  기타: {
    label: "기타",
    bgColor: "bg-zinc-800/60 hover:bg-zinc-800/90 border-zinc-700/50",
    textColor: "text-zinc-300",
    borderColor: "border-zinc-700/50",
    badgeBg: "bg-zinc-800 text-zinc-300 border border-zinc-700/50",
    dotColor: "bg-zinc-500",
  },
};

export function getCategoryStyle(category: CategoryType): CategoryStyle {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES["기타"];
}

export function getPriorityBadge(priority: PriorityType) {
  switch (priority) {
    case "high":
      return { text: "높음", color: "text-red-300 bg-red-900/40 border-red-500/30" };
    case "medium":
      return { text: "보통", color: "text-amber-300 bg-amber-900/40 border-amber-500/30" };
    case "low":
    default:
      return { text: "낮음", color: "text-zinc-400 bg-zinc-800/60 border-zinc-700/50" };
  }
}

// Local storage management
const STORAGE_KEY = "doctocal_events_v1";

export function loadEventsFromStorage(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load events from localStorage:", err);
    return [];
  }
}

export function saveEventsToStorage(events: CalendarEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    console.error("Failed to save events to localStorage:", err);
  }
}

// Formatters
export function formatDateKorean(dateStr: string, includeTime = true): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayName = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];

    let formatted = `${year}년 ${month}월 ${day}일 (${dayName})`;

    if (includeTime && dateStr.includes("T")) {
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? "오후" : "오전";
      const displayHour = hours % 12 || 12;
      const minStr = minutes > 0 ? ` ${minutes}분` : "";
      formatted += ` ${ampm} ${displayHour}시${minStr}`;
    }

    return formatted;
  } catch {
    return dateStr;
  }
}

export function formatTimeOnly(dateStr: string): string {
  if (!dateStr || !dateStr.includes("T")) return "종일";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? "오후" : "오전";
    const displayHour = hours % 12 || 12;
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${ampm} ${displayHour}:${minStr}`;
  } catch {
    return "";
  }
}

// Check if a date string falls on a specific YYYY-MM-DD
export function isEventOnDate(event: CalendarEvent, targetYear: number, targetMonth: number, targetDay: number): boolean {
  if (!event.startDate) return false;

  const targetStr = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
  const startDayStr = event.startDate.split("T")[0];
  const endDayStr = (event.endDate || event.startDate).split("T")[0];

  return targetStr >= startDayStr && targetStr <= endDayStr;
}

// Export to iCalendar (.ics) format
export function generateICSContent(events: CalendarEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DocToCal//Schedule Parser App//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  events.forEach((evt) => {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:evt-${evt.id}@doctocal`);
    lines.push(`SUMMARY:${evt.title.replace(/\n/g, " ")}`);

    if (evt.description) {
      lines.push(`DESCRIPTION:${evt.description.replace(/\n/g, "\\n")}`);
    }
    if (evt.location) {
      lines.push(`LOCATION:${evt.location.replace(/\n/g, " ")}`);
    }

    // Format DTSTART & DTEND
    if (evt.allDay) {
      const startClean = evt.startDate.split("T")[0].replace(/-/g, "");
      const endClean = (evt.endDate || evt.startDate).split("T")[0].replace(/-/g, "");
      lines.push(`DTSTART;VALUE=DATE:${startClean}`);
      lines.push(`DTEND;VALUE=DATE:${endClean}`);
    } else {
      const sDate = new Date(evt.startDate);
      const eDate = evt.endDate ? new Date(evt.endDate) : new Date(sDate.getTime() + 3600000);
      
      const formatISOCompact = (d: Date) => {
        return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      };

      lines.push(`DTSTART:${formatISOCompact(sDate)}`);
      lines.push(`DTEND:${formatISOCompact(eDate)}`);
    }

    lines.push(`CATEGORIES:${evt.category}`);
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICSFile(events: CalendarEvent[], filename = "doctocal-schedule.ics") {
  const content = generateICSContent(events);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate Google Calendar Link
export function getGoogleCalendarUrl(event: CalendarEvent): string {
  const baseUrl = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams();
  params.append("action", "TEMPLATE");
  params.append("text", event.title);

  let detailsText = event.description || "";
  if (event.tags && event.tags.length > 0) {
    detailsText += `\n태그: ${event.tags.join(", ")}`;
  }
  params.append("details", detailsText);

  if (event.location) {
    params.append("location", event.location);
  }

  if (event.allDay) {
    const s = event.startDate.split("T")[0].replace(/-/g, "");
    let e = (event.endDate || event.startDate).split("T")[0].replace(/-/g, "");
    // Google Calendar requires end date + 1 day for all-day events
    const eD = new Date(event.endDate || event.startDate);
    eD.setDate(eD.getDate() + 1);
    e = eD.toISOString().split("T")[0].replace(/-/g, "");
    params.append("dates", `${s}/${e}`);
  } else {
    const sD = new Date(event.startDate);
    const eD = event.endDate ? new Date(event.endDate) : new Date(sD.getTime() + 3600000);
    const formatISOCompact = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    params.append("dates", `${formatISOCompact(sD)}/${formatISOCompact(eD)}`);
  }

  return `${baseUrl}?${params.toString()}`;
}
