"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  CANCELLED: "bg-[var(--theme-surface-muted)] text-[var(--theme-text)] border-[var(--theme-border)]",
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
  const [audioUrls, setAudioUrls] = useState<Record<number, string>>({});
  const [loadingAudioId, setLoadingAudioId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const audioUrlsRef = useRef<Record<number, string>>({});

  const extractList = (response: unknown): CallLog[] => {
    const payload = response as {
      data?: unknown;
      items?: unknown;
      message?: string;
    };

    if (Array.isArray(response)) return response;
    if (Array.isArray(payload?.data)) return payload.data as CallLog[];
    if (Array.isArray(payload?.items)) return payload.items as CallLog[];

    const nestedData = payload?.data as { data?: unknown; items?: unknown } | undefined;
    if (Array.isArray(nestedData?.data)) return nestedData.data as CallLog[];
    if (Array.isArray(nestedData?.items)) return nestedData.items as CallLog[];

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

  useEffect(() => {
    if (isOpen) return;
    setAudioUrls((prev) => {
      Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
      if (Object.keys(prev).length === 0) return prev;
      return {};
    });
    setLoadingAudioId(null);
    setDownloadingId(null);
  }, [isOpen]);

  useEffect(() => {
    audioUrlsRef.current = audioUrls;
  }, [audioUrls]);

  useEffect(() => {
    return () => {
      Object.values(audioUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const activeLogs = useMemo(() => {
    if (activeTab === "missed") return missed;
    if (activeTab === "room") return roomLogs;
    return history;
  }, [activeTab, history, missed, roomLogs]);

  const filteredLogs = useMemo(() => {
    if (typeFilter === "all") return activeLogs;
    return activeLogs.filter((log) => normalizeCallType(log.callType) === typeFilter);
  }, [activeLogs, typeFilter]);

  const loadRecordingAudio = useCallback(async (log: CallLog) => {
    const hasRecording = Boolean(log.hasRecording || log.recordingPlayUrl);
    if (!hasRecording) return;

    if (audioUrls[log.id]) return;

    setLoadingAudioId(log.id);
    try {
      const blob = await callApi.getRecordingPlayBlob(log.id);
      const objectUrl = URL.createObjectURL(blob);
      setAudioUrls((prev) => ({ ...prev, [log.id]: objectUrl }));
    } catch (error) {
      console.error("Failed to load recording:", error);
      showError("Unable to load recording");
    } finally {
      setLoadingAudioId(null);
    }
  }, [audioUrls]);

  const handleDownloadRecording = useCallback(async (log: CallLog) => {
    const hasRecording = Boolean(log.hasRecording || log.recordingDownloadUrl);
    if (!hasRecording) return;

    setDownloadingId(log.id);
    try {
      await callApi.downloadRecording(log.id, `call_${log.id}.webm`);
    } catch (error) {
      console.error("Failed to download recording:", error);
      showError("Unable to download recording");
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const renderLogs = () => {
    if (loading) {
      return (
        <div className="text-sm text-[var(--theme-text-muted)]">Loading call logs...</div>
      );
    }

    if (!filteredLogs.length) {
      return (
        <div className="text-sm text-[var(--theme-text-muted)]">No call logs available.</div>
      );
    }

    return (
      <div className="divide-y divide-[var(--theme-border)]">
        {filteredLogs.map((log) => {
          const statusKey = String(log.status || "").toUpperCase();
          const badgeClass =
            statusStyles[statusKey] || "bg-[var(--theme-surface-muted)] text-[var(--theme-text)] border-[var(--theme-border)]";
          const typeLabel = normalizeCallType(log.callType)
            ? normalizeCallType(log.callType) === CallType.Audio
              ? "Audio"
              : "Video"
            : "Unknown";
          const hasRecording = Boolean(log.hasRecording || log.recordingPlayUrl || log.recordingDownloadUrl);
          const audioUrl = audioUrls[log.id];
          return (
            <div key={log.id} className="py-3 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--theme-text)] truncate">
                  {getNamesLabel(log)}
                </p>
                <p className="text-xs text-[var(--theme-text-muted)]">
                  Started: {formatDate(log.startedAt || log.createdAt)}
                </p>
                <p className="text-xs text-[var(--theme-text-muted)]">
                  Ended: {formatDate(log.endedAt)}
                </p>
                <div className="mt-2">
                  {!hasRecording && (
                    <p className="text-xs text-[var(--theme-text-muted)]">No recording available.</p>
                  )}
                  {hasRecording && (
                    <div className="flex flex-col gap-2">
                      {!audioUrl ? (
                        <button
                          onClick={() => loadRecordingAudio(log)}
                          disabled={loadingAudioId === log.id}
                          className={`w-fit px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                            loadingAudioId === log.id
                              ? "opacity-60 cursor-not-allowed bg-[var(--theme-surface-muted)] border-[var(--theme-border)] text-[var(--theme-text-muted)]"
                              : "bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)] hover:bg-[var(--theme-surface-muted)]"
                          }`}
                        >
                          {loadingAudioId === log.id ? "Loading..." : "Listen Recording"}
                        </button>
                      ) : (
                        <audio controls preload="none" src={audioUrl} className="w-full max-w-sm" />
                      )}
                      <button
                        onClick={() => handleDownloadRecording(log)}
                        disabled={downloadingId === log.id}
                        className={`w-fit px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                          downloadingId === log.id
                            ? "opacity-60 cursor-not-allowed bg-[var(--theme-surface-muted)] border-[var(--theme-border)] text-[var(--theme-text-muted)]"
                            : "bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)] hover:bg-[var(--theme-surface-muted)]"
                        }`}
                      >
                        {downloadingId === log.id ? "Downloading..." : "Download Recording"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${badgeClass}`}>
                  {statusLabel(log.status)}
                </span>
                <span className="text-xs text-[var(--theme-text-muted)]">{typeLabel}</span>
                <span className="text-xs text-[var(--theme-text-muted)]">{formatDuration(log.duration)}</span>
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
              : "bg-[var(--theme-surface)] text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:bg-[var(--theme-surface-muted)]"
          }`}
        >
          History ({history.length})
        </button>
        <button
          onClick={() => setActiveTab("missed")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            activeTab === "missed"
              ? "bg-blue-100 text-blue-700 border-blue-200"
              : "bg-[var(--theme-surface)] text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:bg-[var(--theme-surface-muted)]"
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
              : "bg-[var(--theme-surface)] text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:bg-[var(--theme-surface-muted)]"
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
              ? "bg-[var(--theme-text)] text-[var(--theme-bg)] border-[var(--theme-text)]"
              : "bg-[var(--theme-surface)] text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:bg-[var(--theme-surface-muted)]"
          }`}
        >
          All Types
        </button>
        <button
          onClick={() => setTypeFilter(CallType.Audio)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            typeFilter === CallType.Audio
              ? "bg-[var(--theme-text)] text-[var(--theme-bg)] border-[var(--theme-text)]"
              : "bg-[var(--theme-surface)] text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:bg-[var(--theme-surface-muted)]"
          }`}
        >
          Audio
        </button>
        <button
          onClick={() => setTypeFilter(CallType.Video)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            typeFilter === CallType.Video
              ? "bg-[var(--theme-text)] text-[var(--theme-bg)] border-[var(--theme-text)]"
              : "bg-[var(--theme-surface)] text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:bg-[var(--theme-surface-muted)]"
          }`}
        >
          Video
        </button>
      </div>

      {renderLogs()}
    </Modal>
  );
}

