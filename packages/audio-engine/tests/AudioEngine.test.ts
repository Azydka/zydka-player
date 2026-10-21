import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AudioEngine } from "../src/AudioEngine.ts";

interface FakeHowl {
  _sounds?: Array<{
    _node?: { currentTime: number };
    _seek?: number;
    _ended?: boolean;
  }>;
  duration: () => number;
  playing: () => boolean;
  seek: (seconds?: number) => number;
}

function attachHowl(engine: AudioEngine, howl: FakeHowl): void {
  (engine as unknown as { howl: FakeHowl }).howl = howl;
}

describe("AudioEngine.seek", () => {
  it("moves the active HTML5 media node without pausing and restarting it", () => {
    const engine = new AudioEngine();
    const node = { currentTime: 12 };
    const sound = { _node: node, _seek: 12, _ended: true };
    let howlerSeekCalls = 0;
    const positions: number[] = [];

    attachHowl(engine, {
      _sounds: [sound],
      duration: () => 180,
      playing: () => true,
      seek: (seconds?: number) => {
        if (typeof seconds === "number") howlerSeekCalls += 1;
        return node.currentTime;
      },
    });
    engine.on("seeked", ({ position }) => positions.push(position));

    assert.equal(engine.seek(75), 75);
    assert.equal(node.currentTime, 75);
    assert.equal(sound._seek, 75);
    assert.equal(sound._ended, false);
    assert.equal(howlerSeekCalls, 0);
    assert.deepEqual(positions, [75]);
  });

  it("leaves a paused media node in place and lets Howler apply the target on play", () => {
    const engine = new AudioEngine();
    const node = { currentTime: 12 };
    const sound = { _node: node, _seek: 12, _ended: false };
    let isPlaying = false;
    let howlerSeekCalls = 0;

    attachHowl(engine, {
      _sounds: [sound],
      duration: () => 180,
      playing: () => isPlaying,
      seek: (seconds?: number) => {
        if (typeof seconds === "number") howlerSeekCalls += 1;
        return node.currentTime;
      },
    });

    assert.equal(engine.seek(90), 90);
    // Moving a paused node would make Howler wait for 'canplaythrough' before playing.
    assert.equal(node.currentTime, 12);
    assert.equal(sound._seek, 90);
    assert.equal(howlerSeekCalls, 0);
    assert.equal(engine.getCurrentTime(), 90);

    // Howler's play() moves the node to _seek right before node.play().
    node.currentTime = sound._seek;
    isPlaying = true;
    node.currentTime = 91;
    assert.equal(engine.getCurrentTime(), 91);
  });

  it("falls back to Howler when no HTML5 media node is available", () => {
    const engine = new AudioEngine();
    let position = 10;
    let howlerSeekCalls = 0;

    attachHowl(engine, {
      duration: () => 120,
      playing: () => false,
      seek: (seconds?: number) => {
        if (typeof seconds === "number") {
          howlerSeekCalls += 1;
          position = seconds;
        }

        return position;
      },
    });

    assert.equal(engine.seek(45), 45);
    assert.equal(position, 45);
    assert.equal(howlerSeekCalls, 1);
  });
});
