import { create } from "zustand";
import type { IPlayerState, ITrack } from "./types";

export const usePlayerStore = create<IPlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,

  setCurrentTrack: (track: ITrack | null) =>
    set({
      currentTrack: track,
    }),

  play: () =>
    set({
      isPlaying: true,
    }),

  pause: () =>
    set({
      isPlaying: false,
    }),
}));