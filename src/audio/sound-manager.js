// @ts-check
// Feedback sonoro (ver specs/002-jogo-categorias-associacoes/research.md,
// Decisão 9). Módulo de apresentação puro: não conhece regras de jogo, só
// decide qual arquivo tocar e se o áudio está mudo.

export const MUTE_STORAGE_KEY = "paciencia_ss.audio.muted";

const KENNEY_BASE = "assets/kenney_casino-audio/Audio/";
const AMBIENT_MUSIC_FILE = "assets/musica_ambiente.ogg";
const AMBIENT_MUSIC_VOLUME = 0.25;

/** @typedef {"cardPlace"|"cardMove"|"categoryComplete"|"dealShuffle"|"gameOver"} SoundEvent */

/** @type {Record<SoundEvent, string[]>} */
const SOUND_FILES = {
  cardPlace: [`${KENNEY_BASE}card-place-1.ogg`, `${KENNEY_BASE}card-place-2.ogg`, `${KENNEY_BASE}card-place-3.ogg`, `${KENNEY_BASE}card-place-4.ogg`],
  cardMove: [
    `${KENNEY_BASE}card-slide-1.ogg`, `${KENNEY_BASE}card-slide-2.ogg`, `${KENNEY_BASE}card-slide-3.ogg`, `${KENNEY_BASE}card-slide-4.ogg`,
    `${KENNEY_BASE}card-slide-5.ogg`, `${KENNEY_BASE}card-slide-6.ogg`, `${KENNEY_BASE}card-slide-7.ogg`, `${KENNEY_BASE}card-slide-8.ogg`,
  ],
  categoryComplete: [`${KENNEY_BASE}cards-pack-open-1.ogg`, `${KENNEY_BASE}cards-pack-open-2.ogg`],
  dealShuffle: [`${KENNEY_BASE}card-shuffle.ogg`],
  gameOver: ["assets/gameover.mp3"],
};

/** @typedef {{ getItem(key: string): string|null, setItem(key: string, value: string): void }} StorageLike */
/** @typedef {{ volume: number, loop?: boolean, play: () => (Promise<void>|void), pause?: () => void }} AudioLike */

/**
 * @param {{ storage?: StorageLike, AudioCtor?: new (src?: string) => AudioLike, rng?: () => number }} [options]
 */
export function createSoundManager(options = {}) {
  const storage = options.storage ?? null;
  const AudioCtor = options.AudioCtor ?? (typeof Audio !== "undefined" ? Audio : null);
  const rng = options.rng ?? Math.random;

  let muted = storage?.getItem(MUTE_STORAGE_KEY) === "1";
  /** @type {AudioLike | null} */
  let ambientAudio = null;

  function tryPlay(audio) {
    try {
      const result = audio.play();
      if (result && typeof result.catch === "function") result.catch(() => {});
    } catch {
      // Ambiente sem suporte a Audio, ou autoplay bloqueado — silencioso.
    }
  }

  /** @param {boolean} value */
  function setMuted(value) {
    muted = value;
    storage?.setItem(MUTE_STORAGE_KEY, value ? "1" : "0");
    if (!ambientAudio) return;
    if (muted) {
      ambientAudio.pause?.();
    } else {
      tryPlay(ambientAudio);
    }
  }

  return {
    /** @param {SoundEvent} eventName */
    play(eventName) {
      if (muted || !AudioCtor) return;
      const files = SOUND_FILES[eventName];
      if (!files || files.length === 0) return;
      const file = files[Math.floor(rng() * files.length)];
      try {
        const audio = new AudioCtor(file);
        audio.volume = 0.5;
        tryPlay(audio);
      } catch {
        // Ambiente sem suporte a Audio, ou autoplay bloqueado — silencioso.
      }
    },

    /**
     * Inicia a música ambiente em loop (idempotente — chamadas repetidas
     * reusam a mesma instância). Navegadores bloqueiam autoplay com som
     * antes de um gesto do usuário: o chamador deve invocar de novo em
     * um handler de clique/toque caso a primeira tentativa seja recusada.
     */
    startAmbientMusic() {
      if (!AudioCtor) return;
      if (!ambientAudio) {
        try {
          ambientAudio = new AudioCtor(AMBIENT_MUSIC_FILE);
          ambientAudio.loop = true;
          ambientAudio.volume = AMBIENT_MUSIC_VOLUME;
        } catch {
          return;
        }
      }
      if (muted) return;
      tryPlay(ambientAudio);
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
