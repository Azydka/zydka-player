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

  seek(seconds: number) {
    return usePlayerStore.getState().seek(seconds);
  },

  getCurrentTime() {
    return usePlayerStore.getState().getCurrentTime();
  },

  getDuration() {
    return usePlayerStore.getState().getDuration();
  },

  state() {
    const state = usePlayerStore.getState();

    return {
      ...state,
      position: state.getCurrentTime(),
      duration: state.getDuration(),
    };
  },
};
