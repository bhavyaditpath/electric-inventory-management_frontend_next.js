# Chat and Call Functionality Implementation

## 1) Objective
This document explains how chat and call functionality was implemented in the frontend, including architecture, design approach, real-time flow, and key decisions.

## 2) High-Level Approach
I implemented chat and calling as one unified real-time module with:

- REST APIs for persistence and history (rooms, messages, logs, recordings).
- Socket.IO for live events (new messages, typing, online/offline, call signaling, call lifecycle).
- WebRTC for peer-to-peer media transport in calls.
- Context + custom hooks to keep business logic separate from UI components.

This gives a hybrid model:

- Reliable server state via API.
- Low-latency UX via WebSocket/WebRTC.
- UI components focused on rendering and user interaction.

## 3) Entry Points and Module Structure

### Routing and Page Composition
- `src/app/admin/chat/page.tsx`
- `src/app/branch/chat/page.tsx`

Both routes render the shared `ChatPage` component:
- `src/components/chat/ChatPage.tsx`

### Global Integration
- `src/app/layout.tsx` wraps app with `CallProvider`, so call overlay and call state are available globally.
- `ChatReactionNotifier` is mounted globally for toast notifications from real-time chat events.

### Main Frontend Layers
- UI: `src/components/chat/*`
- Chat real-time hook: `src/hooks/useChatWebSocket.ts`
- Call real-time hook: `src/hooks/useCallWebSocket.ts`
- WebRTC engine: `src/hooks/useWebRTC.ts`
- State sharing: `src/contexts/CallContext.tsx`
- API clients: `src/Services/chat.api.ts`, `src/Services/call.api.ts`
- Type contracts: `src/types/chat.types.ts`, `src/types/enums.ts`

## 4) Chat Implementation

### 4.1 Room and Message Lifecycle
In `ChatPage`, I maintain core state:
- Room list
- Active room
- Message list for active room
- Typing indicators
- Online/offline users
- Group management modals and message action modals

Initial load:
1. Fetch rooms (`chatApi.getRooms`)
2. Fetch users with online status (`chatApi.getUsersWithOnlineStatus`)

On room select:
1. Leave previous socket room (if joined)
2. Join selected socket room (`joinRoom`)
3. Fetch message history (`chatApi.getMessages`)
4. Fetch room details (`chatApi.getRoom`)
5. Mark room as read via both API and socket

### 4.2 Real-Time Chat Events
`useChatWebSocket` connects to `/chat` namespace with JWT token and subscribes to:
- `newMessage`
- `messageUpdated`
- `messageDeleted`
- `messageReactionUpdated`
- `messageNotification`
- `reactionNotification`
- `roomUpdated`
- `userTyping`
- `userOnline`
- `userOffline`

I pass handlers from `ChatPage` to update local state immediately and keep room summaries (last message, unread count) in sync.

### 4.3 Sending Messages Strategy
Message send logic is intentionally hybrid:
- If socket is connected and payload is simple text: send through socket for low latency.
- If attachments exist or reply message exists: send via REST API (`chatApi.sendMessage`) using JSON or multipart form-data.

This approach supports advanced payloads while keeping plain text delivery fast.

### 4.4 Advanced Chat Features Implemented
- Direct chat creation (`getOrCreateDirectChat`)
- Group creation and participant management
- Rename group room
- Pin/unpin room
- Delete room
- Delete/edit message
- Reply to message
- Forward message with optional note
- Message reactions with optimistic updates and server reconciliation
- Attachments download
- Typing indicators with auto-expiry timeout
- Unread count updates and mark-as-read sync

## 5) Calling Implementation

### 5.1 Call State Model
Call flow uses explicit enums:
- `CallState`: `idle`, `calling`, `ringing`, `connecting`, `connected`
- `CallDirection`: incoming / outgoing
- `CallType`: audio / video
- `CallOutcome`: accepted, rejected, cancelled, missed, busy, ended

This creates a predictable state machine for UI and side effects.

### 5.2 Real-Time Signaling and Call Lifecycle
`useCallWebSocket` handles:
- Socket connection/auth
- Incoming call handling
- Accept/reject/cancel/end flow
- Group call edge cases
- Call outcome sounds
- Call session persistence/recovery using `sessionStorage`

Socket events used:
- `incomingCall`
- `callAccepted`
- `callRejected`
- `callEnded`
- `callCancelled`
- `callNoAnswer`
- `missedCall`
- `userBusy`
- `offer`
- `answer`
- `iceCandidate`

Actions emitted:
- `callUser`
- `acceptCall`
- `rejectCall`
- `cancelCall`
- `endCall`

