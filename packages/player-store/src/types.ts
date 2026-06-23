import type { AudioEngineStatus, AudioTrack } from "@zydka/audio-engine";

export type ITrack = AudioTrack;

export interface IPlayerState {
  currentTrack: ITrack | null;
  currentIndex: number;
  queue: ITrack[];
  status: AudioEngineStatus;
  isPlaying: boolean;
  position: number;
  duration: number;
  error: string | null;

  setCurrentTrack: (track: ITrack | null) => void;
  setQueue: (tracks: ITrack[]) => void;
  getQueue: () => ITrack[];
  getCurrentIndex: () => number;
  playAt: (index: number) => boolean;
  next: () => boolean;
  previous: () => boolean;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => number;
  getCurrentTime: () => number;
  getDuration: () => number;
}
