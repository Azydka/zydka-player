import { usePlayerStore } from "@zydka/player-store";

const store = usePlayerStore.getState();

store.setCurrentTrack({
  id: 1,
  title: "Test",
  artist: "Zydka",
  audioUrl: "/test.mp3",
});

console.log("Before play:", usePlayerStore.getState());

store.play();

console.log("After play:", usePlayerStore.getState());
