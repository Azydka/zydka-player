import { AudioEngine } from "@zydka/audio-engine";
import { createStore } from "zustand/vanilla";
import type { IPlayerState, ITrack } from "./types";

const audioEngine = new AudioEngine();

function syncTimeline(): void {
  usePlayerStore.setState({
    position: audioEngine.getCurrentTime(),
    duration: audioEngine.getDuration(),
  });
}

audioEngine.on("loaded", ({ duration }) => {
  usePlayerStore.setState({
    status: "ready",
    duration,
    position: 0,
    error: null,
  });
});

audioEngine.on("playing", ({ position }) => {
  usePlayerStore.setState({
    status: "playing",
    isPlaying: true,
    position,
    duration: audioEngine.getDuration(),
    error: null,
  });
});

audioEngine.on("paused", ({ position }) => {
  usePlayerStore.setState({
    status: "paused",
    isPlaying: false,
    position,
    duration: audioEngine.getDuration(),
  });
});

audioEngine.on("ended", () => {
  usePlayerStore.setState({
    status: "ended",
    isPlaying: false,
    position: audioEngine.getDuration(),
    duration: audioEngine.getDuration(),
  });
});

audioEngine.on("seeked", ({ position }) => {
  usePlayerStore.setState({
    position,
    duration: audioEngine.getDuration(),
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
  position: 0,
  duration: 0,
  error: null,

  setCurrentTrack: (track: ITrack | null) => {
    if (!track) {
      set({
        currentTrack: null,
        status: "idle",
        isPlaying: false,
        position: 0,
        duration: 0,
        error: null,
      });

      return;
    }

    set({
      currentTrack: track,
      status: "loading",
      isPlaying: false,
      position: 0,
      duration: 0,
      error: null,
    });

    audioEngine.loadTrack(track);
  },

  play: () => {
    if (!get().currentTrack) return;
    audioEngine.play();
    syncTimeline();
  },

  pause: () => {
    audioEngine.pause();
    syncTimeline();
  },

  seek: (seconds: number) => {
    const position = audioEngine.seek(seconds);
    syncTimeline();
    return position;
  },

  getCurrentTime: () => audioEngine.getCurrentTime(),

  getDuration: () => audioEngine.getDuration(),
}));