### 5.3 WebRTC Media and Peer Management
`useWebRTC` is the media layer:
- Creates and manages `RTCPeerConnection` instances
- Uses STUN server (`stun.l.google.com:19302`)
- Captures local audio stream via `getUserMedia`
- Handles offer/answer exchange
- Handles ICE candidates (including queue-before-remote-description pattern)
- Plays remote audio via dynamic audio elements
- Supports single and multi-peer cleanup paths (`endCall`, `endPeer`)

### 5.4 Call Recording Implementation
Recording is handled on the client with `MediaRecorder`:
- Builds a mixed stream from local + remote tracks
- Emits chunks every 2 seconds
- Uploads chunks to backend endpoint:
  - `POST /call-recording/{callLogId}/chunk`
- Retries upload on transient failures
- Finalizes recording:
  - `POST /call-recording/{callLogId}/finalize`

Call logs modal supports:
- History, missed, room-specific logs
- Audio/video filtering
- Play recording blob
- Download recording file

### 5.5 Socket Flow and Connection Across Two Different Networks
To connect two users on different networks (for example, branch office network and home/mobile network), I use this sequence:

1. Both clients connect to the same Socket.IO namespace (`/chat`) using JWT auth.
2. Caller sends `callUser` event to backend with target user/room and call type.
3. Backend emits `incomingCall` to callee and manages call lifecycle events (`callAccepted`, `callRejected`, `callEnded`, etc.).
4. After accept, both peers exchange WebRTC signaling payloads (`offer`, `answer`, `iceCandidate`) through socket events.
5. Once ICE connectivity checks succeed, media flows peer-to-peer directly between clients.

How cross-network connectivity is achieved:
- Signaling always goes through backend socket server, so both peers can coordinate even from different networks.
- `RTCPeerConnection` uses STUN (`stun.l.google.com:19302`) to discover public candidates.
- ICE tries all candidate pairs and selects a working route automatically.
- If direct P2P route is restricted by NAT/firewall, TURN can be added on backend config as relay fallback (architecture supports this extension).

### 5.6 Five Core WebRTC Processes Implemented

#### Process 1: `MediaStream`
- In `useWebRTC`, local media is captured using `navigator.mediaDevices.getUserMedia({ audio: true })`.
- The stream is cached and reused to avoid repeated capture prompts.
- Local tracks are attached to each peer connection.
- Remote tracks are received in `pc.ontrack`, stored per peer, and played via audio elements.

#### Process 2: `RTCPeerConnection`
- A dedicated `RTCPeerConnection` is created per peer (`pcsRef` map).
- Connections are configured with ICE servers.
- For group calls, multiple peer connections can coexist.
- Peer-level cleanup (`endPeer`) and full cleanup (`endCall`) are both handled.

#### Process 3: SDP Offer/Answer
- Caller creates offer (`createOffer`) and sends via socket `offer`.
- Receiver sets remote description, creates answer (`createAnswer`), and sends via socket `answer`.
- Caller sets remote description from received answer.
- This completes media capability negotiation between peers.

#### Process 4: ICE Candidates
- Each generated candidate (`onicecandidate`) is emitted through socket `iceCandidate`.
- Receiver adds candidate after remote description is set.
- If candidate arrives early, it is queued and flushed later (prevents race conditions).
- ICE connectivity checks determine the actual working path between two networks.

#### Process 5: Call State Machine
- I manage call state with explicit enums:
  - `idle` -> no active call
  - `calling` -> outgoing ring phase
  - `ringing` -> incoming ring phase
  - `connecting` -> accepted/signaling/media setup in progress
  - `connected` -> active media session
- Transitions are driven by socket lifecycle events and local actions (accept/reject/end/ignore).
- Additional `CallOutcome` values are used for user feedback and reliable call termination behavior.

## 6) UI/UX Design Decisions

### Chat UI
- Single shared `ChatPage` for both admin and branch routes.
- Desktop split layout (sidebar + window), mobile view switch behavior.
- Context menus and modals for high-action workflows (group/user management, deletion, forwarding).

### Call UI
- Global `CallOverlay` rendered from `CallProvider`, so call controls stay available across screens.
- Incoming controls: Accept, Decline, Ignore.
- Active controls: End call.
- Group-call ignore path allows rejoining ongoing call.
- Duration timer shown while connected.

## 7) API Use Cases 

This section presents APIs as business use cases instead of only endpoint listing.

### 7.1 Chat Use Cases
1. Start a new direct conversation
- Actor: Any authenticated user
- API: `POST /chat/rooms/direct/{userId}`
- Outcome: Opens existing direct room or creates one if not available.

