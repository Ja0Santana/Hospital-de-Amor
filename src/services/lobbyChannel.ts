export interface LobbyMessage {
  type: 'call' | 'clear';
  patientDisplayName?: string;
  examType?: string;
  callTicket?: string;
  professionalName?: string;
  timestamp: number;
}

const LOBBY_CHANNEL_NAME = 'hospital_amor_lobby';
let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(LOBBY_CHANNEL_NAME);
  }
  return channel;
}

export function dispatchLobbyCall(patientDisplayName: string, examType: string, callTicket: string, professionalName?: string): void {
  const msg: LobbyMessage = {
    type: 'call',
    patientDisplayName,
    examType,
    callTicket,
    professionalName,
    timestamp: Date.now()
  };
  getChannel().postMessage(msg);
}

export function clearLobbyScreen(): void {
  const msg: LobbyMessage = {
    type: 'clear',
    timestamp: Date.now()
  };
  getChannel().postMessage(msg);
}

export function subscribeToLobby(callback: (msg: LobbyMessage) => void): () => void {
  const ch = getChannel();
  const handler = (event: MessageEvent) => {
    callback(event.data);
  };
  ch.addEventListener('message', handler);
  return () => {
    ch.removeEventListener('message', handler);
  };
}
