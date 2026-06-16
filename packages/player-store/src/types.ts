import type { AudioTrack } from "@zydka/audio-engine";

export type ITrack = AudioTrack;

export interface IPlayerState {
  currentTrack: ITrack | null;
  isPlaying: boolean;
  error: string | null;

  setCurrentTrack: (track: ITrack | null) => void;
  play: () => void;
  pause: () => void;
}