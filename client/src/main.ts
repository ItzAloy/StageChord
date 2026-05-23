import "./style.css";

import {
  createSong,
  createSetlist,
  deleteSong,
  fetchSetlists,
  fetchSongs,
  updateSetlist,
  updateSong
} from "./api";
import { isValidNoteKey } from "./chords";
import { renderApp, renderSongLibraryResults } from "./render";
import {
  NOTES,
  createEmptySetlistForm,
  createEmptySongForm
} from "./types";
import type { AppState, Setlist, Song, SongSection } from "./types";
import {
  addGroupToSetlist,
  createNewSetlist,
  createSongFormFromSong,
  addSongToPlaylist,
  getPlaylistSongIds,
  getSelectedSetlist,
  removeSongFromAllSetlists,
  moveSongInPlaylist,
  removeSongFromPlaylist,
  selectGroup,
  selectSong,
  selectSetlist,
  syncSelection
} from "./state";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App container was not found.");
}

const state: AppState = {
  songs: [],
  setlists: [],
  selectedSongId: null,
  selectedSetlistId: null,
  selectedGroupId: null,
  currentSongIndex: 0,
  selectedKey: "C",
  searchQuery: "",
  sidebarCollapsed: false,
  presentationTheme: "dark",
  presentationMode: true,
  useNumberNotation: false,
  songModalMode: null,
  songForm: createEmptySongForm(),
  setlistModalOpen: false,
  setlistForm: createEmptySetlistForm(),
  groupModalOpen: false,
  groupName: "",
  statusMessage: null
};

let statusTimer: number | undefined;

const render = (): void => {
  app.innerHTML = renderApp(state);
};

const refreshSongLibraryResults = (): void => {
  const dropdown = app.querySelector<HTMLElement>("[data-song-library-dropdown]");
  const resultsContainer = app.querySelector<HTMLElement>("[data-song-library-results]");

  if (!dropdown || !resultsContainer) {
    return;
  }

  const search = state.searchQuery.trim();

  if (!search.length) {
    dropdown.classList.add("hidden");
    resultsContainer.innerHTML = "";
    return;
  }

  dropdown.classList.remove("hidden");
  resultsContainer.innerHTML = renderSongLibraryResults(state, getSelectedSetlist(state));
};

const setStatus = (message: string): void => {
  state.statusMessage = message;
  render();

  if (statusTimer) {
    window.clearTimeout(statusTimer);
  }

  statusTimer = window.setTimeout(() => {
    state.statusMessage = null;
    render();
  }, 2800);
};

const refreshSongs = async (): Promise<void> => {
  state.songs = await fetchSongs();
  syncSelection(state);
};

const refreshSetlists = async (): Promise<void> => {
  state.setlists = await fetchSetlists();
  syncSelection(state);
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
        throw new Error(`Section at index ${index} must include a name and chords array.`);
      }

      const chords = candidate.chords
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0);

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

const serializeSetlist = (setlist: Setlist): Omit<Setlist, "id"> => ({
  title: setlist.title,
  gigDate: setlist.gigDate,
  notes: setlist.notes,
  groups: setlist.groups
});

const persistActiveSetlist = async (nextSetlist: Setlist): Promise<void> => {
  state.setlists = await updateSetlist(nextSetlist.id, serializeSetlist(nextSetlist));
  state.selectedSetlistId = nextSetlist.id;
  syncSelection(state);
};

const getActivePlaylistSongIds = (): string[] => {
  const activeSetlist = getSelectedSetlist(state);

  if (!activeSetlist) {
    return [];
  }

  return getPlaylistSongIds(activeSetlist);
};

const goToPlaylistSong = (nextIndex: number): void => {
  const activeSetlist = getSelectedSetlist(state);

  if (!activeSetlist) {
    return;
  }

  const songIds = getPlaylistSongIds(activeSetlist);

  if (songIds.length === 0) {
    state.currentSongIndex = 0;
    state.selectedSongId = null;
    render();
    return;
  }

  const clampedIndex = Math.max(0, Math.min(nextIndex, songIds.length - 1));
  const nextSongId = songIds[clampedIndex] ?? null;

  state.currentSongIndex = clampedIndex;
  state.selectedSongId = nextSongId;

  const nextSong = nextSongId ? state.songs.find((song) => song.id === nextSongId) : null;

  if (nextSong) {
    state.selectedKey = nextSong.key;
  }

  render();
};

