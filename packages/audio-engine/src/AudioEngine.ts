export class AudioEngine {
  loadTrack(url: string): void {
    console.log("Loading:", url);
  }

  play(): void {
    console.log("Play");
  }

  pause(): void {
    console.log("Pause");
  }
}