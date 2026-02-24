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
  currentUserIdRef: RefObject<number | null>,
  targetUserIdRef: RefObject<number | null>,
  callLogIdRef: RefObject<number | null>,
  onConnected?: () => void,
  onEnded?: () => void
) => {
  const pcsRef = useRef<Map<number, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamsRef = useRef<Map<number, MediaStream>>(new Map());
  const remoteAudioRefs = useRef<Map<number, HTMLAudioElement>>(new Map());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamIdRef = useRef<string>(crypto.randomUUID());
  const pendingUploadsRef = useRef<Set<Promise<unknown>>>(new Set());
  const pendingIceCandidatesRef = useRef<Map<number, RTCIceCandidateInit[]>>(new Map());
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

  const getQueuedCandidates = (peerId: number) =>
    pendingIceCandidatesRef.current.get(peerId) ?? [];

  const queueIceCandidate = (peerId: number, candidate: RTCIceCandidateInit) => {
    const current = getQueuedCandidates(peerId);
    current.push(candidate);
    pendingIceCandidatesRef.current.set(peerId, current);
  };

  const flushPendingIceCandidates = async (peerId: number) => {
    const pc = pcsRef.current.get(peerId);
    if (!pc || !pc.remoteDescription) return;

    const queued = [...getQueuedCandidates(peerId)];
    pendingIceCandidatesRef.current.delete(peerId);

    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.warn("Failed to add queued ICE candidate:", error);
      }
    }
  };

  const createRecorder = () => {
    const remoteStreams = Array.from(remoteStreamsRef.current.values());
    if (!remoteStreams.length || mediaRecorderRef.current) return;
    if (!callLogIdRef.current) return;

    streamIdRef.current = crypto.randomUUID();

    const remoteTracks = remoteStreams.flatMap((stream) => stream.getTracks());
    const mixed = new MediaStream([...(localStreamRef.current?.getTracks() || []), ...remoteTracks]);

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
    if (!pcsRef.current.size) return;
    if (!remoteStreamsRef.current.size) return;
    if (!callLogIdRef.current) return;
    createRecorder();
  };

  const cleanupPeerResources = (peerId: number) => {
    const pc = pcsRef.current.get(peerId);
    if (pc) {
      pc.close();
      pcsRef.current.delete(peerId);
    }

    const audio = remoteAudioRefs.current.get(peerId);
    if (audio) {
      audio.srcObject = null;
      remoteAudioRefs.current.delete(peerId);
    }

    remoteStreamsRef.current.delete(peerId);
    pendingIceCandidatesRef.current.delete(peerId);
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

  const ensureLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
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
    return stream;
  };

  const ensurePeerConnection = async (targetUserId: number) => {
    const existing = pcsRef.current.get(targetUserId);
    if (existing) return existing;

    const stream = await ensureLocalStream();

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcsRef.current.set(targetUserId, pc);

    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      remoteStreamsRef.current.set(targetUserId, remoteStream);

      let audioElement = remoteAudioRefs.current.get(targetUserId);
      if (!audioElement) {
        audioElement = new Audio();
        audioElement.autoplay = true;
        remoteAudioRefs.current.set(targetUserId, audioElement);
      }
      audioElement.srcObject = remoteStream;
      void audioElement.play().catch(() => {
        return;
      });

      // Auto-start recording when media + callLogId are ready.
      maybeStartRecorder();

      onConnected?.();
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const fromUserId = currentUserIdRef.current;
        socketRef.current?.emit("iceCandidate", {
          targetUserId,
          candidate: {
            fromUserId,
            candidate: event.candidate,
          },
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
  const startCall = async (forcedTargetUserId?: number) => {
    const socket = socketRef.current;
    const targetUserId = forcedTargetUserId ?? targetUserIdRef.current;
    if (!socket || !targetUserId) return;

    const pc = await ensurePeerConnection(targetUserId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("offer", {
      targetUserId,
      offer: {
        fromUserId: currentUserIdRef.current,
        sdp: offer,
      },
    });
  };

  // ================= RECEIVE OFFER (receiver) =================
  const handleOffer = async (
    offerPayload: RTCSessionDescriptionInit | { fromUserId?: number; sdp?: RTCSessionDescriptionInit },
    callerId: number
  ) => {
    const socket = socketRef.current;
    if (!socket) return;

    const wrapped = offerPayload as { fromUserId?: number; sdp?: RTCSessionDescriptionInit };
    const resolvedCallerId = wrapped?.fromUserId ?? callerId;
    const offer = wrapped?.sdp ?? (offerPayload as RTCSessionDescriptionInit);
    if (!resolvedCallerId) return;

    const pc = await ensurePeerConnection(resolvedCallerId);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    await flushPendingIceCandidates(resolvedCallerId);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("answer", {
      targetUserId: resolvedCallerId,
      answer: {
        fromUserId: currentUserIdRef.current,
        sdp: answer,
      },
    });
  };

  // ================= RECEIVE ANSWER =================
  const handleAnswer = async (
    answerPayload: RTCSessionDescriptionInit | { fromUserId?: number; sdp?: RTCSessionDescriptionInit },
    fromUserId?: number
  ) => {
    const wrapped = answerPayload as { fromUserId?: number; sdp?: RTCSessionDescriptionInit };
    const peerId = wrapped?.fromUserId ?? fromUserId;
    const answer = wrapped?.sdp ?? (answerPayload as RTCSessionDescriptionInit);
    if (!peerId) return;

    const pc = pcsRef.current.get(peerId);
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    await flushPendingIceCandidates(peerId);
  };

  // ================= ICE =================
  const handleIceCandidate = async (
    candidatePayload: RTCIceCandidateInit | { fromUserId?: number; candidate?: RTCIceCandidateInit },
    fromUserId?: number
  ) => {
    const wrapped = candidatePayload as { fromUserId?: number; candidate?: RTCIceCandidateInit };
    const peerId = wrapped?.fromUserId ?? fromUserId ?? targetUserIdRef.current;
    const candidate = wrapped?.candidate ?? (candidatePayload as RTCIceCandidateInit);
    if (!peerId || !candidate) return;

    const pc = pcsRef.current.get(peerId);
    if (!pc || !pc.remoteDescription) {
      queueIceCandidate(peerId, candidate);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.warn("Failed to add ICE candidate:", error);
    }
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

      for (const peerId of Array.from(pcsRef.current.keys())) {
        cleanupPeerResources(peerId);
      }

      pendingIceCandidatesRef.current.clear();

      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;

      remoteStreamsRef.current.clear();

      onEnded?.();
      isEndingRef.current = false;
    });
  };

  const endPeer = (peerId: number) => {
    cleanupPeerResources(peerId);
    if (pcsRef.current.size === 0) {
      endCall();
    }
  };


  return {
    prepareReceiver,
    startCall,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    endPeer,
    endCall,
    toggleRecording,
    isRecording,
  };
};
