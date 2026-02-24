"use client";

import { PhoneIcon, SignalIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { PhoneXMarkIcon } from "@heroicons/react/24/solid";
import { CallState, CallType } from "@/types/enums";
import { useEffect, useMemo, useState } from "react";

interface Props {
  visible: boolean;
  state: CallState;
  userId?: number | null;
  displayName?: string;
  isGroupCall?: boolean;
  incoming?: boolean;
  callKind?: CallType | null;
  connectedAt?: number | null;
  onAccept?: () => void;
  onReject?: () => void;
  onIgnore?: () => void;
  showJoinAfterIgnore?: boolean;
  onEnd?: () => void;
  isRecording?: boolean;
  onToggleRecording?: () => void;
}

export default function CallOverlay({
  visible,
  state,
  userId,
  displayName,
  isGroupCall,
  incoming,
  callKind,
  connectedAt,
  onAccept,
  onReject,
  onIgnore,
  showJoinAfterIgnore,
  onEnd,
  isRecording,
  onToggleRecording,
}: Props) {
  const avatarStyles = [
    "bg-rose-100 text-rose-700 border-rose-200",
    "bg-sky-100 text-sky-700 border-sky-200",
    "bg-emerald-100 text-emerald-700 border-emerald-200",
    "bg-amber-100 text-amber-700 border-amber-200",
    "bg-violet-100 text-violet-700 border-violet-200",
    "bg-cyan-100 text-cyan-700 border-cyan-200",
  ];

  const callKindLabel = callKind
    ? callKind === CallType.Audio
      ? CallType.Audio
      : CallType.Video
    : "";

  const callIcon =
    callKind === CallType.Video ? (
      <VideoCameraIcon className="w-5 h-5" />
    ) : (
      <PhoneIcon className="w-5 h-5" />
    );

  const getLabel = () => {
    switch (state) {
      case CallState.Calling:
        if (isGroupCall) return callKindLabel ? `Calling group ${callKindLabel}...` : "Calling group...";
        return callKindLabel ? `Calling ${callKindLabel}...` : "Calling...";
      case CallState.Ringing:
        return isGroupCall ? "Incoming group call" : "Incoming call";
      case CallState.Connecting:
        if (isGroupCall) return callKindLabel ? `Connecting group ${callKindLabel}...` : "Connecting group...";
        return callKindLabel ? `Connecting ${callKindLabel}...` : "Connecting...";
      case CallState.Connected:
        if (isGroupCall) return callKindLabel ? `On group ${callKindLabel} call` : "On group call";
        return callKindLabel ? `On ${callKindLabel} call` : "On call";
      default:
        return "";
    }
  };

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (state !== CallState.Connected || !connectedAt) {
      setElapsed(0);
      return;
    }

    const update = () => {
      const diff = Math.max(0, Math.floor((Date.now() - connectedAt) / 1000));
      setElapsed(diff);
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [state, connectedAt]);

  const durationLabel = useMemo(() => {
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [elapsed]);

  const avatarLabel = useMemo(() => {
    const base = (displayName || "").trim();
    if (!base) return "U";

    const source = base.includes("@") ? base.split("@")[0] : base;
    const tokens = source
      .split(/[\s._-]+/)
      .map((t) => t.replace(/[^a-zA-Z0-9]/g, ""))
      .filter(Boolean);

    if (tokens.length === 0) return "U";
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
    return `${tokens[0][0] || ""}${tokens[1][0] || ""}`.toUpperCase();
  }, [displayName]);

  const avatarClass = useMemo(() => {
    const seed =
      typeof userId === "number"
        ? userId
        : (displayName || "")
          .split("")
          .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return avatarStyles[Math.abs(seed) % avatarStyles.length];
  }, [displayName, userId]);

  if (!visible) return null;

  if (showJoinAfterIgnore && incoming && state === CallState.Ringing) {
    return (
      <div className="fixed bottom-4 right-4 z-[999] w-[320px] rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-2xl">
        <p className="text-sm font-semibold text-[var(--theme-text)]">
          Group call is ongoing
        </p>
        <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
          {displayName || `User #${userId ?? "?"}`} is still on this call. You can join anytime while it is active.
        </p>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={onReject}
            className="flex items-center gap-1 px-3 py-2 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300"
          >
            Dismiss
          </button>
          <button
            onClick={onAccept}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600"
          >
            <PhoneIcon className="w-4 h-4" />
            Join Call
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/80 to-slate-800/80 flex items-center justify-center z-[999]">
      <div className="bg-[var(--theme-surface)] rounded-3xl shadow-2xl w-[360px] p-6 text-center space-y-6 border border-[var(--theme-border)]">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--theme-text-muted)] bg-[var(--theme-surface-muted)] px-3 py-1 rounded-full">
            <SignalIcon className="w-4 h-4" />
            {getLabel()}
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--theme-text)] bg-[var(--theme-surface-muted)] px-3 py-1 rounded-full">
            {callIcon}
            {callKindLabel || "Call"}
          </span>
        </div>

        <div className="space-y-2">
          <div
            className={`w-24 h-24 mx-auto rounded-full border flex items-center justify-center text-2xl font-semibold ${avatarClass}`}
          >
            {avatarLabel}
          </div>
          <p className="text-sm font-semibold text-[var(--theme-text)]">
            {displayName || `User #${userId ?? "?"}`}
          </p>
          <p className="text-xs text-[var(--theme-text-muted)]">
            {state === CallState.Connected ? `Duration ${durationLabel}` : "User"}
          </p>
        </div>

        {/* Incoming buttons */}
        {incoming && state === CallState.Ringing && (
          <div className="flex justify-center gap-3">
            <button
              onClick={onIgnore}
              className="flex items-center gap-2 px-4 py-3 rounded-full bg-slate-200 text-slate-700 text-sm font-semibold shadow-sm hover:bg-slate-300"
            >
              Ignore
            </button>
            <button
              onClick={onReject}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-red-500 text-white text-sm font-semibold shadow-sm hover:bg-red-600"
            >
              <PhoneXMarkIcon className="w-5 h-5" />
              Decline
            </button>

            <button
              onClick={onAccept}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-500 text-white text-sm font-semibold shadow-sm hover:bg-emerald-600"
            >
              <PhoneIcon className="w-5 h-5" />
              Accept
            </button>
          </div>
        )}

        {/* Active call */}
        {(state === CallState.Calling ||
          state === CallState.Connecting ||
          state === CallState.Connected) && (
            <div className="flex flex-col items-center gap-3">

              {/* {state === CallState.Connected && (
                <button
                  onClick={onToggleRecording}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold shadow-sm
        ${isRecording
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-800"}`}
                >
                  ● {isRecording ? "Recording..." : "Start Recording"}
                </button>
              )} */}

              <button
                onClick={onEnd}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 text-white text-sm font-semibold shadow-sm hover:bg-red-700"
              >
                <PhoneXMarkIcon className="w-5 h-5" />
                End Call
              </button>
            </div>
          )}

      </div>
    </div>
  );
}
