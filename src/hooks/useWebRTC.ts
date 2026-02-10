"use client";

import { RefObject, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

export const useWebRTC = (
  socketRef: RefObject<Socket | null>,
  targetUserIdRef: RefObject<number | null>,
  onConnected?: () => void,
  onEnded?: () => void
) => {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // create audio element once
  useEffect(() => {
    remoteAudioRef.current = new Audio();
    remoteAudioRef.current.autoplay = true;
  }, []);

  const ensurePeerConnection = async (targetUserId: number) => {
    if (pcRef.current) return pcRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
      onConnected?.();
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("iceCandidate", {
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    return pc;
  };

  const prepareReceiver = async (callerId: number) => {
    await ensurePeerConnection(callerId);
  };

  // ================= START CALL (caller) =================
  const startCall = async () => {
    const socket = socketRef.current;
    const targetUserId = targetUserIdRef.current;
    if (!socket || !targetUserId) return;

    const pc = await ensurePeerConnection(targetUserId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("offer", { targetUserId, offer });
  };

  // ================= RECEIVE OFFER (receiver) =================
  const handleOffer = async (
    offer: RTCSessionDescriptionInit,
    callerId: number
  ) => {
    const socket = socketRef.current;
    if (!socket) return;

    const pc = await ensurePeerConnection(callerId);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("answer", { targetUserId: callerId, answer });
  };

  // ================= RECEIVE ANSWER =================
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!pcRef.current) return;
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
  };

  // ================= ICE =================
  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!pcRef.current) return;
    await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
  };

  // ================= END =================
  const endCall = () => {
    pcRef.current?.close();
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;

    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

    onEnded?.();
  };

  return {
    prepareReceiver,
    startCall,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    endCall,
  };
};
