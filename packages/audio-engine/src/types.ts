export interface AudioTrack {
  id: number;
  audioUrl: string;
  title?: string;
  artist?: string;
  duration?: number;
}

export type AudioEngineStatus =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "ended"
  | "error";

export interface AudioEngineState {
  status: AudioEngineStatus;
  currentTrack: AudioTrack | null;
  position: number;
  duration: number;
  volume: number;
  error: string | null;
}

export type AudioEngineEvent =
  | "loaded"
  | "playing"
  | "paused"
  | "ended"
  | "error"
  | "seeked";

export interface AudioEngineEventPayload {
  loaded: { track: AudioTrack; duration: number };
  playing: { position: number };
  paused: { position: number };
  ended: { track: AudioTrack };
  error: { message: string; track: AudioTrack | null };
  seeked: { position: number };
}

export type AudioEngineListener<E extends AudioEngineEvent> = (
  payload: AudioEngineEventPayload[E],
) => void;

export interface AudioEngineOptions {
  initialVolume?: number;
  formats?: string[];
  debug?: boolean;
}