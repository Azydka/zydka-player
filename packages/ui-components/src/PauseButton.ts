export interface PauseButtonProps {
  label?: string;
}

export function PauseButton(
  props: PauseButtonProps = {},
): string {
  return props.label ?? "Pause";
}