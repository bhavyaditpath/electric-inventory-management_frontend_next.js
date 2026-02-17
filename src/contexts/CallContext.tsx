"use client";

import { createContext, useContext } from "react";
import CallOverlay from "@/components/chat/CallOverlay";
import { useCallWebSocket } from "@/hooks/useCallWebSocket";
import { CallDirection, CallState, CallType } from "@/types/enums";

interface CallContextType {
  callState: CallState;
  callType: CallType | null;
  isGroupCall: boolean;
  callerId: number | null;
  peerUserId: number | null;
  peerName: string | null;
  callerName: string | null;
  callDirection: CallDirection | null;
  connectedAt: number | null;
  callUser: (
    userId: number | null,
    roomId: number,
    callType?: CallType,
    targetName?: string | null,
    isGroupCall?: boolean
  ) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within CallProvider");
  }
  return context;
};

export function CallProvider({ children }: { children: React.ReactNode }) {
  const {
    callState,
    callerId,
    peerUserId,
    peerName,
    callerName,
    incomingCallType,
    isGroupCall,
    callDirection,
    connectedAt,
    callUser,
    acceptCall,
    rejectCall,
    endCall,
    toggleRecording,
    isRecording,
  } = useCallWebSocket();

  const isIncoming = callDirection === CallDirection.Incoming;

  const value: CallContextType = {
    callState,
    callType: incomingCallType,
    isGroupCall,
    callerId,
    peerUserId,
    peerName,
    callerName,
    callDirection,
    connectedAt,
    callUser,
    acceptCall,
    rejectCall,
    endCall,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
      <CallOverlay
        visible={callState !== CallState.Idle}
        state={callState}
        userId={peerUserId ?? undefined}
        displayName={isIncoming ? callerName ?? undefined : peerName ?? undefined}
        isGroupCall={isGroupCall}
        incoming={callState === CallState.Ringing}
        callKind={incomingCallType}
        connectedAt={connectedAt}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={endCall}
        isRecording={isRecording?.()}
        onToggleRecording={toggleRecording}
      />
    </CallContext.Provider>
  );
}
