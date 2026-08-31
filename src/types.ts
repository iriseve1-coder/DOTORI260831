export type CategoryType = "업무" | "개인" | "학업" | "여행" | "건강" | "중요" | "기타";
export type PriorityType = "high" | "medium" | "low";
export type ConfidenceType = "HIGH" | "MEDIUM" | "LOW";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  colorHex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
  statusText?: string;
}

export interface CalendarEvent {
  id: string;
  calendarId?: string;
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
  assignedMembers: string[]; // List of member IDs (1 to 5 members or all)
  createdById?: string;
  createdByName?: string;
  updatedById?: string;
  updatedByName?: string;
  sourceText?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  calendarId?: string;
  memberId: string;
  memberName: string;
  memberColor: string;
  action: "create" | "update" | "delete" | "parse" | "restore" | "revert";
  eventTitle: string;
  timestamp: string;
}

export interface DeletedEvent {
  id: string; // trash item ID
  calendarId?: string;
  originalEventId: string;
  eventData: CalendarEvent;
  deletedById: string;
  deletedByName: string;
  deletedByColor?: string;
  deletedAt: string;
}

export interface EventRevision {
  id: string; // revision ID
  calendarId?: string;
  eventId: string;
  eventTitle: string;
  snapshot: CalendarEvent;
  modifiedById: string;
  modifiedByName: string;
  modifiedByColor?: string;
  modifiedAt: string;
  changesSummary?: string;
}

export interface SharedCalendarDoc {
  id: string;
  name: string;
  roomCode: string;
  members: TeamMember[];
  updatedAt: string;
  createdAt: string;
}

export interface ParseScheduleResponse {
  success: boolean;
  summary: string;
  events: (Omit<CalendarEvent, "id" | "createdAt"> & { suggestedMemberNames?: string[] })[];
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
