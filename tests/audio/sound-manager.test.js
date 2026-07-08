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

function createFakeAudioCtor(calls, instances = []) {
  return class FakeAudio {
    constructor(src) {
      this.src = src;
      this.volume = 1;
      this.loop = false;
      this.playCount = 0;
      this.pauseCount = 0;
      calls.push(src);
      instances.push(this);
    }
    play() {
      this.playCount += 1;
      return Promise.resolve();
    }
    pause() {
      this.pauseCount += 1;
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

test("play('gameOver'): toca o arquivo de game over", () => {
  const calls = [];
  const sound = createSoundManager({
    storage: createFakeStorage(),
    AudioCtor: createFakeAudioCtor(calls),
  });

  sound.play("gameOver");

  assert.equal(calls.length, 1);
  assert.match(calls[0], /gameover\.mp3$/);
});

test("startAmbientMusic(): cria a faixa em loop e toca", () => {
  const calls = [];
  const instances = [];
  const sound = createSoundManager({
    storage: createFakeStorage(),
    AudioCtor: createFakeAudioCtor(calls, instances),
  });

  sound.startAmbientMusic();

  assert.equal(calls.length, 1);
  assert.match(calls[0], /musica_ambiente\.ogg$/);
  assert.equal(instances[0].loop, true);
  assert.equal(instances[0].playCount, 1);
});

test("startAmbientMusic(): chamadas repetidas reusam a mesma instância (idempotente)", () => {
  const calls = [];
  const instances = [];
  const sound = createSoundManager({
    storage: createFakeStorage(),
    AudioCtor: createFakeAudioCtor(calls, instances),
  });

  sound.startAmbientMusic();
  sound.startAmbientMusic();

  assert.equal(calls.length, 1, "não deve criar uma segunda instância de Audio");
  assert.equal(instances[0].playCount, 2);
});

test("startAmbientMusic(): não toca se já estiver mudo, mas fica pronta pra tocar ao desmutar", () => {
  const calls = [];
  const instances = [];
  const sound = createSoundManager({
    storage: createFakeStorage({ [MUTE_STORAGE_KEY]: "1" }),
    AudioCtor: createFakeAudioCtor(calls, instances),
  });

  sound.startAmbientMusic();
  assert.equal(instances[0].playCount, 0);

  sound.toggleMuted();
  assert.equal(instances[0].playCount, 1, "desmutar deve retomar a música ambiente já criada");
});

test("toggleMuted() para ligado pausa a música ambiente em andamento", () => {
  const calls = [];
  const instances = [];
  const sound = createSoundManager({
    storage: createFakeStorage(),
    AudioCtor: createFakeAudioCtor(calls, instances),
  });

  sound.startAmbientMusic();
  sound.toggleMuted();

  assert.equal(instances[0].pauseCount, 1);
});
