import { PlayerController } from "@zydka/player-store";
import type { ITrack } from "@zydka/player-store";

export class WordPressBridge {
  static play(track: ITrack) {
    PlayerController.load(track);
    PlayerController.play();
  }

  static setQueue(tracks: ITrack[]) {
    PlayerController.setQueue(tracks);
  }

  static getQueue() {
    return PlayerController.getQueue();
  }

  static getCurrentIndex() {
    return PlayerController.getCurrentIndex();
  }

  static playAt(index: number) {
    return PlayerController.playAt(index);
  }

  static next() {
    return PlayerController.next();
  }

  static previous() {
    return PlayerController.previous();
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
