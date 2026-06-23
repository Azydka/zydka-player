import type { AudioEngineStatus, AudioTrack } from "@zydka/audio-engine";

export type ITrack = AudioTrack;

export interface IPlayerState {
  currentTrack: ITrack | null;
  status: AudioEngineStatus;
  isPlaying: boolean;
  position: number;
  duration: number;
  error: string | null;

  setCurrentTrack: (track: ITrack | null) => void;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => number;
  getCurrentTime: () => number;
  getDuration: () => number;
}
