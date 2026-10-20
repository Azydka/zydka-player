import { onTrackEnded, usePlayerStore } from "./store";
import type { ITrack } from "./types";

export const PlayerController = {
  load(track: ITrack) {
    usePlayerStore.getState().setCurrentTrack(track);
  },

  setQueue(tracks: ITrack[]) {
    usePlayerStore.getState().setQueue(tracks);
  },

  getQueue() {
    return usePlayerStore.getState().getQueue();
  },

  getCurrentIndex() {
    return usePlayerStore.getState().getCurrentIndex();
  },

  playAt(index: number) {
    return usePlayerStore.getState().playAt(index);
  },

  next() {
    return usePlayerStore.getState().next();
  },

  previous() {
    return usePlayerStore.getState().previous();
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

  setVolume(volume: number) {
    return usePlayerStore.getState().setVolume(volume);
  },

  getVolume() {
    return usePlayerStore.getState().getVolume();
  },

  mute() {
    usePlayerStore.getState().mute();
  },

  unmute() {
    usePlayerStore.getState().unmute();
  },

  isMuted() {
    return usePlayerStore.getState().isMuted();
  },

  /**
   * Runs from the audio "end" event, so the next track can start even while
   * timers are throttled (locked phone, hidden tab).
   */
  onEnded(listener: () => void): () => void {
    return onTrackEnded(listener);
  },

  state() {
    const state = usePlayerStore.getState();

    return {
      ...state,
      position: state.getCurrentTime(),
      duration: state.getDuration(),
      volume: state.getVolume(),
      muted: state.isMuted(),
    };
  },
};
