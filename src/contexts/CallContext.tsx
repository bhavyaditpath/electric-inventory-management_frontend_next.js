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
  ignoreIncomingCall: () => void;
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
    isIncomingIgnored,
    callUser,
    acceptCall,
    rejectCall,
    endCall,
    ignoreIncomingCall,
    toggleRecording,
    isRecording,
  } = useCallWebSocket();

  const isIncoming = callDirection === CallDirection.Incoming;
  const showJoinAfterIgnore =
    isIncoming &&
    isGroupCall &&
    callState === CallState.Ringing &&
    isIncomingIgnored;

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
    ignoreIncomingCall,
  };

  const overlayVisible =
    callState !== CallState.Idle &&
    !(isIncoming && callState === CallState.Ringing && isIncomingIgnored && !showJoinAfterIgnore);

  return (
    <CallContext.Provider value={value}>
      {children}
      <CallOverlay
        visible={overlayVisible}
        state={callState}
        userId={peerUserId ?? undefined}
        displayName={isIncoming ? callerName ?? undefined : peerName ?? undefined}
        isGroupCall={isGroupCall}
        incoming={callState === CallState.Ringing}
        callKind={incomingCallType}
        connectedAt={connectedAt}
        onAccept={acceptCall}
        onReject={rejectCall}
        onIgnore={ignoreIncomingCall}
        showJoinAfterIgnore={showJoinAfterIgnore}
        onEnd={endCall}
        isRecording={isRecording}
        onToggleRecording={toggleRecording}
      />
    </CallContext.Provider>
  );
}
