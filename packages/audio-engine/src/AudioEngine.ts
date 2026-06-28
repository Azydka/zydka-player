import { Howl } from "howler";
import type {
  AudioEngineEvent,
  AudioEngineEventPayload,
  AudioEngineListener,
  AudioEngineOptions,
  AudioEngineState,
  AudioEngineStatus,
  AudioTrack,
} from "./types";

export class AudioEngine {
  private howl: Howl | null = null;
  private currentTrack: AudioTrack | null = null;
  private status: AudioEngineStatus = "idle";
  private errorMessage: string | null = null;
  private volume: number;
  private previousVolume: number;
  private muted = false;
  private readonly formats?: string[];
  private readonly debug: boolean;

  private readonly listeners: {
    [E in AudioEngineEvent]: Set<AudioEngineListener<E>>;
  } = {
    loaded: new Set(),
    playing: new Set(),
    paused: new Set(),
    ended: new Set(),
    error: new Set(),
    seeked: new Set(),
  };

  constructor(options: AudioEngineOptions = {}) {
    this.volume = AudioEngine.clampVolume(options.initialVolume ?? 1);
    this.previousVolume = this.volume > 0 ? this.volume : 1;
    this.formats = options.formats;
    this.debug = options.debug ?? false;
  }

  loadTrack(track: AudioTrack): void {
    this.teardownHowl();

    this.currentTrack = track;
    this.errorMessage = null;
    this.setStatus("loading");

    const howl = new Howl({
      src: [track.audioUrl],
      format: this.formats,
      html5: true,
      volume: this.volume,
      preload: true,
    });

    howl.mute(this.muted);

    howl.on("load", () => {
      this.setStatus("ready");
      this.emit("loaded", { track, duration: this.getDuration() });
    });

    howl.on("play", () => {
      this.setStatus("playing");
      this.emit("playing", { position: this.getCurrentTime() });
    });

    howl.on("pause", () => {
      this.setStatus("paused");
      this.emit("paused", { position: this.getCurrentTime() });
    });

    howl.on("end", () => {
      this.setStatus("ended");
      this.emit("ended", { track });
    });

    howl.on("seek", () => {
      this.emit("seeked", { position: this.getCurrentTime() });
    });

    howl.on("loaderror", (_id, err) => {
      this.handleError("Impossible de lire ce morceau (load): " + String(err));
    });

    howl.on("playerror", (_id, err) => {
      this.handleError("Impossible de lire ce morceau (play): " + String(err));
    });

    this.howl = howl;
    this.log("loadTrack", track.audioUrl);
  }

  play(): void {
    if (!this.howl) return;
    this.howl.play();
  }

  pause(): void {
    if (!this.howl) return;
    this.howl.pause();
  }

  stop(): void {
    if (!this.howl) return;
    this.howl.stop();
    this.setStatus("ready");
  }

  getCurrentTime(): number {
    return this.safeSeek();
  }

  getDuration(): number {
    if (!this.howl) return 0;

    const duration = this.howl.duration();
    return Number.isFinite(duration) ? duration : 0;
  }

  seek(seconds: number): number {
    if (!this.howl) return 0;

    const duration = this.getDuration();
    const clamped = Math.max(0, duration > 0 ? Math.min(seconds, duration) : seconds);

    this.howl.seek(clamped);
    this.emit("seeked", { position: clamped });

    return clamped;
  }

  setVolume(volume: number): number {
    this.volume = AudioEngine.clampVolume(volume);

    if (this.volume > 0) {
      this.previousVolume = this.volume;
    }

    if (this.howl) {
      this.howl.volume(this.volume);
    }

    return this.volume;
  }

  getVolume(): number {
    return this.volume;
  }

  mute(): void {
    if (this.volume > 0) {
      this.previousVolume = this.volume;
    }

    this.muted = true;

    if (this.howl) {
      this.howl.mute(true);
    }
  }

  unmute(): void {
    this.muted = false;

    if (this.volume === 0) {
      this.setVolume(this.previousVolume || 1);
    }

    if (this.howl) {
      this.howl.mute(false);
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  getState(): AudioEngineState {
    return {
      status: this.status,
      currentTrack: this.currentTrack,
      position: this.getCurrentTime(),
      duration: this.getDuration(),
      volume: this.volume,
      muted: this.muted,
      error: this.errorMessage,
    };
  }

  on<E extends AudioEngineEvent>(
    event: E,
    listener: AudioEngineListener<E>,
  ): () => void {
    this.listeners[event].add(listener);
    return () => this.off(event, listener);
  }

  off<E extends AudioEngineEvent>(
    event: E,
    listener: AudioEngineListener<E>,
  ): void {
    this.listeners[event].delete(listener);
  }

  destroy(): void {
    this.teardownHowl();

    (Object.keys(this.listeners) as AudioEngineEvent[]).forEach((event) => {
      this.listeners[event].clear();
    });

    this.currentTrack = null;
    this.errorMessage = null;
    this.setStatus("idle");
  }

  private teardownHowl(): void {
    if (this.howl) {
      this.howl.off();
      this.howl.stop();
      this.howl.unload();
      this.howl = null;
    }
  }

  private handleError(message: string): void {
    this.errorMessage = message;
    this.setStatus("error");
    this.emit("error", { message, track: this.currentTrack });
    this.log("error", message);
  }

  private setStatus(status: AudioEngineStatus): void {
    this.status = status;
  }

  private safeSeek(): number {
    if (!this.howl) return 0;

    const position = this.howl.seek();
    return typeof position === "number" && Number.isFinite(position) ? position : 0;
  }

  private emit<E extends AudioEngineEvent>(
    event: E,
    payload: AudioEngineEventPayload[E],
  ): void {
    this.listeners[event].forEach((listener) => {
      listener(payload);
    });
  }

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log("[AudioEngine]", ...args);
    }
  }

  private static clampVolume(volume: number): number {
    if (Number.isNaN(volume)) return 1;
    return Math.min(1, Math.max(0, volume));
  }
}
