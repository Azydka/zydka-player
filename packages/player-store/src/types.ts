export interface ITrack {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string;
}

export interface IPlayerState {
  currentTrack: ITrack | null;
  isPlaying: boolean;

  setCurrentTrack: (track: ITrack | null) => void;
  play: () => void;
  pause: () => void;
}