const goToNextPlaylistSong = (): void => {
  const songIds = getActivePlaylistSongIds();

  if (songIds.length === 0) {
    return;
  }

  goToPlaylistSong(state.currentSongIndex + 1);
};

const goToPreviousPlaylistSong = (): void => {
  const songIds = getActivePlaylistSongIds();

  if (songIds.length === 0) {
    return;
  }

  goToPlaylistSong(state.currentSongIndex - 1);
};

const createOrUpdateSong = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();

  const titleInput = event.currentTarget instanceof HTMLFormElement ? event.currentTarget.elements.namedItem("title") : null;
  const artistInput = event.currentTarget instanceof HTMLFormElement ? event.currentTarget.elements.namedItem("artist") : null;
  const keyInput = event.currentTarget instanceof HTMLFormElement ? event.currentTarget.elements.namedItem("key") : null;
  const sectionsInput = event.currentTarget instanceof HTMLFormElement ? event.currentTarget.elements.namedItem("sectionsJson") : null;

  if (!(titleInput instanceof HTMLInputElement) || !(artistInput instanceof HTMLInputElement) || !(keyInput instanceof HTMLSelectElement) || !(sectionsInput instanceof HTMLTextAreaElement)) {
    return;
  }

  const songPayload = {
    title: titleInput.value.trim(),
    artist: artistInput.value.trim(),
    key: keyInput.value.trim(),
    sections: parseSectionsJson(sectionsInput.value)
  } satisfies Omit<Song, "id">;

  if (state.songModalMode === "edit" && state.selectedSongId) {
    const response = await updateSong(state.selectedSongId, songPayload);
    state.songs = response.songs;
    selectSong(state, response.song.id);
    state.selectedKey = response.song.key;
    state.songModalMode = null;
    setStatus("Song updated.");
    render();
    return;
  }

  const response = await createSong(songPayload);
  state.songs = response.songs;
  selectSong(state, response.song.id);
  state.selectedKey = response.song.key;
  state.songModalMode = null;
  setStatus("Song created.");
  render();
};

const createSetlistFromForm = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();

  const form = event.currentTarget;

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  const titleInput = form.elements.namedItem("title");
  const dateInput = form.elements.namedItem("gigDate");
  const notesInput = form.elements.namedItem("notes");

  if (!(titleInput instanceof HTMLInputElement) || !(dateInput instanceof HTMLInputElement) || !(notesInput instanceof HTMLInputElement)) {
    return;
  }

  const created = createNewSetlist(titleInput.value, dateInput.value, notesInput.value);
  const response = await createSetlist(serializeSetlist(created));
  state.setlists = response;
  const createdSetlist = response.at(-1) ?? null;

  if (createdSetlist) {
    state.selectedSetlistId = createdSetlist.id;
    state.selectedGroupId = createdSetlist.groups[0]?.id ?? null;
  }

  state.setlistModalOpen = false;
  state.setlistForm = createEmptySetlistForm();
  syncSelection(state);
  setStatus("Setlist created.");
  render();
};

const createGroupFromForm = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();

  const form = event.currentTarget;

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  const groupNameInput = form.elements.namedItem("groupName");

  if (!(groupNameInput instanceof HTMLInputElement)) {
    return;
  }

  const activeSetlist = getSelectedSetlist(state);

  if (!activeSetlist) {
    setStatus("Create a setlist first.");
    return;
  }

  const nextSetlist = addGroupToSetlist(activeSetlist, groupNameInput.value);
  await persistActiveSetlist(nextSetlist);
  state.groupModalOpen = false;
  state.groupName = "";
  setStatus("Group added.");
  render();
};

const openSongModal = (mode: "create" | "edit", songId?: string): void => {
  if (mode === "edit") {
    const song = state.songs.find((entry) => entry.id === songId);

    if (!song) {
      return;
    }

    state.selectedSongId = song.id;
    state.selectedKey = song.key;
    state.songForm = createSongFormFromSong(song);
  } else {
    state.songForm = createEmptySongForm();
  }

  state.songModalMode = mode;
  render();
};

const closeSongModal = (): void => {
  state.songModalMode = null;
  render();
};

const openSetlistModal = (): void => {
  state.setlistForm = createEmptySetlistForm();
  state.setlistModalOpen = true;
  render();
};

const closeSetlistModal = (): void => {
  state.setlistModalOpen = false;
  render();
};

const openGroupModal = (): void => {
  state.groupName = "";
  state.groupModalOpen = true;
  render();
};

const closeGroupModal = (): void => {
  state.groupModalOpen = false;
  render();
};

