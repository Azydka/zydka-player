import { PlayerController } from "@zydka/player-store";

export function PauseButton() {
  return {
    label: "Pause",
    click: () => PlayerController.pause(),
  };
}