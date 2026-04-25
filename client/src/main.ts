import "./style.css";

interface SongSection {
  id: string;
  name: string;
  chords: string[];
}

interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  sections: SongSection[];
}

interface NewSongPayload {
  title: string;
  artist: string;
  key: string;
  sections: SongSection[];
}

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const FLAT_TO_SHARP: Record<string, string> = {
  Cb: "B",
  Db: "C#",
  Eb: "D#",
  Fb: "E",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#"
};

const SPECIAL_EQUIVALENTS: Record<string, string> = {
  "E#": "F",
  "B#": "C"
};

const NASHVILLE_DEGREE_MAP = ["1", "b2", "2", "b3", "3", "4", "#4", "5", "b6", "6", "b7", "7"];
const API_BASE_URL = "http://localhost:4000";
const DEFAULT_SECTIONS_JSON = JSON.stringify(
  [
    { name: "Intro", chords: ["C", "G", "Am", "F"] },
    { name: "Verse", chords: ["C", "Em", "F", "G"] }
  ],
  null,
  2
);

let songs: Song[] = [];
let currentSongIndex = 0;
let selectedKey = "C";
let useNumberNotation = false;
let isAddSongModalOpen = false;
let addSongError: string | null = null;
let addSongFormState = {
  title: "",
  artist: "",
  key: "C",
  sectionsJson: DEFAULT_SECTIONS_JSON
};

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App container was not found.");
}

const normalizeNote = (note: string): string => {
  return FLAT_TO_SHARP[note] ?? SPECIAL_EQUIVALENTS[note] ?? note;
};

const getSemitoneShift = (fromKey: string, toKey: string): number => {
  const fromIndex = NOTES.indexOf(normalizeNote(fromKey));
  const toIndex = NOTES.indexOf(normalizeNote(toKey));

  if (fromIndex < 0 || toIndex < 0) {
    return 0;
  }

  return (toIndex - fromIndex + 12) % 12;
};

