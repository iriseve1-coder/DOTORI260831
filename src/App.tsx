import React, { useState, useEffect, useMemo } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { Header } from "./components/Header";
import { TeamMembersBar } from "./components/TeamMembersBar";
import { DocumentInputPanel } from "./components/DocumentInputPanel";
import { CalendarView } from "./components/CalendarView";
import { ParsedResultModal } from "./components/ParsedResultModal";
import { EventDetailModal } from "./components/EventDetailModal";
import { ManualEventModal } from "./components/ManualEventModal";
import { TeamSettingsModal } from "./components/TeamSettingsModal";
import { ActivityLogDrawer } from "./components/ActivityLogDrawer";
import {
  CalendarEvent,
  CategoryType,
  TeamMember,
  ActivityLog,
  DeletedEvent,
  EventRevision,
} from "./types";
import { DEFAULT_TEAM_MEMBERS, DEFAULT_CALENDAR_ID } from "./data/defaultMembers";
import {
  loadEventsFromStorage,
  saveEventsToStorage,
  downloadICSFile,
  loadActiveMemberId,
  saveActiveMemberId,
  loadSavedRoomCode,
  saveRoomCode,
  getChangesSummary,
} from "./utils/calendarUtils";
import { Check, RotateCcw } from "lucide-react";

