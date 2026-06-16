import { AudioEngine } from "@zydka/audio-engine";
import { createStore } from "zustand/vanilla";
import type { IPlayerState, ITrack } from "./types";

const audioEngine = new AudioEngine();

audioEngine.on("loaded", () => {
  usePlayerStore.setState({
    status: "ready",
    error: null,
  });
});

audioEngine.on("playing", () => {
  usePlayerStore.setState({
    status: "playing",
    isPlaying: true,
    error: null,
  });
});

audioEngine.on("paused", () => {
  usePlayerStore.setState({
    status: "paused",
    isPlaying: false,
  });
});

audioEngine.on("ended", () => {
  usePlayerStore.setState({
    status: "ended",
    isPlaying: false,
  });
});

audioEngine.on("error", ({ message }) => {
  usePlayerStore.setState({
    status: "error",
    isPlaying: false,
    error: message,
  });
});

export const usePlayerStore = createStore<IPlayerState>((set, get) => ({
  currentTrack: null,
  status: "idle",
  isPlaying: false,
  error: null,

  setCurrentTrack: (track: ITrack | null) => {
    if (!track) {
      set({
        currentTrack: null,
        status: "idle",
        isPlaying: false,
        error: null,
      });

      return;
    }

    set({
      currentTrack: track,
      status: "loading",
      isPlaying: false,
      error: null,
    });

    audioEngine.loadTrack(track);
  },

  play: () => {
    if (!get().currentTrack) return;
    audioEngine.play();
  },

  pause: () => {
    audioEngine.pause();
  },
}));