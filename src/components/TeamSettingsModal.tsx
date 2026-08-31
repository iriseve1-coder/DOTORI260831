import React, { useState } from "react";
import { X, Users, Save, RefreshCw, Key, ShieldCheck, Check } from "lucide-react";
import { TeamMember } from "../types";

interface TeamSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: TeamMember[];
  onSaveMembers: (updatedMembers: TeamMember[]) => void;
  roomCode: string;
  onChangeRoomCode: (newCode: string) => void;
}

export const TeamSettingsModal: React.FC<TeamSettingsModalProps> = ({
  isOpen,
  onClose,
  members,
  onSaveMembers,
  roomCode,
  onChangeRoomCode,
}) => {
  const [editedMembers, setEditedMembers] = useState<TeamMember[]>(members);
  const [currentRoomInput, setCurrentRoomInput] = useState(roomCode);
  const [roomChangeSuccess, setRoomChangeSuccess] = useState(false);

  if (!isOpen) return null;

  const handleMemberChange = (id: string, field: keyof TeamMember, value: string) => {
    setEditedMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSave = () => {
    onSaveMembers(editedMembers);
    if (currentRoomInput.trim() && currentRoomInput.trim() !== roomCode) {
      onChangeRoomCode(currentRoomInput.trim());
      setRoomChangeSuccess(true);
      setTimeout(() => setRoomChangeSuccess(false), 2000);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0F0F11] border border-[#27272A] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#18181B] border-b border-[#27272A] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">5인 팀 협업 및 캘린더 설정</h2>
              <p className="text-xs text-zinc-400">
                팀원 5명의 이름, 역할, 상태 메시지를 수정하고 캘린더 공유 코드를 관리합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Room Code Management */}
          <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-white">공유 캘린더 방 코드 (Room Code)</span>
              </div>
              <span className="text-xs text-zinc-500">
                5명이 같은 코드를 입력하면 동일한 캘린더를 공유합니다.
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={currentRoomInput}
                onChange={(e) => setCurrentRoomInput(e.target.value)}
                placeholder="공유 캘린더 방 이름 (예: my-sprint-team)"
                className="flex-1 px-3 py-2 text-xs bg-[#09090B] border border-[#3F3F46] rounded-xl text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const randomCode = `team-${Math.random().toString(36).substring(2, 8)}`;
                  setCurrentRoomInput(randomCode);
                }}
                className="px-3 py-2 text-xs font-semibold bg-[#27272A] hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>새 코드 생성</span>
              </button>
            </div>
            {roomChangeSuccess && (
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 방 코드가 변경되었습니다.
              </p>
            )}
          </div>

          {/* Section 2: 5 Team Members Config */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                5인 팀 멤버 프로필 설정
              </h3>
              <span className="text-xs text-zinc-400">총 5명 고정 멤버</span>
            </div>

            <div className="space-y-3">
              {editedMembers.map((member, idx) => (
                <div
                  key={member.id}
                  className="p-3.5 rounded-xl bg-[#18181B] border border-[#27272A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    {/* Colored Avatar */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-xs shrink-0"
                      style={{ backgroundColor: member.colorHex }}
                    >
                      {member.name.slice(0, 2) || `M${idx + 1}`}
                    </div>

                    <div className="flex-1 sm:w-36">
                      <label className="block text-[10px] text-zinc-500 font-medium">
                        멤버 {idx + 1} 이름
                      </label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleMemberChange(member.id, "name", e.target.value)}
                        className="w-full mt-0.5 px-2.5 py-1 text-xs bg-[#09090B] border border-[#3F3F46] rounded-lg text-white font-semibold focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Role & Status Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:flex-1">
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-medium">
                        역할 / 직무
                      </label>
                      <input
                        type="text"
                        value={member.role}
                        onChange={(e) => handleMemberChange(member.id, "role", e.target.value)}
                        placeholder="예: PM, 개발, 디자인"
                        className="w-full mt-0.5 px-2.5 py-1 text-xs bg-[#09090B] border border-[#3F3F46] rounded-lg text-zinc-200 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-500 font-medium">
                        상태 메시지
                      </label>
                      <input
                        type="text"
                        value={member.statusText || ""}
                        onChange={(e) => handleMemberChange(member.id, "statusText", e.target.value)}
                        placeholder="현재 진행 업무"
                        className="w-full mt-0.5 px-2.5 py-1 text-xs bg-[#09090B] border border-[#3F3F46] rounded-lg text-zinc-200 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#18181B] border-t border-[#27272A] flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-[#27272A] rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 accent-glow transition-all"
          >
            <Save className="w-4 h-4" />
            <span>설정 저장하기</span>
          </button>
        </div>

      </div>
    </div>
  );
};