const transposeChordPart = (part: string, semitones: number): string => {
  const match = part.match(/^([A-G](?:#|b)?)(.*)$/);

  if (!match) {
    return part;
  }

  const root = normalizeNote(match[1]);
  const suffix = match[2];
  const rootIndex = NOTES.indexOf(root);

  if (rootIndex < 0) {
    return part;
  }

  const targetIndex = (rootIndex + semitones + 12) % 12;
  return `${NOTES[targetIndex]}${suffix}`;
};

const transposeChord = (chord: string, semitones: number): string => {
  const cleanChord = chord.trim();

  // Skip number notation such as 1, 5, 6m, 4/5.
  if (/^\d/.test(cleanChord)) {
    return chord;
  }

  const slashSplit = cleanChord.split("/");

  if (slashSplit.length === 1) {
    return transposeChordPart(cleanChord, semitones);
  }

  return slashSplit.map((part) => transposeChordPart(part, semitones)).join("/");
};

const isValidNoteKey = (key: string): boolean => NOTES.includes(normalizeNote(key));

const toNashvilleChordPart = (part: string, referenceKey: string): string => {
  const match = part.match(/^([A-G](?:#|b)?)(.*)$/);

  if (!match) {
    return part;
  }

  const root = normalizeNote(match[1]);
  const suffix = match[2];
  const rootIndex = NOTES.indexOf(root);
  const keyIndex = NOTES.indexOf(normalizeNote(referenceKey));

  if (rootIndex < 0 || keyIndex < 0) {
    return part;
  }

  const interval = (rootIndex - keyIndex + 12) % 12;
  const degree = NASHVILLE_DEGREE_MAP[interval];

  return `${degree}${suffix}`;
};

const toNashvilleChord = (chord: string, referenceKey: string): string => {
  const cleanChord = chord.trim();

  if (/^\d/.test(cleanChord)) {
    return chord;
  }

  const slashSplit = cleanChord.split("/");

  if (slashSplit.length === 1) {
    return toNashvilleChordPart(cleanChord, referenceKey);
  }

  return slashSplit.map((part) => toNashvilleChordPart(part, referenceKey)).join("/");
};

const transposeSong = (song: Song, targetKey: string): Song => {
  const semitoneShift = getSemitoneShift(song.key, targetKey);

  return {
    ...song,
    sections: song.sections.map((section) => ({
      ...section,
      chords: section.chords.map((chord) => transposeChord(chord, semitoneShift))
    }))
  };
};

const convertSongToNashville = (song: Song, referenceKey: string): Song => {
  return {
    ...song,
    sections: song.sections.map((section) => ({
      ...section,
      chords: section.chords.map((chord) => toNashvilleChord(chord, referenceKey))
    }))
  };
};

const fetchSongs = async (): Promise<Song[]> => {
  const response = await fetch(`${API_BASE_URL}/api/songs`);

  if (!response.ok) {
    throw new Error(`Failed to load songs: ${response.status}`);
  }

  return (await response.json()) as Song[];
};

const createSong = async (payload: NewSongPayload): Promise<Song[]> => {
  const response = await fetch(`${API_BASE_URL}/api/songs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(errorBody?.message ?? "Failed to add song.");
  }

  return (await response.json()) as Song[];
};

const selectSong = (index: number): void => {
  currentSongIndex = index;
  const active = songs[currentSongIndex];
  selectedKey = isValidNoteKey(active.key) ? normalizeNote(active.key) : "C";
};

const openAddSongModal = (): void => {
  addSongError = null;
  addSongFormState = {
    title: "",
    artist: "",
    key: "C",
    sectionsJson: DEFAULT_SECTIONS_JSON
  };
  isAddSongModalOpen = true;
};

const closeAddSongModal = (): void => {
  isAddSongModalOpen = false;
  addSongError = null;
};

const parseSectionsJson = (jsonText: string): SongSection[] => {
  const parsed = JSON.parse(jsonText) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Sections must be a JSON array.");
  }

  const sections = parsed
    .map((entry, index) => {
      const candidate = entry as { name?: unknown; chords?: unknown };
      if (typeof candidate.name !== "string" || !Array.isArray(candidate.chords)) {
        throw new Error(`Section at index ${index} must include name and chords array.`);
      }

      const chords = candidate.chords.map((value) => String(value).trim()).filter((value) => value.length > 0);

      if (chords.length === 0) {
        throw new Error(`Section \"${candidate.name}\" must contain at least one chord.`);
      }

      return {
        id: `sec-${Date.now()}-${index + 1}`,
        name: candidate.name.trim(),
        chords
      } satisfies SongSection;
    })
    .filter((section) => section.name.length > 0);

  if (sections.length === 0) {
    throw new Error("At least one valid section is required.");
  }

  return sections;
};

const chunkChords = (chords: string[], rowSize = 4): string[][] => {
  const rows: string[][] = [];

  for (let i = 0; i < chords.length; i += rowSize) {
    rows.push(chords.slice(i, i + rowSize));
  }

  return rows;
};

const renderChordRows = (chords: string[]): string => {
  const rows = chunkChords(chords, 4);

  return rows
    .map(
      (row) => `
        <div class="flex flex-wrap items-baseline gap-x-10 gap-y-2 font-mono tracking-widest text-lg md:text-xl text-white">
          ${row.map((chord) => `<span>${chord}</span>`).join("")}
        </div>
      `
    )
    .join("");
};

const render = (): void => {
  if (songs.length === 0) {
    app.innerHTML = `<div class="flex h-screen w-screen items-center justify-center p-6"><div class="w-full max-w-3xl rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-300">Loading songs...</div></div>`;
    return;
  }

  const originalSong = songs[currentSongIndex];
  const transposedSong = transposeSong(originalSong, selectedKey);
  const displayedSong = useNumberNotation ? convertSongToNashville(transposedSong, selectedKey) : transposedSong;
  const notationLabel = useNumberNotation ? "Nashville Number" : "Chord";

  app.innerHTML = `
    <main class="h-screen w-screen overflow-hidden p-3 md:p-4">
      <div class="grid h-full grid-cols-1 gap-3 lg:grid-cols-[18rem_minmax(0,1fr)] animate-fade-in">
        <aside class="grid h-full grid-rows-[auto_auto_1fr] gap-3 overflow-hidden">
          <section class="rounded-2xl border border-neutral-800 bg-black p-3">
            <p class="text-[10px] uppercase tracking-[0.18em] text-neutral-400">Transpose Key</p>
            <div class="mt-2 grid grid-cols-6 gap-1">
              ${NOTES.map(
                (note) => `
                  <button
                    type="button"
                    data-key="${note}"
                    class="rounded-md border px-1 py-1 text-[11px] font-semibold transition ${
                      note === selectedKey
                        ? "border-white bg-white text-black"
                        : "border-neutral-700 bg-neutral-900 text-white hover:bg-white hover:text-black"
                    }"
                  >
                    ${note}
                  </button>
                `
              ).join("")}
            </div>

            <label for="number-notation-toggle" class="mt-2 flex cursor-pointer items-center justify-between rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5">
              <span class="text-xs text-neutral-200">Use Number Notation</span>
              <input id="number-notation-toggle" type="checkbox" class="h-3.5 w-3.5 accent-white" ${useNumberNotation ? "checked" : ""} />
            </label>

            <div class="mt-2 grid grid-cols-2 gap-2">
              <button id="next-song" class="rounded-md border border-neutral-700 bg-black px-2 py-1.5 text-xs font-medium text-white transition hover:bg-white hover:text-black">
                Next Song
              </button>
              <button id="open-add-song" class="rounded-md border border-neutral-700 bg-black px-2 py-1.5 text-xs font-medium text-white transition hover:bg-white hover:text-black">
                Add Song
              </button>
            </div>
          </section>

          <section class="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
            <p class="text-[10px] uppercase tracking-[0.18em] text-neutral-400">Now Showing</p>
            <h1 class="mt-1 truncate text-lg font-semibold text-white">${displayedSong.title}</h1>
            <p class="truncate text-xs text-neutral-400">${displayedSong.artist}</p>
            <div class="mt-2 inline-flex items-center gap-2 rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300">
              <span>Orig Key:</span>
              <span class="font-medium text-white">${originalSong.key}</span>
            </div>
          </section>

          <section class="rounded-2xl border border-neutral-800 bg-neutral-900 p-3 overflow-hidden">
            <p class="text-[10px] uppercase tracking-[0.18em] text-neutral-400">Song Library</p>
            <div class="mt-2 space-y-1 overflow-hidden">
              ${songs
                .map(
                  (song, index) => `
                    <button
                      type="button"
                      data-song-index="${index}"
                      class="w-full rounded-md border px-2 py-1.5 text-left text-xs transition ${
                        index === currentSongIndex
                          ? "border-white bg-white text-black"
                          : "border-neutral-700 bg-black text-white hover:bg-white hover:text-black"
                      }"
                    >
                      <p class="truncate font-semibold">${song.title}</p>
                      <p class="truncate text-[10px] ${index === currentSongIndex ? "text-neutral-700" : "text-neutral-400"}">${song.artist}</p>
                    </button>
                  `
                )
                .join("")}
            </div>
          </section>
        </aside>

        <section class="h-full rounded-2xl border border-neutral-800 bg-neutral-900 p-4 md:p-6 overflow-hidden">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-xs uppercase tracking-[0.18em] text-neutral-400">Sections</p>
            <span class="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300">${notationLabel}</span>
          </div>

          <div class="grid h-[calc(100%-2.2rem)] grid-cols-2 gap-4 xl:grid-cols-3 content-start overflow-hidden">
            ${displayedSong.sections
              .map(
                (section) => `
                  <article class="rounded-xl border border-neutral-800 bg-black/20 p-3">
                    <h2 class="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">${section.name}</h2>
                    <div class="space-y-3">
                      ${renderChordRows(section.chords)}
                    </div>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      </div>

      ${
        isAddSongModalOpen
          ? `
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div class="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6 md:p-8">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="text-xl font-semibold text-white">Add Song</h2>
                <button id="close-add-song" class="rounded-md border border-neutral-700 px-3 py-1 text-sm text-white transition hover:bg-white hover:text-black">Close</button>
              </div>

              <form id="add-song-form" class="space-y-4">
                <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input id="song-title" type="text" placeholder="Title" value="${addSongFormState.title.replace(/"/g, "&quot;")}" class="rounded-md border border-neutral-700 bg-black px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white" required />
                  <input id="song-artist" type="text" placeholder="Artist" value="${addSongFormState.artist.replace(/"/g, "&quot;")}" class="rounded-md border border-neutral-700 bg-black px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white" required />
                </div>

                <div>
                  <label for="song-key" class="mb-2 block text-xs uppercase tracking-[0.14em] text-neutral-400">Original Key</label>
                  <select id="song-key" class="w-full rounded-md border border-neutral-700 bg-black px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white">
                    ${NOTES.map((note) => `<option value="${note}" ${addSongFormState.key === note ? "selected" : ""}>${note}</option>`).join("")}
                  </select>
                </div>

                <div>
                  <label for="song-sections-json" class="mb-2 block text-xs uppercase tracking-[0.14em] text-neutral-400">Sections JSON</label>
                  <textarea id="song-sections-json" rows="10" class="w-full rounded-md border border-neutral-700 bg-black px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white">${addSongFormState.sectionsJson}</textarea>
                </div>

                ${addSongError ? `<p class="rounded-md border border-neutral-700 bg-black p-3 text-sm text-neutral-200">${addSongError}</p>` : ""}

                <button type="submit" class="w-full rounded-md border border-neutral-700 bg-black px-3 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black">
                  Save Song
                </button>
              </form>
            </div>
          </div>
          `
          : ""
      }
    </main>
  `;

  const keyButtons = document.querySelectorAll<HTMLButtonElement>("[data-key]");
  const nextSongButton = document.querySelector<HTMLButtonElement>("#next-song");
  const numberNotationToggle = document.querySelector<HTMLInputElement>("#number-notation-toggle");
  const songButtons = document.querySelectorAll<HTMLButtonElement>("[data-song-index]");
  const openAddSongButton = document.querySelector<HTMLButtonElement>("#open-add-song");
  const closeAddSongButton = document.querySelector<HTMLButtonElement>("#close-add-song");
  const addSongForm = document.querySelector<HTMLFormElement>("#add-song-form");
  const songTitleInput = document.querySelector<HTMLInputElement>("#song-title");
  const songArtistInput = document.querySelector<HTMLInputElement>("#song-artist");
  const songKeyInput = document.querySelector<HTMLSelectElement>("#song-key");
  const songSectionsJsonInput = document.querySelector<HTMLTextAreaElement>("#song-sections-json");

  keyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedKey = button.dataset.key ?? selectedKey;
      render();
    });
  });

  if (nextSongButton) {
    nextSongButton.addEventListener("click", () => {
      selectSong((currentSongIndex + 1) % songs.length);
      render();
    });
  }

  if (numberNotationToggle) {
    numberNotationToggle.addEventListener("change", () => {
      useNumberNotation = numberNotationToggle.checked;
      render();
    });
  }

  songButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetIndex = Number(button.dataset.songIndex);

      if (Number.isNaN(targetIndex)) {
        return;
      }

      selectSong(targetIndex);
      render();
    });
  });

  if (openAddSongButton) {
    openAddSongButton.addEventListener("click", () => {
      openAddSongModal();
      render();
    });
  }

  if (closeAddSongButton) {
    closeAddSongButton.addEventListener("click", () => {
      closeAddSongModal();
      render();
    });
  }

  if (songTitleInput) {
    songTitleInput.addEventListener("input", () => {
      addSongFormState.title = songTitleInput.value;
    });
  }

  if (songArtistInput) {
    songArtistInput.addEventListener("input", () => {
      addSongFormState.artist = songArtistInput.value;
    });
  }

  if (songKeyInput) {
    songKeyInput.addEventListener("change", () => {
      addSongFormState.key = songKeyInput.value;
    });
  }

  if (songSectionsJsonInput) {
    songSectionsJsonInput.addEventListener("input", () => {
      addSongFormState.sectionsJson = songSectionsJsonInput.value;
    });
  }

  if (addSongForm) {
    addSongForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      addSongError = null;

      try {
        const parsedSections = parseSectionsJson(addSongFormState.sectionsJson);
        const updatedSongs = await createSong({
          title: addSongFormState.title.trim(),
          artist: addSongFormState.artist.trim(),
          key: addSongFormState.key,
          sections: parsedSections
        });

        songs = updatedSongs;
        selectSong(songs.length - 1);
        closeAddSongModal();
      } catch (error) {
        addSongError = error instanceof Error ? error.message : "Unable to add song.";
      }

      render();
    });
  }
};

const bootstrap = async (): Promise<void> => {
  try {
    songs = await fetchSongs();

    if (songs.length === 0) {
      throw new Error("Song list is empty.");
    }

    const initialSong = songs[currentSongIndex];
    selectedKey = isValidNoteKey(initialSong.key) ? normalizeNote(initialSong.key) : "C";
    render();
  } catch (error) {
    app.innerHTML = `
      <div class="mx-auto mt-20 w-full max-w-3xl rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-300">
        Unable to load songs from API. Make sure the backend is running on port 4000.
      </div>
    `;
    console.error(error);
  }
};

void bootstrap();
