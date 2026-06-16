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

    howl.on("load", () => {
      this.setStatus("ready");
      this.emit("loaded", { track, duration: howl.duration() });
    });

    howl.on("play", () => {
      this.setStatus("playing");
      this.emit("playing", { position: this.safeSeek() });
    });

    howl.on("pause", () => {
      this.setStatus("paused");
      this.emit("paused", { position: this.safeSeek() });
    });

    howl.on("end", () => {
      this.setStatus("ended");
      this.emit("ended", { track });
    });

    howl.on("seek", () => {
      this.emit("seeked", { position: this.safeSeek() });
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

  seek(positionSeconds?: number): number {
    if (!this.howl) return 0;

    if (positionSeconds === undefined) {
      return this.safeSeek();
    }

    const clamped = Math.max(0, positionSeconds);
    this.howl.seek(clamped);
    return clamped;
  }

  setVolume(volume: number): void {
    this.volume = AudioEngine.clampVolume(volume);

    if (this.howl) {
      this.howl.volume(this.volume);
    }
  }

  getState(): AudioEngineState {
    return {
      status: this.status,
      currentTrack: this.currentTrack,
      position: this.safeSeek(),
      duration: this.howl ? this.howl.duration() : 0,
      volume: this.volume,
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
    return typeof position === "number" ? position : 0;
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
