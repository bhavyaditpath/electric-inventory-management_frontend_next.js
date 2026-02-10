"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useWebRTC } from "./useWebRTC";
import { CallState } from "@/types/enums";

const SOCKET_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const useCallWebSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const targetUserIdRef = useRef<number | null>(null);
    const callerIdRef = useRef<number | null>(null);

  const [callState, setCallState] = useState<CallState>(CallState.Idle);
  const [callerId, setCallerId] = useState<number | null>(null);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const toneRef = useRef<{
        osc: OscillatorNode;
        gain: GainNode;
        timeoutId: number;
    } | null>(null);

    const stopTone = () => {
        if (toneRef.current) {
            clearTimeout(toneRef.current.timeoutId);
            try {
                toneRef.current.osc.stop();
            } catch { }
            toneRef.current.osc.disconnect();
            toneRef.current.gain.disconnect();
            toneRef.current = null;
        }
    };

    const startTone = (type: "ringtone" | "ringback") => {
        stopTone();
        if (typeof window === "undefined") return;

        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
        }

        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
            ctx.resume().catch(() => {
                return;
            });
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = type === "ringtone" ? 480 : 400;
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        const pattern =
            type === "ringtone"
                ? { onMs: 800, offMs: 400 }
                : { onMs: 400, offMs: 400 };

        let on = false;
        const tick = () => {
            on = !on;
            gain.gain.setValueAtTime(on ? 0.08 : 0, ctx.currentTime);
            const delay = on ? pattern.onMs : pattern.offMs;
            const timeoutId = window.setTimeout(tick, delay);
            if (toneRef.current) {
                toneRef.current.timeoutId = timeoutId;
            }
        };

        tick();
        toneRef.current = { osc, gain, timeoutId: window.setTimeout(() => { }, 0) };
    };

  const resetCallState = () => {
    callerIdRef.current = null;
    targetUserIdRef.current = null;
    setCallerId(null);
    setCallState(CallState.Idle);
    setConnectedAt(null);
  };

    // Attach WebRTC (IMPORTANT: pass refs)
  const webrtc = useWebRTC(
    socketRef,
    targetUserIdRef,
    () => {
      setCallState(CallState.Connected);
      setConnectedAt(Date.now());
    },
    () => resetCallState()
  );

    useEffect(() => {
        if (callState === CallState.Ringing) {
            startTone("ringtone");
            return;
        }
        if (callState === CallState.Calling) {
            startTone("ringback");
            return;
        }
        stopTone();
    }, [callState]);

    useEffect(() => {
        return () => {
            stopTone();
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
            localStorage.getItem("access_token") || localStorage.getItem("token");
        if (!token) return;

        const socket = io(`${SOCKET_BASE_URL}/chat`, {
            auth: { token },
            transports: ["websocket"],
        });

        socketRef.current = socket;

        // ---------- INCOMING CALL ----------
        socket.on("incomingCall", async ({ callerId }) => {
            callerIdRef.current = callerId;
            setCallerId(callerId);
            setCallState(CallState.Ringing);

            // prepare peer BEFORE offer arrives (critical)
            await webrtc.prepareReceiver(callerId);
        });

        // ---------- CALL ACCEPTED ----------
        socket.on("callAccepted", async ({ receiverId }) => {
            targetUserIdRef.current = receiverId;
            setCallState(CallState.Connecting);

            // caller starts WebRTC
            await webrtc.startCall();
        });

        // ---------- CALL REJECTED ----------
        socket.on("callRejected", () => {
            webrtc.endCall();
            resetCallState();
        });

        // ---------- CALL ENDED ----------
        socket.on("callEnded", () => {
            webrtc.endCall();
            resetCallState();
        });

        // ---------- USER BUSY ----------
        socket.on("userBusy", () => {
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

    // ================= ACTIONS =================

    const callUser = (userId: number, roomId: number) => {
        targetUserIdRef.current = userId;
        setCallState(CallState.Calling);

        socketRef.current?.emit("callUser", {
            targetUserId: userId,
            roomId,
        });
    };

    const acceptCall = () => {
        const caller = callerIdRef.current;
        if (!caller) return;

        targetUserIdRef.current = caller;
        setCallState(CallState.Connecting);

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

        webrtc.endCall();
        resetCallState();
    };

    const endCall = () => {
        socketRef.current?.emit("endCall");
        webrtc.endCall();
        resetCallState();
    };

  return {
    callState,
    callerId,
    connectedAt,
    callUser,
    acceptCall,
    rejectCall,
    endCall,
  };
};
