import { usePlayerStore } from "./store";
import type { ITrack } from "./types";

export const PlayerController = {
  load(track: ITrack) {
    usePlayerStore.getState().setCurrentTrack(track);
  },

  play() {
    usePlayerStore.getState().play();
  },

  pause() {
    usePlayerStore.getState().pause();
  },

  state() {
    return usePlayerStore.getState();
  },
};