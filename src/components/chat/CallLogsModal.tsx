"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import { callApi, CallLog, CallLogStatus } from "@/Services/call.api";
import { CallType } from "@/types/enums";
import { showError } from "@/Services/toast.service";

interface CallLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: number | null;
  initialTab?: TabKey;
  initialType?: "all" | CallType;
}

type TabKey = "history" | "missed" | "room";

const statusStyles: Record<string, string> = {
  MISSED: "bg-red-50 text-red-700 border-red-100",
  REJECTED: "bg-amber-50 text-amber-700 border-amber-100",
  CANCELLED: "bg-slate-50 text-slate-700 border-slate-100",
  ANSWERED: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const statusLabel = (status?: CallLogStatus | string) => {
  if (!status) return "Unknown";
  const normalized = String(status).toUpperCase();
  switch (normalized) {
    case "MISSED":
      return "Missed";
    case "ANSWERED":
      return "Answered";
    case "REJECTED":
      return "Rejected";
    case "CANCELLED":
      return "Cancelled";
    default:
      return normalized;
  }
};

const normalizeCallType = (value: unknown): CallType | null => {
  if (!value) return null;
  const raw = String(value).toLowerCase();
  if (raw === "audio") return CallType.Audio;
  if (raw === "video") return CallType.Video;
  return null;
};

const formatDuration = (value?: number | null) => {
  if (value == null) return "N/A";
  const total = Math.max(0, Math.floor(value));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "N/A";
  return dt.toLocaleString();
};

const getNamesLabel = (log: CallLog) => {
  if (log.callerName || log.receiverName) {
    return `${log.callerName || "Unknown"} -> ${log.receiverName || "Unknown"}`;
  }
  return null;
};

export default function CallLogsModal({
  isOpen,
  onClose,
  roomId,
  initialTab = "history",
  initialType = "all",
}: CallLogsModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [typeFilter, setTypeFilter] = useState<"all" | CallType>(initialType);
  const [history, setHistory] = useState<CallLog[]>([]);
  const [missed, setMissed] = useState<CallLog[]>([]);
  const [roomLogs, setRoomLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(false);

  const extractList = (response: any): CallLog[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    return [];
  };

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await callApi.getCallHistory();
      const list = extractList(response);
      setHistory(list);
      if (!list.length && response?.message) showError(response.message);
    } catch (error) {
      console.error("Failed to fetch call history:", error);
      setHistory([]);
      showError("Failed to fetch call history");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMissed = useCallback(async () => {
    setLoading(true);
    try {
      const response = await callApi.getMissedCalls();
      const list = extractList(response);
      setMissed(list);
      if (!list.length && response?.message) showError(response.message);
    } catch (error) {
      console.error("Failed to fetch missed calls:", error);
      setMissed([]);
      showError("Failed to fetch missed calls");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoomLogs = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const response = await callApi.getRoomCallHistory(roomId);
      const list = extractList(response);
      setRoomLogs(list);
      if (!list.length && response?.message) showError(response.message);
    } catch (error) {
      console.error("Failed to fetch room calls:", error);
      setRoomLogs([]);
      showError("Failed to fetch room calls");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    setTypeFilter(initialType);
  }, [initialTab, initialType, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === "history") {
      loadHistory();
    } else if (activeTab === "missed") {
      loadMissed();
    } else if (activeTab === "room") {
      loadRoomLogs();
    }
  }, [activeTab, isOpen, loadHistory, loadMissed, loadRoomLogs]);

  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === "room" && !roomId) {
      setActiveTab("history");
    }
  }, [activeTab, isOpen, roomId]);

  const activeLogs = useMemo(() => {
    if (activeTab === "missed") return missed;
    if (activeTab === "room") return roomLogs;
    return history;
  }, [activeTab, history, missed, roomLogs]);

  const filteredLogs = useMemo(() => {
    if (typeFilter === "all") return activeLogs;
    return activeLogs.filter((log) => normalizeCallType(log.callType) === typeFilter);
  }, [activeLogs, typeFilter]);

  const renderLogs = () => {
    if (loading) {
      return (
        <div className="text-sm text-gray-500">Loading call logs...</div>
      );
    }

    if (!filteredLogs.length) {
      return (
        <div className="text-sm text-gray-500">No call logs available.</div>
      );
    }

    return (
      <div className="divide-y divide-gray-100">
        {filteredLogs.map((log) => {
          const statusKey = String(log.status || "").toUpperCase();
          const badgeClass =
            statusStyles[statusKey] || "bg-gray-50 text-gray-700 border-gray-100";
          const typeLabel = normalizeCallType(log.callType)
            ? normalizeCallType(log.callType) === CallType.Audio
              ? "Audio"
              : "Video"
            : "Unknown";
          return (
            <div key={log.id} className="py-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {getNamesLabel(log)}
                </p>
                <p className="text-xs text-gray-500">
                  Started: {formatDate(log.startedAt || log.createdAt)}
                </p>
                <p className="text-xs text-gray-500">
                  Ended: {formatDate(log.endedAt)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${badgeClass}`}>
                  {statusLabel(log.status)}
                </span>
                <span className="text-xs text-gray-500">{typeLabel}</span>
                <span className="text-xs text-gray-500">{formatDuration(log.duration)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Call Logs" size="lg">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab("history")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            activeTab === "history"
              ? "bg-blue-100 text-blue-700 border-blue-200"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          History ({history.length})
        </button>
        <button
          onClick={() => setActiveTab("missed")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            activeTab === "missed"
              ? "bg-blue-100 text-blue-700 border-blue-200"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          Missed ({missed.length})
        </button>
        <button
          onClick={() => setActiveTab("room")}
          disabled={!roomId}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            activeTab === "room"
              ? "bg-blue-100 text-blue-700 border-blue-200"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          } ${!roomId ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Room ({roomLogs.length})
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTypeFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            typeFilter === "all"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          All Types
        </button>
        <button
          onClick={() => setTypeFilter(CallType.Audio)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            typeFilter === CallType.Audio
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          Audio
        </button>
        <button
          onClick={() => setTypeFilter(CallType.Video)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            typeFilter === CallType.Video
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          Video
        </button>
      </div>

      {renderLogs()}
    </Modal>
  );
}
