import { PlayerController } from "@zydka/player-store";
import type { ITrack } from "@zydka/player-store";

export class WordPressBridge {
  static play(track: ITrack) {
    PlayerController.load(track);
    PlayerController.play();
  }

  static pause() {
    PlayerController.pause();
  }

  static seek(seconds: number) {
    return PlayerController.seek(seconds);
  }

  static getCurrentTime() {
    return PlayerController.getCurrentTime();
  }

  static getDuration() {
    return PlayerController.getDuration();
  }

  static state() {
    return PlayerController.state();
  }
}
