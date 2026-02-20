"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

const sleep = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

const uploadChunk = async (blob: Blob, callLogId: number, streamId: string) => {
  const maxAttempts = 8;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        await sleep(500);
        continue;
      }

      const form = new FormData();
      form.append("file", blob, `${streamId}.webm`);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/call-recording/${callLogId}/chunk`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (res.ok) return true;
    } catch {
      // retry below
    }

    await sleep(700);
  }

  return false;
};

const finalizeRecording = async (callLogId: number) => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/call-recording/${callLogId}/finalize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    // Best effort finalize.
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
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamIdRef = useRef<string>(crypto.randomUUID());
  const pendingUploadsRef = useRef<Set<Promise<unknown>>>(new Set());
  const isEndingRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);

  const trackPendingUpload = (uploadPromise: Promise<unknown>) => {
    pendingUploadsRef.current.add(uploadPromise);
    uploadPromise.finally(() => {
      pendingUploadsRef.current.delete(uploadPromise);
    });
  };

  const waitForPendingUploads = async () => {
    const uploads = Array.from(pendingUploadsRef.current);
    if (!uploads.length) return;
    await Promise.allSettled(uploads);
  };

  const createRecorder = () => {
    const remoteStream = remoteStreamRef.current;
    if (!remoteStream || mediaRecorderRef.current) return;
    if (!callLogIdRef.current) return;

    streamIdRef.current = crypto.randomUUID();

    const mixed = new MediaStream([
      ...(localStreamRef.current?.getTracks() || []),
      ...remoteStream.getTracks(),
    ]);

    const recorder = new MediaRecorder(mixed, {
      mimeType: "audio/webm;codecs=opus",
    });

    recorder.ondataavailable = (e) => {
      if (!e.data.size) return;
      const callLogId = callLogIdRef.current;
      if (!callLogId) return;
      const uploadPromise = uploadChunk(e.data, callLogId, streamIdRef.current);
      trackPendingUpload(uploadPromise);
    };

    recorder.onstop = () => {
      setIsRecording(false);
    };

    recorder.start(2000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const maybeStartRecorder = () => {
    if (mediaRecorderRef.current) return;
    if (!pcRef.current) return;
    if (!remoteStreamRef.current) return;
    if (!callLogIdRef.current) return;
    createRecorder();
  };

  const toggleRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      createRecorder();
      return;
    }

    if (recorder.state === "recording") {
      recorder.pause();
      setIsRecording(false);
    } else {
      recorder.resume();
      setIsRecording(true);
    }
  };

  // create audio element once
  useEffect(() => {
    remoteAudioRef.current = new Audio();
    remoteAudioRef.current.autoplay = true;
  }, []);

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
      remoteStreamRef.current = event.streams[0];
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
      // Auto-start recording when media + callLogId are ready.
      maybeStartRecorder();

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

  // Fallback: if callLogId arrives after track, start recorder as soon as possible.
  useEffect(() => {
    const interval = window.setInterval(() => {
      maybeStartRecorder();
    }, 400);
    return () => window.clearInterval(interval);
  }, []);

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
    if (isEndingRef.current) return;
    isEndingRef.current = true;

    const finalize = async () => {
      const callLogId = callLogIdRef.current;
      const recorder = mediaRecorderRef.current;

      if (recorder) {
        try {
          if (recorder.state !== "inactive") {
            recorder.requestData();
            recorder.stop();
          }
        } catch {
          // no-op
        }
      }

      await waitForPendingUploads();

      if (callLogId) {
        await finalizeRecording(callLogId);
      }
    };

    void finalize().finally(() => {
      mediaRecorderRef.current = null;
      setIsRecording(false);

      pcRef.current?.close();
      pcRef.current = null;

      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;

      remoteStreamRef.current = null;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

      onEnded?.();
      isEndingRef.current = false;
    });
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
