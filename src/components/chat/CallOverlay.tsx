"use client";

import { PhoneIcon, SignalIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { PhoneXMarkIcon } from "@heroicons/react/24/solid";
import { CallState, CallType } from "@/types/enums";
import { useEffect, useMemo, useState } from "react";

interface Props {
  visible: boolean;
  state: CallState;
  userId?: number | null;
  incoming?: boolean;
  callKind?: CallType | null;
  connectedAt?: number | null;
  onAccept?: () => void;
  onReject?: () => void;
  onEnd?: () => void;
}

export default function CallOverlay({
  visible,
  state,
  userId,
  incoming,
  callKind,
  connectedAt,
  onAccept,
  onReject,
  onEnd,
}: Props) {
  if (!visible) return null;

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
        return callKindLabel ? `Calling ${callKindLabel}...` : "Calling...";
      case CallState.Ringing:
        return "Incoming call";
      case CallState.Connecting:
        return callKindLabel ? `Connecting ${callKindLabel}...` : "Connecting...";
      case CallState.Connected:
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

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/80 to-slate-800/80 flex items-center justify-center z-[999]">
      <div className="bg-white rounded-3xl shadow-2xl w-[360px] p-6 text-center space-y-6 border border-slate-100">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            <SignalIcon className="w-4 h-4" />
            {getLabel()}
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
            {callIcon}
            {callKindLabel || "Call"}
          </span>
        </div>

        <div className="space-y-2">
          <div className="w-24 h-24 mx-auto rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl font-semibold text-slate-700">
            {userId ?? "?"}
          </div>
          <p className="text-xs text-slate-500">
            {state === CallState.Connected ? `Duration ${durationLabel}` : "User ID"}
          </p>
        </div>

        {/* Incoming buttons */}
        {incoming && state === CallState.Ringing && (
          <div className="flex justify-center gap-4">
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
          <div className="flex justify-center">
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
