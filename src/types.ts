export type CategoryType = "업무" | "개인" | "학업" | "여행" | "건강" | "중요" | "기타";
export type PriorityType = "high" | "medium" | "low";
export type ConfidenceType = "HIGH" | "MEDIUM" | "LOW";

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string; // ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:mm
  endDate: string; // ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:mm
  allDay: boolean;
  location?: string;
  description?: string;
  category: CategoryType;
  priority: PriorityType;
  confidence?: ConfidenceType;
  tags?: string[];
  sourceText?: string;
  createdAt: string;
}

export interface ParseScheduleResponse {
  success: boolean;
  summary: string;
  events: Omit<CalendarEvent, "id" | "createdAt">[];
  error?: string;
}

export interface SampleDocument {
  id: string;
  title: string;
  badge: string;
  iconName: string;
  content: string;
}

export type CalendarViewMode = "month" | "week" | "day" | "agenda";