const addSongToActivePlaylist = async (songId: string): Promise<void> => {
  const activeSetlist = getSelectedSetlist(state);

  if (!activeSetlist) {
    setStatus("Create a playlist first.");
    return;
  }

  const nextSetlist = addSongToPlaylist(activeSetlist, songId);
  await persistActiveSetlist(nextSetlist);
  state.searchQuery = "";
  state.currentSongIndex = Math.max(0, getPlaylistSongIds(nextSetlist).length - 1);
  setStatus("Song added to playlist.");
  render();
};

const moveSong = async (songId: string, direction: "up" | "down"): Promise<void> => {
  const activeSetlist = getSelectedSetlist(state);

  if (!activeSetlist) {
    return;
  }

  const nextSetlist = moveSongInPlaylist(activeSetlist, songId, direction);
  await persistActiveSetlist(nextSetlist);
  render();
};

const removeSongFromActivePlaylist = async (songId: string): Promise<void> => {
  const activeSetlist = getSelectedSetlist(state);

  if (!activeSetlist) {
    return;
  }

  const nextSetlist = removeSongFromPlaylist(activeSetlist, songId);
  await persistActiveSetlist(nextSetlist);
  const playlistSongIds = getPlaylistSongIds(nextSetlist);

  if (playlistSongIds.length === 0) {
    state.currentSongIndex = 0;
    state.selectedSongId = null;
  } else {
    state.currentSongIndex = Math.max(0, Math.min(state.currentSongIndex, playlistSongIds.length - 1));
    state.selectedSongId = playlistSongIds[state.currentSongIndex] ?? playlistSongIds[0] ?? null;
  }

  render();
};

const deleteSongFromLibrary = async (songId: string): Promise<void> => {
  const activeSong = state.songs.find((song) => song.id === songId);

  if (!activeSong) {
    return;
  }

  if (!window.confirm(`Delete ${activeSong.title}?`)) {
    return;
  }

  const response = await deleteSong(songId);
  state.songs = response.songs;
  state.setlists = removeSongFromAllSetlists(state.setlists, songId);

  await Promise.all(state.setlists.map((setlist) => updateSetlist(setlist.id, serializeSetlist(setlist))));
  await refreshSetlists();
  syncSelection(state);
  setStatus("Song deleted.");
  render();
};

const onPlaybackKeyDown = (event: KeyboardEvent): void => {
  const target = event.target as HTMLElement | null;

  if (target && (target.matches("input, textarea, select") || target.isContentEditable)) {
    return;
  }

  if (event.key === "ArrowRight") {
    const songIds = getActivePlaylistSongIds();

    if (songIds.length === 0 || state.currentSongIndex >= songIds.length - 1) {
      return;
    }

    event.preventDefault();
    goToNextPlaylistSong();
  }

  if (event.key === "ArrowLeft") {
    const songIds = getActivePlaylistSongIds();

    if (songIds.length === 0 || state.currentSongIndex <= 0) {
      return;
    }

    event.preventDefault();
    goToPreviousPlaylistSong();
  }
};

const onActionClick = async (target: HTMLElement): Promise<void> => {
  const action = target.dataset.action;

  switch (action) {
    case "toggle-sidebar":
      state.sidebarCollapsed = !state.sidebarCollapsed;
      render();
      break;
    case "toggle-number-notation":
      state.useNumberNotation = !state.useNumberNotation;
      render();
      break;
    case "toggle-viewer-theme":
      state.presentationTheme = state.presentationTheme === "dark" ? "light" : "dark";
      render();
      break;
    case "toggle-presentation-mode":
      state.presentationMode = !state.presentationMode;
      render();
      break;
    case "select-song":
      if (target.dataset.songId) {
        selectSong(state, target.dataset.songId);
        render();
      }
      break;
    case "select-key":
      if (target.dataset.key && NOTES.includes(target.dataset.key) && isValidNoteKey(target.dataset.key)) {
        state.selectedKey = target.dataset.key;
        render();
      }
      break;
    case "open-song-modal":
      openSongModal("create");
      break;
    case "edit-song":
      if (target.dataset.songId) {
        openSongModal("edit", target.dataset.songId);
      }
      break;
    case "close-song-modal":
      closeSongModal();
      break;
    case "open-setlist-modal":
      openSetlistModal();
      break;
    case "close-setlist-modal":
      closeSetlistModal();
      break;
    case "open-group-modal":
      openGroupModal();
      break;
    case "close-group-modal":
      closeGroupModal();
      break;
    case "select-setlist":
      if (target.dataset.setlistId) {
        selectSetlist(state, target.dataset.setlistId);
        render();
      }
      break;
    case "select-group":
      if (target.dataset.groupId) {
        selectGroup(state, target.dataset.groupId);
        render();
      }
      break;
    case "add-song-to-setlist":
      if (target.dataset.songId) {
        await addSongToActivePlaylist(target.dataset.songId);
      }
      break;
    case "play-next-song":
      goToNextPlaylistSong();
      break;
    case "play-previous-song":
      goToPreviousPlaylistSong();
      break;
    case "move-song-up":
      if (target.dataset.songId) {
        await moveSong(target.dataset.songId, "up");
      }
      break;
    case "move-song-down":
      if (target.dataset.songId) {
        await moveSong(target.dataset.songId, "down");
      }
      break;
    case "remove-song-from-playlist":
      if (target.dataset.songId) {
        await removeSongFromActivePlaylist(target.dataset.songId);
      }
      break;
    case "delete-song":
      if (target.dataset.songId) {
        await deleteSongFromLibrary(target.dataset.songId);
      }
      break;
    default:
      break;
  }
};

