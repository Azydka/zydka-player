export interface TrackCardProps {
  title: string;
  artist?: string;
}

export function TrackCard(
  props: TrackCardProps,
): string {
  return `${props.title} - ${props.artist ?? "Unknown Artist"}`;
}