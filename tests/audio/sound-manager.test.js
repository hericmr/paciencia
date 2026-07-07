// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { createSoundManager, MUTE_STORAGE_KEY } from "../../src/audio/sound-manager.js";

function createFakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
  };
}

function createFakeAudioCtor(calls) {
  return class FakeAudio {
    constructor(src) {
      this.src = src;
      this.volume = 1;
      calls.push(src);
    }
    play() {
      return Promise.resolve();
    }
  };
}

test("play(): não toca nada quando mudo", () => {
  const calls = [];
  const sound = createSoundManager({
    storage: createFakeStorage({ [MUTE_STORAGE_KEY]: "1" }),
    AudioCtor: createFakeAudioCtor(calls),
    rng: () => 0,
  });

  sound.play("cardPlace");

  assert.equal(calls.length, 0);
});

test("play(): escolhe a variante do evento conforme o rng injetado", () => {
  const calls = [];
  const sound = createSoundManager({
    storage: createFakeStorage(),
    AudioCtor: createFakeAudioCtor(calls),
    rng: () => 0.99,
  });

  sound.play("cardPlace");

  assert.equal(calls.length, 1);
  assert.match(calls[0], /card-place-4\.ogg$/);
});

test("play(): ignora evento desconhecido sem lançar", () => {
  const calls = [];
  const sound = createSoundManager({
    storage: createFakeStorage(),
    AudioCtor: createFakeAudioCtor(calls),
  });

  assert.doesNotThrow(() => sound.play(/** @type {any} */ ("evento-inexistente")));
  assert.equal(calls.length, 0);
});

test("toggleMuted(): alterna e persiste no storage injetado", () => {
  const storage = createFakeStorage();
  const sound = createSoundManager({ storage });

  assert.equal(sound.isMuted(), false);

  const afterToggle = sound.toggleMuted();

  assert.equal(afterToggle, true);
  assert.equal(sound.isMuted(), true);
  assert.equal(storage.getItem(MUTE_STORAGE_KEY), "1");

  sound.toggleMuted();
  assert.equal(sound.isMuted(), false);
  assert.equal(storage.getItem(MUTE_STORAGE_KEY), "0");
});

test("estado inicial de mudo é lido do storage", () => {
  const sound = createSoundManager({ storage: createFakeStorage({ [MUTE_STORAGE_KEY]: "1" }) });
  assert.equal(sound.isMuted(), true);
});
