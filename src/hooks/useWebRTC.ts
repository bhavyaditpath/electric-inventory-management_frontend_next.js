"use client";

import { RefObject, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

const uploadChunk = async (blob: Blob, callLogId: number, streamId: string) => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setTimeout(() => uploadChunk(blob, callLogId, streamId), 500);
      return;
    }

    const form = new FormData();
    form.append("file", blob, `${streamId}.webm`);

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/call-recording/${callLogId}/chunk`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });
  } catch {
    // ignore network errors (next chunk will continue)
  }
};

export const useWebRTC = (
  socketRef: RefObject<Socket | null>,
  targetUserIdRef: RefObject<number | null>,
  callLogIdRef: RefObject<number | null>,
  onConnected?: () => void,
  onEnded?: () => void
) => {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const uploadAbortRef = useRef(false);
  const isRecordingRef = useRef(false);
  const streamIdRef = useRef<string>(crypto.randomUUID());

  const toggleRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      isRecordingRef.current = false;
    } else {
      mediaRecorderRef.current.resume();
      isRecordingRef.current = true;
    }
  };

  const isRecording = () => {
    return mediaRecorderRef.current?.state === "recording";
  };

  // create audio element once
  useEffect(() => {
    remoteAudioRef.current = new Audio();
    remoteAudioRef.current.autoplay = true;
  }, []);

  const tryStartRecorder = (remoteStream: MediaStream) => {
    const callLogId = callLogIdRef.current;
    if (!callLogId || mediaRecorderRef.current) return;

    const mixed = new MediaStream([
      ...(localStreamRef.current?.getTracks() || []),
      ...remoteStream.getTracks(),
    ]);

    const recorder = new MediaRecorder(mixed, {
      mimeType: "audio/webm;codecs=opus",
    });

    recorder.ondataavailable = (e) => {
      if (!e.data.size || uploadAbortRef.current) return;
      uploadChunk(e.data, callLogId, streamIdRef.current);
    };

    recorder.start(2000);
    mediaRecorderRef.current = recorder;
  };


  const ensurePeerConnection = async (targetUserId: number) => {
    if (pcRef.current) return pcRef.current;

    let stream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        console.warn("mediaDevices.getUserMedia is not available in this browser");
      }
    } catch (error) {
      // Allow signaling to continue even without local audio input.
      // This avoids uncaught NotFoundError when no capture device exists.
      console.warn("Failed to capture local audio stream:", error);
      stream = null;
    }
    localStreamRef.current = stream;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }

      if (!mediaRecorderRef.current && callLogIdRef.current) {
        tryStartRecorder(event.streams[0]);
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
    uploadAbortRef.current = true;

    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      } catch { }

      mediaRecorderRef.current = null;
    }

    onEnded?.();
  };


  return {
    prepareReceiver,
    startCall,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    endCall,
    toggleRecording,
    isRecording,
  };
};
