// @ts-check
// Feedback sonoro (ver specs/002-jogo-categorias-associacoes/research.md,
// Decisão 9). Módulo de apresentação puro: não conhece regras de jogo, só
// decide qual arquivo tocar e se o áudio está mudo.

export const MUTE_STORAGE_KEY = "paciencia_ss.audio.muted";

const BASE_PATH = "assets/kenney_casino-audio/Audio/";

/** @typedef {"cardPlace"|"cardMove"|"categoryComplete"|"dealShuffle"} SoundEvent */

/** @type {Record<SoundEvent, string[]>} */
const SOUND_FILES = {
  cardPlace: ["card-place-1.ogg", "card-place-2.ogg", "card-place-3.ogg", "card-place-4.ogg"],
  cardMove: [
    "card-slide-1.ogg", "card-slide-2.ogg", "card-slide-3.ogg", "card-slide-4.ogg",
    "card-slide-5.ogg", "card-slide-6.ogg", "card-slide-7.ogg", "card-slide-8.ogg",
  ],
  categoryComplete: ["cards-pack-open-1.ogg", "cards-pack-open-2.ogg"],
  dealShuffle: ["card-shuffle.ogg"],
};

/** @typedef {{ getItem(key: string): string|null, setItem(key: string, value: string): void }} StorageLike */

/**
 * @param {{ storage?: StorageLike, AudioCtor?: new (src?: string) => { volume: number, play: () => (Promise<void>|void) }, rng?: () => number }} [options]
 */
export function createSoundManager(options = {}) {
  const storage = options.storage ?? null;
  const AudioCtor = options.AudioCtor ?? (typeof Audio !== "undefined" ? Audio : null);
  const rng = options.rng ?? Math.random;

  let muted = storage?.getItem(MUTE_STORAGE_KEY) === "1";

  /** @param {boolean} value */
  function setMuted(value) {
    muted = value;
    storage?.setItem(MUTE_STORAGE_KEY, value ? "1" : "0");
  }

  return {
    /** @param {SoundEvent} eventName */
    play(eventName) {
      if (muted || !AudioCtor) return;
      const files = SOUND_FILES[eventName];
      if (!files || files.length === 0) return;
      const file = files[Math.floor(rng() * files.length)];
      try {
        const audio = new AudioCtor(`${BASE_PATH}${file}`);
        audio.volume = 0.5;
        const result = audio.play();
        if (result && typeof result.catch === "function") result.catch(() => {});
      } catch {
        // Ambiente sem suporte a Audio, ou autoplay bloqueado — silencioso.
      }
    },

    isMuted() {
      return muted;
    },

    setMuted,

    toggleMuted() {
      setMuted(!muted);
      return muted;
    },
  };
}
