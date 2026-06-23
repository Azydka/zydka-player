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

function syncVolume(): void {
  usePlayerStore.setState({
    volume: audioEngine.getVolume(),
    muted: audioEngine.isMuted(),
  });
}

function findTrackIndex(queue: ITrack[], track: ITrack | null): number {
  if (!track) return -1;

  return queue.findIndex((queuedTrack) => queuedTrack.id === track.id);
}

audioEngine.on("loaded", ({ duration }) => {
  usePlayerStore.setState({
    status: "ready",
    duration,
    position: 0,
    volume: audioEngine.getVolume(),
    muted: audioEngine.isMuted(),
    error: null,
  });
});

audioEngine.on("playing", ({ position }) => {
  usePlayerStore.setState({
    status: "playing",
    isPlaying: true,
    position,
    duration: audioEngine.getDuration(),
    volume: audioEngine.getVolume(),
    muted: audioEngine.isMuted(),
    error: null,
  });
});

audioEngine.on("paused", ({ position }) => {
  usePlayerStore.setState({
    status: "paused",
    isPlaying: false,
    position,
    duration: audioEngine.getDuration(),
    volume: audioEngine.getVolume(),
    muted: audioEngine.isMuted(),
  });
});

audioEngine.on("ended", () => {
  usePlayerStore.setState({
    status: "ended",
    isPlaying: false,
    position: audioEngine.getDuration(),
    duration: audioEngine.getDuration(),
    volume: audioEngine.getVolume(),
    muted: audioEngine.isMuted(),
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
  currentIndex: -1,
  queue: [],
  status: "idle",
  isPlaying: false,
  position: 0,
  duration: 0,
  volume: audioEngine.getVolume(),
  muted: audioEngine.isMuted(),
  error: null,

  setCurrentTrack: (track: ITrack | null) => {
    if (!track) {
      set({
        currentTrack: null,
        currentIndex: -1,
        status: "idle",
        isPlaying: false,
        position: 0,
        duration: 0,
        volume: audioEngine.getVolume(),
        muted: audioEngine.isMuted(),
        error: null,
      });

      return;
    }

    set((state) => ({
      currentTrack: track,
      currentIndex: findTrackIndex(state.queue, track),
      status: "loading",
      isPlaying: false,
      position: 0,
      duration: 0,
      volume: audioEngine.getVolume(),
      muted: audioEngine.isMuted(),
      error: null,
    }));

    audioEngine.loadTrack(track);
  },

  setQueue: (tracks: ITrack[]) => {
    set((state) => {
      const currentIndex = findTrackIndex(tracks, state.currentTrack);

      return {
        queue: tracks,
        currentIndex: currentIndex >= 0 ? currentIndex : tracks.length > 0 ? 0 : -1,
      };
    });
  },

  getQueue: () => get().queue,

  getCurrentIndex: () => get().currentIndex,

  playAt: (index: number) => {
    const track = get().queue[index];

    if (!track) return false;

    set({
      currentTrack: track,
      currentIndex: index,
      status: "loading",
      isPlaying: false,
      position: 0,
      duration: 0,
      volume: audioEngine.getVolume(),
      muted: audioEngine.isMuted(),
      error: null,
    });

    audioEngine.loadTrack(track);
    audioEngine.play();
    syncTimeline();
    syncVolume();

    return true;
  },

  next: () => {
    const { currentIndex, queue, playAt } = get();

    if (queue.length === 0) return false;
    if (currentIndex >= queue.length - 1) return false;

    return playAt(currentIndex < 0 ? 0 : currentIndex + 1);
  },

  previous: () => {
    const { currentIndex, queue, playAt } = get();

    if (queue.length === 0) return false;
    if (currentIndex <= 0) return false;

    return playAt(currentIndex - 1);
  },

  play: () => {
    if (!get().currentTrack) return;
    audioEngine.play();
    syncTimeline();
    syncVolume();
  },

  pause: () => {
    audioEngine.pause();
    syncTimeline();
    syncVolume();
  },

  seek: (seconds: number) => {
    const position = audioEngine.seek(seconds);
    syncTimeline();
    return position;
  },

  getCurrentTime: () => audioEngine.getCurrentTime(),

  getDuration: () => audioEngine.getDuration(),

  setVolume: (volume: number) => {
    const nextVolume = audioEngine.setVolume(volume);
    syncVolume();
    return nextVolume;
  },

  getVolume: () => audioEngine.getVolume(),

  mute: () => {
    audioEngine.mute();
    syncVolume();
  },

  unmute: () => {
    audioEngine.unmute();
    syncVolume();
  },

  isMuted: () => audioEngine.isMuted(),
}));