2. Create and manage group conversations
- Actor: Group creator/admin
- APIs:
  - `POST /chat/rooms`
  - `POST /chat/rooms/{roomId}/participants`
  - `POST /chat/rooms/{roomId}/participants/remove`
  - `PATCH /chat/rooms/{roomId}/name`
- Outcome: Group lifecycle management (create, add/remove users, rename).

3. Load chat workspace and room history
- Actor: Any authenticated user
- APIs:
  - `GET /chat/rooms`
  - `GET /chat/rooms/{roomId}`
  - `GET /chat/rooms/{roomId}/messages?page=&limit=`
  - `GET /chat/users/online-status`
- Outcome: Sidebar data, room metadata, message timeline, and presence status.

4. Send messages (text, reply, attachments)
- Actor: Any authenticated user
- API: `POST /chat/messages` (JSON for text, multipart form-data for attachments/replies)
- Outcome: Message persisted and distributed to room participants.

5. Update message status and engagement
- Actor: Any authenticated user
- APIs:
  - `POST /chat/rooms/{roomId}/read`
  - `PATCH /chat/messages/{messageId}`
  - `DELETE /chat/messages/{messageId}`
  - `POST /chat/messages/{messageId}/reactions`
  - `POST /chat/messages/forward`
- Outcome: Read receipts, content edits, deletion, reactions, and forwarding support.

6. Organize and maintain rooms
- Actor: Any authenticated user (based on permissions)
- APIs:
  - `POST /chat/rooms/{roomId}/pin`
  - `DELETE /chat/rooms/{roomId}`
- Outcome: Better room prioritization and room cleanup.

7. Access shared files
- Actor: Any room participant with access
- API: `GET /chat/attachments/{attachmentId}/download`
- Outcome: Secure attachment retrieval.

### 7.2 Call and Recording Use Cases
1. View organization call activity
- Actor: Any authenticated user (by access scope)
- APIs:
  - `GET /call-logs/history`
  - `GET /call-logs/missed`
  - `GET /call-logs/{roomId}`
- Outcome: Audit-style visibility into all, missed, and room-specific calls.

2. Playback and download call recordings
- Actor: Authorized user
- APIs:
  - `GET /call-recording/{callLogId}/play`
  - `GET /call-recording/{callLogId}/download`
- Outcome: Compliance, review, and operational follow-up.

3. Persist recording from browser session
- Actor: System-managed during active call
- APIs:
  - `POST /call-recording/{callLogId}/chunk`
  - `POST /call-recording/{callLogId}/finalize`
- Outcome: Streaming chunk uploads and final media assembly after call ends.

### 7.3 Real-Time Socket Use Cases
1. Live chat collaboration
- Events: `newMessage`, `messageUpdated`, `messageDeleted`, `userTyping`, `userOnline`, `userOffline`, `roomUpdated`
- Outcome: Near real-time messaging and presence.

2. Call signaling and control
- Events: `incomingCall`, `callAccepted`, `callRejected`, `callEnded`, `callCancelled`, `callNoAnswer`, `missedCall`, `userBusy`
- Outcome: Reliable call lifecycle control.

3. WebRTC negotiation transport
- Events: `offer`, `answer`, `iceCandidate`
- Outcome: Peer media path negotiation across different networks.

## 8) Reliability and Edge-Case Handling
- Socket auth token check before connect.
- Full listener cleanup on unmount to prevent duplicate handlers.
- Session recovery for in-progress calls after refresh (TTL-based).
- Outgoing call auto-timeout handling.
- Group-call terminal-event filtering (avoid wrong state transitions from unrelated invitees).
- ICE queueing until remote description is available.
- Graceful behavior when no local audio capture device exists.
- Best-effort finalize for recording flow.

## 9) Security and Access Patterns
- Socket and API requests use bearer token from local storage.
- Chat pages are part of role-based route areas (`/admin/chat`, `/branch/chat`).
- Frontend enforces UI-level role restrictions (e.g., group creation visibility for admin).

## 10) Why This Approach Was Chosen
I chose this architecture to balance:
- Performance: sockets/WebRTC for real-time interactions.
- Maintainability: clear split between UI, hooks, context, and services.
- Scalability: server-authoritative persistence + client-optimized live updates.
- User experience: immediate feedback, resilient call lifecycle, and recoverable sessions.

## 11) Outcome
The implemented module provides a production-style chat and calling experience with:
- Real-time messaging + presence
- Group and direct conversations
- End-to-end call lifecycle handling
- Recording and call-log access
- Mobile and desktop support

The implementation is modular, extensible, and aligned with typical enterprise frontend architecture for communication features.
