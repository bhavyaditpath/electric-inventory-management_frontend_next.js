"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useWebRTC } from "./useWebRTC";
import { CallDirection, CallOutcome, CallState, CallType } from "@/types/enums";

const SOCKET_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const OUTGOING_CALL_TTL_MS = 30000;
const CALL_SESSION_KEY = "chat_call_session";

type StoredCallSession = {
    direction: CallDirection;
    createdAt: number;
    targetUserId?: number;
    roomId?: number;
    callerId?: number;
    callerName?: string | null;
    peerName?: string | null;
    callType?: CallType | null;
    isGroupCall?: boolean;
};

export const useCallWebSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const targetUserIdRef = useRef<number | null>(null);
    const callerIdRef = useRef<number | null>(null);
    const roomIdRef = useRef<number | null>(null);
    const isGroupCallRef = useRef(false);
    const callStateRef = useRef<CallState>(CallState.Idle);

    const [callState, setCallState] = useState<CallState>(CallState.Idle);
    const [callerId, setCallerId] = useState<number | null>(null);
    const [peerUserId, setPeerUserId] = useState<number | null>(null);
    const [peerName, setPeerName] = useState<string | null>(null);
    const [connectedAt, setConnectedAt] = useState<number | null>(null);
    const [callerName, setCallerName] = useState<string | null>(null);
    const [incomingCallType, setIncomingCallType] = useState<CallType | null>(null);
    const [callDirection, setCallDirection] = useState<CallDirection | null>(null);
    const [callOutcome, setCallOutcome] = useState<CallOutcome | null>(null);
    const [isGroupCall, setIsGroupCall] = useState(false);
    const callLogIdRef = useRef<number | null>(null);
    const toggleRecording = () => webrtc.toggleRecording?.();
    const isRecording = () => webrtc.isRecording?.();
    const audioCtxRef = useRef<AudioContext | null>(null);
    const outgoingTimeoutRef = useRef<number | null>(null);
    const loopToneRef = useRef<{
        osc: OscillatorNode;
        gain: GainNode;
        timeoutId: number | null;
    } | null>(null);

    const ensureAudioContext = () => {
        if (typeof window === "undefined") return null;
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
            ctx.resume().catch(() => {
                return;
            });
        }
        return ctx;
    };

    const stopLoopTone = () => {
        if (loopToneRef.current) {
            if (loopToneRef.current.timeoutId != null) {
                clearTimeout(loopToneRef.current.timeoutId);
            }
            try {
                loopToneRef.current.osc.stop();
            } catch { }
            loopToneRef.current.osc.disconnect();
            loopToneRef.current.gain.disconnect();
            loopToneRef.current = null;
        }
    };

    const clearOutgoingTimeout = () => {
        if (outgoingTimeoutRef.current != null) {
            clearTimeout(outgoingTimeoutRef.current);
            outgoingTimeoutRef.current = null;
        }
    };

    const persistSession = (payload: StoredCallSession) => {
        if (typeof window === "undefined") return;
        try {
            sessionStorage.setItem(CALL_SESSION_KEY, JSON.stringify(payload));
        } catch {
            return;
        }
    };

    const clearPersistedSession = () => {
        if (typeof window === "undefined") return;
        try {
            sessionStorage.removeItem(CALL_SESSION_KEY);
        } catch {
            return;
        }
    };

    const scheduleOutgoingAutoReset = (remaining: number = OUTGOING_CALL_TTL_MS) => {
        clearOutgoingTimeout();
        if (remaining <= 0) {
            setCallOutcome(CallOutcome.Missed);
            resetCallState();
            return;
        }
        outgoingTimeoutRef.current = window.setTimeout(() => {
            setCallOutcome(CallOutcome.Missed);
            resetCallState();
        }, remaining);
    };

    const startLoopTone = (type: CallDirection) => {
        stopLoopTone();
        const ctx = ensureAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = type === CallDirection.Incoming ? 720 : 420;
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        const pattern =
            type === CallDirection.Incoming
                ? { onMs: 900, offMs: 300, volume: 0.08 }
                : { onMs: 450, offMs: 450, volume: 0.06 };

        const tick = () => {
            gain.gain.setValueAtTime(pattern.volume, ctx.currentTime);
            const timeoutIdOn = window.setTimeout(() => {
                gain.gain.setValueAtTime(0, ctx.currentTime);
                const timeoutIdOff = window.setTimeout(tick, pattern.offMs);
                if (loopToneRef.current) {
                    loopToneRef.current.timeoutId = timeoutIdOff;
                }
            }, pattern.onMs);
            if (loopToneRef.current) {
                loopToneRef.current.timeoutId = timeoutIdOn;
            }
        };

        loopToneRef.current = { osc, gain, timeoutId: null };
        tick();
    };

    const playOneShotTone = (type: CallOutcome) => {
        const ctx = ensureAudioContext();
        if (!ctx) return;

        const playBeep = (frequency: number, durationMs: number, delayMs: number, volume = 0.07) => {
            const startAt = ctx.currentTime + delayMs / 1000;
            const stopAt = startAt + durationMs / 1000;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(frequency, startAt);
            gain.gain.setValueAtTime(0, startAt);
            gain.gain.linearRampToValueAtTime(volume, startAt + 0.01);
            gain.gain.linearRampToValueAtTime(0, stopAt);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startAt);
            osc.stop(stopAt + 0.01);
        };

        if (type === CallOutcome.Accepted) {
            playBeep(880, 120, 0);
            playBeep(1320, 120, 160);
            return;
        }
        if (type === CallOutcome.Rejected) {
            playBeep(280, 260, 0, 0.08);
            return;
        }
        if (type === CallOutcome.Cancelled) {
            playBeep(520, 120, 0);
            playBeep(360, 180, 160);
            return;
        }
        if (type === CallOutcome.Busy) {
            playBeep(480, 140, 0);
            playBeep(480, 140, 220);
            playBeep(480, 140, 440);
            return;
        }
        if (type === CallOutcome.Missed) {
            playBeep(620, 120, 0);
            playBeep(620, 120, 200);
            return;
        }
        playBeep(240, 140, 0);
    };

    const resetCallState = () => {
        clearOutgoingTimeout();
        clearPersistedSession();
        callerIdRef.current = null;
        targetUserIdRef.current = null;
        roomIdRef.current = null;
        isGroupCallRef.current = false;
        setCallerId(null);
        setPeerUserId(null);
        setPeerName(null);
        setCallerName(null);
        setIncomingCallType(null);
        setCallDirection(null);
        setIsGroupCall(false);
        setCallState(CallState.Idle);
        setConnectedAt(null);
    };

    const normalizeCallType = (value: unknown): CallType | null => {
        if (!value) return null;
        const raw = String(value).toLowerCase();
        if (raw === "audio") return CallType.Audio;
        if (raw === "video") return CallType.Video;
        return null;
    };

    const shouldIgnoreGroupTerminalEvent = () => {
        if (!isGroupCallRef.current) return false;

        // While group ring-out is active and no one accepted yet, ignore per-user outcomes.
        if (
            callStateRef.current === CallState.Calling &&
            !targetUserIdRef.current
        ) {
            return true;
        }

        // After one participant is accepted, ignore late outcomes from other invitees.
        if (
            callStateRef.current !== CallState.Calling &&
            !!targetUserIdRef.current
        ) {
            return true;
        }

        return false;
    };

    // Attach WebRTC (IMPORTANT: pass refs)
    const webrtc = useWebRTC(
        socketRef,
        targetUserIdRef,
        callLogIdRef,
        () => {
            clearOutgoingTimeout();
            clearPersistedSession();
            setCallState(CallState.Connected);
            setConnectedAt(Date.now());
        },
        () => resetCallState()
    );

    useEffect(() => {
        callStateRef.current = callState;
        if (callState === CallState.Ringing) {
            startLoopTone(CallDirection.Incoming);
            return;
        }
        if (callState === CallState.Calling) {
            startLoopTone(CallDirection.Outgoing);
            return;
        }
        stopLoopTone();
    }, [callState]);

    useEffect(() => {
        if (!callOutcome) return;
        playOneShotTone(callOutcome);
        const timer = window.setTimeout(() => setCallOutcome(null), 1200);
        return () => window.clearTimeout(timer);
    }, [callOutcome]);

    useEffect(() => {
        return () => {
            clearOutgoingTimeout();
            stopLoopTone();
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(() => {
                    return;
                });
                audioCtxRef.current = null;
            }
        };
    }, []);

    // ================= CONNECT SOCKET =================
    useEffect(() => {
        const token =
            localStorage.getItem("access_token");
        if (!token) return;

        const socket = io(`${SOCKET_BASE_URL}/chat`, {
            auth: { token },
            transports: ["websocket"],
        });

        socketRef.current = socket;

        // ---------- INCOMING CALL ----------
        socket.on("incomingCall", async ({ callerId, callerName, callType, roomId, isGroupCall, callLogId }) => {
            callerIdRef.current = callerId;
            roomIdRef.current = roomId ?? null;
            isGroupCallRef.current = !!isGroupCall;
            callLogIdRef.current = callLogId ?? null;
            setCallerId(callerId);
            setPeerUserId(callerId);
            setPeerName(callerName ?? null);
            setCallerName(callerName ?? null);
            setIsGroupCall(!!isGroupCall);
            const normalizedType = normalizeCallType(callType);
            if (normalizedType) setIncomingCallType(normalizedType);
            setCallDirection(CallDirection.Incoming);
            setCallOutcome(null);
            setCallState(CallState.Ringing);
            persistSession({
                direction: CallDirection.Incoming,
                createdAt: Date.now(),
                callerId,
                callerName: callerName ?? null,
                peerName: callerName ?? null,
                callType: normalizedType,
                roomId: roomId ?? undefined,
                isGroupCall: !!isGroupCall,
            });

            // prepare peer BEFORE offer arrives (critical)
            await webrtc.prepareReceiver(callerId);
        });

        // ---------- CALL ACCEPTED ----------
        socket.on("callAccepted", async ({ receiverId, callLogId }) => {
            if (callLogId) callLogIdRef.current = callLogId;
            if (isGroupCallRef.current && targetUserIdRef.current) {
                return;
            }
            targetUserIdRef.current = receiverId;
            setPeerUserId(receiverId);
            setCallOutcome(CallOutcome.Accepted);
            clearOutgoingTimeout();
            clearPersistedSession();
            setCallState(CallState.Connecting);

            if (isGroupCallRef.current && roomIdRef.current) {
                socketRef.current?.emit("cancelCall", { roomId: roomIdRef.current });
            }

            // caller starts WebRTC
            await webrtc.startCall();
        });

        // ---------- CALL REJECTED ----------
        socket.on("callRejected", () => {
            if (shouldIgnoreGroupTerminalEvent()) {
                return;
            }
            setCallOutcome(CallOutcome.Rejected);
            webrtc.endCall();
            resetCallState();
        });

        // ---------- CALL ENDED ----------
        socket.on("callEnded", () => {
            setCallOutcome(CallOutcome.Ended);
            webrtc.endCall();
            resetCallState();
        });

        socket.on("callCancelled", () => {
            if (shouldIgnoreGroupTerminalEvent()) {
                return;
            }
            setCallOutcome(CallOutcome.Cancelled);
            webrtc.endCall();
            resetCallState();
        });

        // ---------- NO ANSWER / MISSED ----------
        socket.on("callNoAnswer", () => {
            if (shouldIgnoreGroupTerminalEvent()) {
                return;
            }
            setCallOutcome(CallOutcome.Missed);
            webrtc.endCall();
            resetCallState();
        });

        socket.on("missedCall", () => {
            setCallOutcome(CallOutcome.Missed);
            webrtc.endCall();
            resetCallState();
        });

        // ---------- USER BUSY ----------
        socket.on("userBusy", () => {
            if (shouldIgnoreGroupTerminalEvent()) {
                return;
            }
            setCallOutcome(CallOutcome.Busy);
            webrtc.endCall();
            resetCallState();
        });

        // ---------- WEBRTC SIGNALING ----------
        socket.on("offer", async (offer) => {
            setCallState(CallState.Connecting);
            const caller = callerIdRef.current;
            if (!caller) return;
            await webrtc.handleOffer(offer, caller);
        });

        socket.on("answer", async (answer) => {
            await webrtc.handleAnswer(answer);
        });

        socket.on("iceCandidate", async (candidate) => {
            await webrtc.handleIceCandidate(candidate);
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = sessionStorage.getItem(CALL_SESSION_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as StoredCallSession;
            if (!parsed?.createdAt || !parsed?.direction) {
                clearPersistedSession();
                return;
            }
            const age = Date.now() - parsed.createdAt;
            if (age > OUTGOING_CALL_TTL_MS) {
                clearPersistedSession();
                return;
            }
            if (parsed.direction === CallDirection.Outgoing) {
                targetUserIdRef.current = parsed.targetUserId ?? null;
                roomIdRef.current = parsed.roomId ?? null;
                isGroupCallRef.current = !!parsed.isGroupCall;
                setPeerUserId(parsed.targetUserId ?? null);
                setPeerName(parsed.peerName ?? null);
                setIncomingCallType(parsed.callType ?? null);
                setIsGroupCall(!!parsed.isGroupCall);
                setCallDirection(CallDirection.Outgoing);
                setCallState(CallState.Calling);
                const remaining = OUTGOING_CALL_TTL_MS - age;
                scheduleOutgoingAutoReset(remaining);
                return;
            }
            if (parsed.direction === CallDirection.Incoming && parsed.callerId) {
                callerIdRef.current = parsed.callerId;
                setCallerId(parsed.callerId);
                roomIdRef.current = parsed.roomId ?? null;
                isGroupCallRef.current = !!parsed.isGroupCall;
                setPeerUserId(parsed.callerId);
                setPeerName(parsed.peerName ?? parsed.callerName ?? null);
                setCallerName(parsed.callerName ?? null);
                setIncomingCallType(parsed.callType ?? null);
                setIsGroupCall(!!parsed.isGroupCall);
                setCallDirection(CallDirection.Incoming);
                setCallState(CallState.Ringing);
            }
        } catch {
            clearPersistedSession();
        }
    }, []);

    // ================= ACTIONS =================

    const callUser = (
        userId: number | null,
        roomId: number,
        callType?: CallType,
        targetName?: string | null,
        groupCall = false
    ) => {
        roomIdRef.current = roomId;
        isGroupCallRef.current = groupCall;
        targetUserIdRef.current = userId;
        setPeerUserId(userId ?? null);
        setPeerName(targetName ?? null);
        setCallDirection(CallDirection.Outgoing);
        setCallOutcome(null);
        setIsGroupCall(groupCall);
        setCallState(CallState.Calling);
        const normalizedType = callType ?? CallType.Audio;
        setIncomingCallType(normalizedType);
        const startedAt = Date.now();
        persistSession({
            direction: CallDirection.Outgoing,
            createdAt: startedAt,
            targetUserId: userId ?? undefined,
            roomId,
            peerName: targetName ?? null,
            callType: normalizedType,
            isGroupCall: groupCall,
        });
        scheduleOutgoingAutoReset();

        socketRef.current?.emit("callUser", {
            targetUserId: userId ?? undefined,
            roomId,
            callType,
        });
    };

    const acceptCall = () => {
        const caller = callerIdRef.current;
        if (!caller) return;

        targetUserIdRef.current = caller;
        setPeerUserId(caller);
        setPeerName(callerName ?? null);
        setCallOutcome(CallOutcome.Accepted);
        setCallState(CallState.Connecting);
        clearOutgoingTimeout();

        socketRef.current?.emit("acceptCall", {
            callerId: caller,
        });
    };

    const rejectCall = () => {
        const caller = callerIdRef.current;
        if (!caller) return;

        socketRef.current?.emit("rejectCall", {
            callerId: caller,
        });

        setCallOutcome(CallOutcome.Rejected);
        webrtc.endCall();
        resetCallState();
    };

    const endCall = () => {
        const targetUserId = targetUserIdRef.current;
        if (callState === CallState.Calling) {
            if (targetUserId) {
                socketRef.current?.emit("cancelCall", { targetUserId, roomId: roomIdRef.current ?? undefined });
            } else {
                socketRef.current?.emit("cancelCall", { roomId: roomIdRef.current ?? undefined });
            }
        } else {
            socketRef.current?.emit("endCall");
        }
        setCallOutcome(CallOutcome.Cancelled);
        webrtc.endCall();
        resetCallState();
    };

    return {
        callState,
        callerId,
        peerUserId,
        peerName,
        callerName,
        incomingCallType,
        isGroupCall,
        callDirection,
        callOutcome,
        connectedAt,
        callUser,
        acceptCall,
        rejectCall,
        endCall,
        toggleRecording,
        isRecording,
    };
};
