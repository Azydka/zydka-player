export interface PlayButtonProps {
  label?: string;
}

export function PlayButton(
  props: PlayButtonProps = {},
): string {
  return props.label ?? "Play";
}