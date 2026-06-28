import { PlayerController } from "@zydka/player-store";
import type { ITrack } from "@zydka/player-store";

export function TrackCard(track: ITrack) {
  return {
    track,
    play: () => PlayerController.load(track),
  };
}