import { AudioEngine } from "@zydka/audio-engine";
import { create } from "zustand";
import type { IPlayerState, ITrack } from "./types";

const audioEngine = new AudioEngine();

audioEngine.on("playing", () => {
  usePlayerStore.setState({
    isPlaying: true,
    error: null,
  });
});

audioEngine.on("paused", () => {
  usePlayerStore.setState({
    isPlaying: false,
  });
});

audioEngine.on("ended", () => {
  usePlayerStore.setState({
    isPlaying: false,
  });
});

audioEngine.on("error", ({ message }) => {
  usePlayerStore.setState({
    isPlaying: false,
    error: message,
  });
});

export const usePlayerStore = create<IPlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  error: null,

  setCurrentTrack: (track: ITrack | null) => {
    set({
      currentTrack: track,
      isPlaying: false,
      error: null,
    });

    if (track) {
      audioEngine.loadTrack(track);
    }
  },

  play: () => {
    if (!get().currentTrack) return;
    audioEngine.play();
  },

  pause: () => {
    audioEngine.pause();
  },
}));