export default function App() {
  // 5 Team Members State
  const [members, setMembers] = useState<TeamMember[]>(DEFAULT_TEAM_MEMBERS);
  const [currentMemberId, setCurrentMemberId] = useState<string>(() => {
    return loadActiveMemberId() || DEFAULT_TEAM_MEMBERS[0].id;
  });

  // Collaborative Room Code
  const [roomCode, setRoomCode] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get("room");
    if (fromUrl) return fromUrl;
    return loadSavedRoomCode() || DEFAULT_CALENDAR_ID;
  });

  // Events & Activity Logs (Real-time Firestore)
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [trashEvents, setTrashEvents] = useState<DeletedEvent[]>([]);
  const [revisions, setRevisions] = useState<EventRevision[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  const [firestoreConnected, setFirestoreConnected] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | "전체">("전체");
  const [selectedFilterMemberId, setSelectedFilterMemberId] = useState<string | "all" | "mine">("all");

  // Parser state
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<{
    summary: string;
    events: (Omit<CalendarEvent, "id" | "createdAt"> & { suggestedMemberNames?: string[] })[];
  } | null>(null);

  // Modals state
  const [activeEventDetail, setActiveEventDetail] = useState<CalendarEvent | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [defaultDateForNew, setDefaultDateForNew] = useState<string | undefined>(undefined);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);
  const [drawerInitialTab, setDrawerInitialTab] = useState<"logs" | "trash" | "revisions">("logs");

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Member current helper
  const currentMember = useMemo(
    () => members.find((m) => m.id === currentMemberId) || members[0],
    [members, currentMemberId]
  );

  // Keep room code in URL & LocalStorage
  const handleSetRoomCode = (newCode: string) => {
    setRoomCode(newCode);
    saveRoomCode(newCode);
    const url = new URL(window.location.href);
    url.searchParams.set("room", newCode);
    window.history.replaceState({}, "", url.toString());
    showToast(`캘린더 방이 '${newCode}'로 전환되었습니다.`);
  };

  const handleSelectCurrentMember = (memberId: string) => {
    setCurrentMemberId(memberId);
    saveActiveMemberId(memberId);
    const member = members.find((m) => m.id === memberId);
    if (member) {
      showToast(`현재 사용자가 '${member.name} (${member.role})'로 변경되었습니다.`);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 1. Listen to Realtime Events in Firestore
  useEffect(() => {
    setIsSyncing(true);
    const eventsRef = collection(db, "calendars", roomCode, "events");

    const unsubscribe = onSnapshot(
      eventsRef,
      (snapshot) => {
        const loaded: CalendarEvent[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            title: data.title || "",
            startDate: data.startDate || "",
            endDate: data.endDate || "",
            allDay: !!data.allDay,
            category: data.category || "업무",
            priority: data.priority || "medium",
            location: data.location || undefined,
            description: data.description || undefined,
            tags: data.tags || undefined,
            assignedMembers: data.assignedMembers || [DEFAULT_TEAM_MEMBERS[0].id],
            createdById: data.createdById || DEFAULT_TEAM_MEMBERS[0].id,
            createdByName: data.createdByName || DEFAULT_TEAM_MEMBERS[0].name,
            updatedById: data.updatedById || undefined,
            updatedByName: data.updatedByName || undefined,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || undefined,
          });
        });

        // If newly created room with zero events, seed initial team events
        if (loaded.length === 0 && snapshot.empty) {
          seedInitialTeamEvents(roomCode);
        } else {
          setEvents(loaded);
          saveEventsToStorage(loaded);
        }
        setIsSyncing(false);
        setFirestoreConnected(true);
      },
      (error) => {
        console.error("Firestore Events snapshot error:", error);
        setFirestoreConnected(false);
        setIsSyncing(false);
        const local = loadEventsFromStorage();
        if (local && local.length > 0) {
          setEvents(local);
        }
      }
    );

    return () => unsubscribe();
  }, [roomCode]);

  // 2. Listen to Realtime Activity Logs in Firestore
  useEffect(() => {
    const logsRef = collection(db, "calendars", roomCode, "activities");
    const q = query(logsRef, limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logs: ActivityLog[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          logs.push({
            id: docSnap.id,
            calendarId: roomCode,
            action: data.action || "create",
            eventTitle: data.eventTitle || "",
            memberId: data.memberId || "",
            memberName: data.memberName || "팀원",
            memberColor: data.memberColor || "#6366F1",
            timestamp: data.timestamp || new Date().toISOString(),
          });
        });
        logs.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setActivityLogs(logs);
      },
      (err) => {
        console.error("Firestore ActivityLogs snapshot error:", err);
      }
    );

    return () => unsubscribe();
  }, [roomCode]);

  // 3. Listen to Realtime Deleted Events (Trash) in Firestore
  useEffect(() => {
    const trashRef = collection(db, "calendars", roomCode, "trash");
    const q = query(trashRef, limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: DeletedEvent[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            calendarId: roomCode,
            originalEventId: data.originalEventId || "",
            eventData: data.eventData as CalendarEvent,
            deletedById: data.deletedById || "",
            deletedByName: data.deletedByName || "팀원",
            deletedByColor: data.deletedByColor || "#E11D48",
            deletedAt: data.deletedAt || new Date().toISOString(),
          });
        });
        list.sort(
          (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
        );
        setTrashEvents(list);
      },
      (err) => {
        console.error("Firestore Trash snapshot error:", err);
      }
    );

    return () => unsubscribe();
  }, [roomCode]);

  // 4. Listen to Realtime Event Revisions in Firestore
  useEffect(() => {
    const revRef = collection(db, "calendars", roomCode, "revisions");
    const q = query(revRef, limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: EventRevision[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            calendarId: roomCode,
            eventId: data.eventId || "",
            eventTitle: data.eventTitle || "",
            snapshot: data.snapshot as CalendarEvent,
            modifiedById: data.modifiedById || "",
            modifiedByName: data.modifiedByName || "팀원",
            modifiedByColor: data.modifiedByColor || "#06B6D4",
            modifiedAt: data.modifiedAt || new Date().toISOString(),
            changesSummary: data.changesSummary || "내용 수정",
          });
        });
        list.sort(
          (a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
        );
        setRevisions(list);
      },
      (err) => {
        console.error("Firestore Revisions snapshot error:", err);
      }
    );

    return () => unsubscribe();
  }, [roomCode]);

  // Seed sample team events
  const seedInitialTeamEvents = async (targetRoom: string) => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = today.getFullYear();
    const mm = pad(today.getMonth() + 1);
    const dd = pad(today.getDate());

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tMm = pad(tomorrow.getMonth() + 1);
    const tDd = pad(tomorrow.getDate());

    const samples: Omit<CalendarEvent, "id">[] = [
      {
        title: "5인 팀 주간 스프린트 킥오프 회의",
        startDate: `${yyyy}-${mm}-${dd}T10:00`,
        endDate: `${yyyy}-${mm}-${dd}T11:30`,
        allDay: false,
        category: "업무",
        priority: "high",
        location: "3층 대회의실 & Google Meet",
        description: "김민지, 박지훈, 이수아, 정도윤, 최서연 5인 전원 참석. 주간 목표 및 개발 우선순위 조율",
        tags: ["스프린트", "팀전체", "중요"],
        assignedMembers: members.map((m) => m.id),
        createdById: members[0].id,
        createdByName: members[0].name,
        createdAt: new Date().toISOString(),
      },
      {
        title: "신규 공유 캘린더 기능 PRD 기획 검토",
        startDate: `${yyyy}-${mm}-${dd}T14:00`,
        endDate: `${yyyy}-${mm}-${dd}T15:30`,
        allDay: false,
        category: "업무",
        priority: "medium",
        location: "2층 기획 회의실",
        description: "5인 동시 편집 및 파싱 인터페이스 사용자 경험 리뷰",
        tags: ["기획", "PRD"],
        assignedMembers: [members[0].id, members[1].id],
        createdById: members[1].id,
        createdByName: members[1].name,
        createdAt: new Date().toISOString(),
      },
      {
        title: "UI/UX 다크모드 디자인 시스템 고도화",
        startDate: `${yyyy}-${tMm}-${tDd}T11:00`,
        endDate: `${yyyy}-${tMm}-${tDd}T13:00`,
        allDay: false,
        category: "업무",
        priority: "medium",
        location: "Figma 워크스페이스",
        description: "5인 멤버 뱃지 및 캘린더 타일 반응형 스타일 가이드",
        tags: ["디자인", "Figma"],
        assignedMembers: [members[2].id, members[3].id],
        createdById: members[2].id,
        createdByName: members[2].name,
        createdAt: new Date().toISOString(),
      },
      {
        title: "신제품 론칭 사전 등록 프로모션 오픈",
        startDate: `${yyyy}-${tMm}-${tDd}`,
        endDate: `${yyyy}-${tMm}-${tDd}`,
        allDay: true,
        category: "중요",
        priority: "high",
        location: "온라인 채널 및 뉴스레터",
        description: "사전 신청자 대상 얼리억세스 쿠폰 발급 및 SNS 공지",
        tags: ["마케팅", "출시"],
        assignedMembers: [members[0].id, members[4].id],
        createdById: members[4].id,
        createdByName: members[4].name,
        createdAt: new Date().toISOString(),
      },
    ];

    try {
      for (const s of samples) {
        const docId = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        await setDoc(doc(db, "calendars", targetRoom, "events", docId), s);
      }
    } catch (e) {
      console.warn("Could not seed initial events to Firestore, using local:", e);
      setEvents(samples.map((s, i) => ({ ...s, id: `local-evt-${i}` })));
    }
  };

  // Record Activity in Firestore
  const logActivity = async (action: ActivityLog["action"], eventTitle: string) => {
    try {
      const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const logData: ActivityLog = {
        id: logId,
        calendarId: roomCode,
        action,
        eventTitle,
        memberId: currentMember.id,
        memberName: currentMember.name,
        memberColor: currentMember.colorHex,
        timestamp: new Date().toISOString(),
      };
      await setDoc(doc(db, "calendars", roomCode, "activities", logId), logData);
    } catch (e) {
      console.error("Failed to write activity log:", e);
    }
  };

  // Parser handlers
  const handleParseStart = () => {
    setIsParsing(true);
    setParsedData(null);
  };

  const handleParseSuccess = (
    summary: string,
    extractedEvents: (Omit<CalendarEvent, "id" | "createdAt"> & { suggestedMemberNames?: string[] })[]
  ) => {
    setIsParsing(false);
    setParsedData({ summary, events: extractedEvents });
  };

  const handleParseError = (err: string) => {
    setIsParsing(false);
  };

  // Confirm Add Parsed Events
  const handleConfirmAddParsedEvents = async (
    selectedParsed: Omit<CalendarEvent, "id" | "createdAt">[]
  ) => {
    setIsSyncing(true);
    try {
      for (const p of selectedParsed) {
        const docId = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const eventToSave: CalendarEvent = {
          ...p,
          id: docId,
          createdById: currentMember.id,
          createdByName: currentMember.name,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "calendars", roomCode, "events", docId), eventToSave);
      }

      await logActivity("parse", `${selectedParsed.length}개 일정 AI 등록 (입력: ${currentMember.name})`);
      setParsedData(null);
      showToast(`5인 캘린더에 ${selectedParsed.length}개의 새로운 일정이 등록되었습니다! 🎉`);
    } catch (err: any) {
      console.error("Failed to save parsed events to Firestore:", err);
      const fallbackEvents: CalendarEvent[] = selectedParsed.map((p, idx) => ({
        ...p,
        id: `evt-local-${Date.now()}-${idx}`,
        createdById: currentMember.id,
        createdByName: currentMember.name,
        createdAt: new Date().toISOString(),
      }));
      setEvents((prev) => [...fallbackEvents, ...prev]);
      setParsedData(null);
      showToast(`일정이 로컬에 저장되었습니다.`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual Event Save (Create / Update with Revision Snapshot)
  const handleSaveManualEvent = async (
    eventData: Omit<CalendarEvent, "id" | "createdAt">,
    existingId?: string
  ) => {
    setIsSyncing(true);
    try {
      if (existingId) {
        // Update: 1) Save snapshot to revisions collection
        const existingEvent = events.find((e) => e.id === existingId);
        if (existingEvent) {
          const revId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const revision: EventRevision = {
            id: revId,
            calendarId: roomCode,
            eventId: existingId,
            eventTitle: existingEvent.title,
            snapshot: existingEvent,
            modifiedById: currentMember.id,
            modifiedByName: currentMember.name,
            modifiedByColor: currentMember.colorHex,
            modifiedAt: new Date().toISOString(),
            changesSummary: getChangesSummary(existingEvent, eventData),
          };
          await setDoc(doc(db, "calendars", roomCode, "revisions", revId), revision);
        }

        // 2) Update live event in Firestore
        const targetDocRef = doc(db, "calendars", roomCode, "events", existingId);
        const updatedPayload = {
          ...eventData,
          updatedById: currentMember.id,
          updatedByName: currentMember.name,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(targetDocRef, updatedPayload, { merge: true });
        await logActivity("update", `${eventData.title} (수정: ${currentMember.name})`);
        showToast("일정이 수정되어 5인 캘린더에 동기화되었습니다. (이전 버전 보관됨)");
      } else {
        // Create
        const docId = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const newEvt: CalendarEvent = {
          ...eventData,
          id: docId,
          createdById: currentMember.id,
          createdByName: currentMember.name,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "calendars", roomCode, "events", docId), newEvt);
        await logActivity("create", `${eventData.title} (입력: ${currentMember.name})`);
        showToast(`새 일정이 5인 캘린더에 실시간 등록되었습니다.`);
      }
    } catch (err) {
      console.error("Save manual event Firestore error:", err);
      if (existingId) {
        setEvents((prev) =>
          prev.map((e) => (e.id === existingId ? { ...e, ...eventData } : e))
        );
      } else {
        const localEvt: CalendarEvent = {
          ...eventData,
          id: `local-${Date.now()}`,
          createdById: currentMember.id,
          createdByName: currentMember.name,
          createdAt: new Date().toISOString(),
        };
        setEvents((prev) => [localEvt, ...prev]);
      }
      showToast("일정이 저장되었습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete Event (Safe Delete -> Move to Trash collection)
  const handleDeleteEvent = async (id: string) => {
    const targetEvent = events.find((e) => e.id === id);
    if (!targetEvent) return;

    setIsSyncing(true);
    try {
      // 1) Save to trash collection
      const trashId = `trash-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const trashItem: DeletedEvent = {
        id: trashId,
        calendarId: roomCode,
        originalEventId: targetEvent.id,
        eventData: targetEvent,
        deletedById: currentMember.id,
        deletedByName: currentMember.name,
        deletedByColor: currentMember.colorHex,
        deletedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "calendars", roomCode, "trash", trashId), trashItem);

      // 2) Delete from active events
      await deleteDoc(doc(db, "calendars", roomCode, "events", id));
      await logActivity("delete", `"${targetEvent.title}" 삭제됨 (삭제: ${currentMember.name})`);
      
      showToast(`"${targetEvent.title}" 일정이 삭제되었습니다. (이력 및 복구 탭에서 복원 가능)`);
    } catch (err) {
      console.error("Delete event Firestore error:", err);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      showToast("일정이 삭제되었습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Restore Event from Trash
  const handleRestoreEvent = async (trashId: string) => {
    const trashItem = trashEvents.find((t) => t.id === trashId);
    if (!trashItem) return;

    setIsSyncing(true);
    try {
      const restoredEvent = trashItem.eventData;
      const targetId = restoredEvent.id || trashItem.originalEventId || `evt-${Date.now()}`;
      
      // 1) Restore to events collection
      await setDoc(doc(db, "calendars", roomCode, "events", targetId), {
        ...restoredEvent,
        id: targetId,
        updatedById: currentMember.id,
        updatedByName: currentMember.name,
        updatedAt: new Date().toISOString(),
      });

      // 2) Remove from trash
      await deleteDoc(doc(db, "calendars", roomCode, "trash", trashId));

      // 3) Log activity
      await logActivity("restore", `"${restoredEvent.title}" 복구 완료 (복구: ${currentMember.name})`);

      showToast(`"${restoredEvent.title}" 일정이 캘린더에 성공적으로 복구되었습니다! 🔄`);
    } catch (err) {
      console.error("Restore event Firestore error:", err);
      showToast("일정 복구 중 오류가 발생했습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Permanent Delete Trash Item
  const handlePermanentDeleteTrash = async (trashId: string) => {
    try {
      await deleteDoc(doc(db, "calendars", roomCode, "trash", trashId));
      showToast("휴지통 항목이 완전 삭제되었습니다.");
    } catch (err) {
      console.error("Failed to permanently delete trash item:", err);
    }
  };

  // Clear Entire Trash
  const handleClearTrash = async () => {
    if (!confirm("휴지통의 모든 삭제된 일정을 영구적으로 삭제하시겠습니까?")) return;
    try {
      for (const item of trashEvents) {
        await deleteDoc(doc(db, "calendars", roomCode, "trash", item.id));
      }
      showToast("휴지통을 비웠습니다.");
    } catch (err) {
      console.error("Failed to clear trash:", err);
    }
  };

  // Revert Event to a Historical Revision
  const handleRevertRevision = async (rev: EventRevision) => {
    setIsSyncing(true);
    try {
      const currentLive = events.find((e) => e.id === rev.eventId);
      if (currentLive) {
        // Save current live as a revision before rollback
        const rollbackRevId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const prevSnapshotRev: EventRevision = {
          id: rollbackRevId,
          calendarId: roomCode,
          eventId: currentLive.id,
          eventTitle: currentLive.title,
          snapshot: currentLive,
          modifiedById: currentMember.id,
          modifiedByName: currentMember.name,
          modifiedByColor: currentMember.colorHex,
          modifiedAt: new Date().toISOString(),
          changesSummary: "과거 버전 복원 전 상태 저장",
        };
        await setDoc(doc(db, "calendars", roomCode, "revisions", rollbackRevId), prevSnapshotRev);
      }

      // Revert event to revision snapshot
      const restoredPayload = {
        ...rev.snapshot,
        updatedById: currentMember.id,
        updatedByName: currentMember.name,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "calendars", roomCode, "events", rev.eventId), restoredPayload);
      await logActivity("revert", `"${rev.eventTitle}" 과거 버전으로 복원됨 (${currentMember.name})`);

      showToast(`"${rev.eventTitle}" 일정이 과거 버전으로 복원되었습니다! ⏪`);
      if (activeEventDetail && activeEventDetail.id === rev.eventId) {
        setActiveEventDetail(restoredPayload);
      }
    } catch (err) {
      console.error("Revert revision Firestore error:", err);
      showToast("버전 복원 중 오류가 발생했습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Quick Self-Assign Toggle from Detail Modal
  const handleToggleSelfAssign = async (eventId: string, assigned: boolean) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    let updatedAssigned: string[];
    if (assigned) {
      updatedAssigned = Array.from(new Set([...(target.assignedMembers || []), currentMemberId]));
    } else {
      updatedAssigned = (target.assignedMembers || []).filter((id) => id !== currentMemberId);
    }

    try {
      await setDoc(
        doc(db, "calendars", roomCode, "events", eventId),
        { assignedMembers: updatedAssigned },
        { merge: true }
      );
      await logActivity(
        "update",
        `${target.title} (${assigned ? "내 담당 추가" : "내 담당 제외"})`
      );
      showToast(
        assigned
          ? `[${target.title}] 일정의 담당자로 추가되었습니다.`
          : `[${target.title}] 일정의 담당자에서 제외되었습니다.`
      );
      if (activeEventDetail && activeEventDetail.id === eventId) {
        setActiveEventDetail({ ...activeEventDetail, assignedMembers: updatedAssigned });
      }
    } catch (err) {
      console.error("Failed to update assignee:", err);
    }
  };

  // Clear all events
  const handleClearAll = async () => {
    if (confirm("정말로 5인 공유 캘린더의 모든 일정을 초기화하시겠습니까? (삭제된 일정은 휴지통에서 복구 가능)")) {
      setIsSyncing(true);
      try {
        for (const evt of events) {
          const trashId = `trash-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          await setDoc(doc(db, "calendars", roomCode, "trash", trashId), {
            id: trashId,
            calendarId: roomCode,
            originalEventId: evt.id,
            eventData: evt,
            deletedById: currentMember.id,
            deletedByName: currentMember.name,
            deletedByColor: currentMember.colorHex,
            deletedAt: new Date().toISOString(),
          });
          await deleteDoc(doc(db, "calendars", roomCode, "events", evt.id));
        }
        await logActivity("delete", "캘린더 전체 일정 초기화 (휴지통 보관)");
        showToast("모든 일정이 휴지통으로 이동되었습니다.");
      } catch (e) {
        setEvents([]);
        showToast("모든 일정이 초기화되었습니다.");
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Download all ICS
  const handleDownloadAllICS = () => {
    if (events.length === 0) return;
    downloadICSFile(
      events,
      `DocToCal-5인공유캘린더-${roomCode}-${new Date().toISOString().split("T")[0]}.ics`
    );
    showToast("iCal (.ics) 파일 다운로드가 시작되었습니다.");
  };

  // Filter events by Search, Category, and 5 Team Members
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // 1. Category Filter
      const matchCategory =
        selectedCategory === "전체" || evt.category === selectedCategory;

      // 2. Member Filter
      let matchMember = true;
      if (selectedFilterMemberId === "mine") {
        matchMember = (evt.assignedMembers || []).includes(currentMemberId);
      } else if (selectedFilterMemberId !== "all") {
        matchMember = (evt.assignedMembers || []).includes(selectedFilterMemberId);
      }

      // 3. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        evt.title.toLowerCase().includes(q) ||
        (evt.description && evt.description.toLowerCase().includes(q)) ||
        (evt.location && evt.location.toLowerCase().includes(q)) ||
        (evt.createdByName && evt.createdByName.toLowerCase().includes(q)) ||
        (evt.updatedByName && evt.updatedByName.toLowerCase().includes(q)) ||
        (evt.tags && evt.tags.some((t) => t.toLowerCase().includes(q)));

      return matchCategory && matchMember && matchQuery;
    });
  }, [events, selectedCategory, selectedFilterMemberId, currentMemberId, searchQuery]);

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Top Header with Search, Category Filter & iCal Export */}
      <Header
        totalEventsCount={events.length}
        onDownloadAllICS={handleDownloadAllICS}
        onClearAll={handleClearAll}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* 5-Member Team Collaborative Bar */}
      <TeamMembersBar
        members={members}
        currentMemberId={currentMemberId}
        onSelectCurrentMember={handleSelectCurrentMember}
        selectedFilterMemberId={selectedFilterMemberId}
        onSelectFilterMember={setSelectedFilterMemberId}
        roomCode={roomCode}
        isSyncing={isSyncing}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenActivityLogs={() => {
          setDrawerInitialTab("logs");
          setActivityDrawerOpen(true);
        }}
        activityCount={activityLogs.length}
        trashCount={trashEvents.length}
        revisionsCount={revisions.length}
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
              teamMembers={members.map((m) => ({ id: m.id, name: m.name, role: m.role }))}
            />
          </section>

          {/* Right Column: Calendar Dashboard */}
          <section className="lg:col-span-7 h-full flex flex-col min-h-[550px]">
            <CalendarView
              events={filteredEvents}
              members={members}
              currentMemberId={currentMemberId}
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
          members={members}
          currentMemberId={currentMemberId}
          onConfirmAdd={handleConfirmAddParsedEvents}
          onClose={() => setParsedData(null)}
        />
      )}

      {/* Event Detail Modal */}
      {activeEventDetail && (
        <EventDetailModal
          event={activeEventDetail}
          members={members}
          currentMemberId={currentMemberId}
          revisions={revisions}
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
          onToggleSelfAssign={handleToggleSelfAssign}
          onRevertRevision={handleRevertRevision}
        />
      )}

      {/* Manual Event Creator / Editor Modal */}
      {manualModalOpen && (
        <ManualEventModal
          initialEvent={editingEvent}
          defaultDate={defaultDateForNew}
          members={members}
          currentMemberId={currentMemberId}
          onSave={handleSaveManualEvent}
          onClose={() => {
            setManualModalOpen(false);
            setEditingEvent(null);
            setDefaultDateForNew(undefined);
          }}
        />
      )}

      {/* Team Settings Modal */}
      <TeamSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        members={members}
        onSaveMembers={(updated) => {
          setMembers(updated);
          showToast("5인 팀 멤버 프로필 정보가 저장되었습니다.");
        }}
        roomCode={roomCode}
        onChangeRoomCode={handleSetRoomCode}
      />

      {/* Activity & Recovery Drawer */}
      <ActivityLogDrawer
        isOpen={activityDrawerOpen}
        onClose={() => setActivityDrawerOpen(false)}
        logs={activityLogs}
        trashEvents={trashEvents}
        revisions={revisions}
        members={members}
        initialTab={drawerInitialTab}
        onRestoreEvent={handleRestoreEvent}
        onPermanentDeleteTrash={handlePermanentDeleteTrash}
        onClearTrash={handleClearTrash}
        onRevertRevision={handleRevertRevision}
        onClearLogs={() => setActivityLogs([])}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18181B] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs font-bold animate-in slide-in-from-bottom-5 duration-200 border border-indigo-500/40">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
