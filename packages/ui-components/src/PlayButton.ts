import { PlayerController } from "@zydka/player-store";

export function PlayButton() {
  return {
    label: "Play",
    click: () => PlayerController.play(),
  };
}