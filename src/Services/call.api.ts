import { apiClient } from "./api";
import { CallType } from "@/types/enums";

export interface CallParticipant {
  userId: number;
  username: string;
}

export type CallLogStatus = "MISSED" | "ANSWERED" | "REJECTED" | "CANCELLED";

export interface CallLog {
  id: number;
  roomId: number;
  callerId?: number;
  receiverId?: number;
  type?: CallType | null;
  status: CallLogStatus | string;
  startedAt?: string | null;
  createdAt?: string | null;
  endedAt?: string | null;
  duration?: number | null;
  participants?: CallParticipant[];
}

export const callApi = {
  getCallHistory: () =>
    apiClient.get<CallLog[]>("/call-logs/history"),

  getMissedCalls: () =>
    apiClient.get<CallLog[]>("/call-logs/missed"),

  getRoomCallHistory: (roomId: number) =>
    apiClient.get<CallLog[]>(`/call-logs/${roomId}`),
};
