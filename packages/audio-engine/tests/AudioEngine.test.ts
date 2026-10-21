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

  it("falls back to Howler when no HTML5 media node is available", () => {
    const engine = new AudioEngine();
    let position = 10;
    let howlerSeekCalls = 0;

    attachHowl(engine, {
      duration: () => 120,
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