const onFieldInput = (target: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void => {
  if (target.matches('[data-action="search-songs"]')) {
    state.searchQuery = target.value;
    refreshSongLibraryResults();
    return;
  }

  if (target.closest('[data-action="submit-song-form"]')) {
    if (target.name === "title") {
      state.songForm.title = target.value;
    } else if (target.name === "artist") {
      state.songForm.artist = target.value;
    } else if (target.name === "key") {
      state.songForm.key = target.value;
    } else if (target.name === "sectionsJson") {
      state.songForm.sectionsJson = target.value;
    }
    return;
  }

  if (target.closest('[data-action="submit-setlist-form"]')) {
    if (target.name === "title") {
      state.setlistForm.title = target.value;
    } else if (target.name === "gigDate") {
      state.setlistForm.gigDate = target.value;
    } else if (target.name === "notes") {
      state.setlistForm.notes = target.value;
    }
    return;
  }

  if (target.closest('[data-action="submit-group-form"]') && target.name === "groupName") {
    state.groupName = target.value;
  }
};

app.addEventListener("click", async (event) => {
  const target = event.target as HTMLElement | null;
  const actionable = target?.closest<HTMLElement>("[data-action]");

  if (!actionable) {
    return;
  }

  await onActionClick(actionable);
});

app.addEventListener("input", (event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;

  if (!target) {
    return;
  }

  onFieldInput(target);
});

app.addEventListener("change", (event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;

  if (!target) {
    return;
  }

  onFieldInput(target);
});

window.addEventListener("keydown", onPlaybackKeyDown);

app.addEventListener("submit", async (event) => {
  const target = event.target as HTMLFormElement | null;

  if (!target) {
    return;
  }

  const action = target.dataset.action;

  if (action === "submit-song-form") {
    try {
      await createOrUpdateSong(event);
      closeSongModal();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save song.");
    }
  }

  if (action === "submit-setlist-form") {
    try {
      await createSetlistFromForm(event);
      closeSetlistModal();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to create setlist.");
    }
  }

  if (action === "submit-group-form") {
    try {
      await createGroupFromForm(event);
      closeGroupModal();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to create group.");
    }
  }
});

const bootstrap = async (): Promise<void> => {
  try {
    await Promise.all([refreshSongs(), refreshSetlists()]);
    syncSelection(state);

    if (state.songs.length > 0) {
      state.selectedSongId = state.selectedSongId ?? state.songs[0].id;
      state.selectedKey = state.songs[0].key;
    }

    if (state.setlists.length > 0) {
      state.selectedSetlistId = state.selectedSetlistId ?? state.setlists[0].id;
      state.selectedGroupId = state.selectedGroupId ?? state.setlists[0].groups[0]?.id ?? null;
    }

    const activePlaylistSongIds = getActivePlaylistSongIds();
    if (activePlaylistSongIds.length > 0) {
      state.currentSongIndex = Math.max(0, Math.min(state.currentSongIndex, activePlaylistSongIds.length - 1));
      state.selectedSongId = activePlaylistSongIds[state.currentSongIndex] ?? state.selectedSongId;
    }

    render();
  } catch (error) {
    app.innerHTML = `<div class="flex h-screen items-center justify-center p-6 text-white">${error instanceof Error ? error.message : "Failed to start StageChord."}</div>`;
  }
};

void bootstrap();
