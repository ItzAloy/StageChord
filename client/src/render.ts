import { convertSongToNashville, transposeSong } from "./chords";
import { NOTES } from "./types";
import type { AppState, Setlist, Song } from "./types";
import { getCurrentPlaybackSong, getCurrentPlaylistSongId, getPlaylistSongIds, getSelectedSetlist } from "./state";

const escapeHtml = (value: string): string => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const chunkArray = <T,>(values: T[], size: number): T[][] => {
  const rows: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    rows.push(values.slice(index, index + size));
  }

  return rows;
};

const renderChordRows = (chords: string[], accentClass: string): string => {
  return chunkArray(chords, 4)
    .map(
      (row) => `
        <div class="flex flex-wrap items-baseline gap-x-10 gap-y-2 font-mono text-lg font-semibold tracking-[0.18em] ${accentClass} md:text-xl">
          ${row.map((chord) => `<span>${escapeHtml(chord)}</span>`).join("")}
        </div>
      `
    )
    .join("");
};

const renderSongSection = (section: Song["sections"][number], accentClass: string, headerClass: string): string => {
  return `
    <article class="mb-8 break-inside-avoid border-0 bg-transparent p-0 shadow-none last:mb-0">
      <h3 class="mb-2 text-sm uppercase tracking-widest ${headerClass}">${escapeHtml(section.name)}</h3>
      <div class="space-y-1">
        ${renderChordRows(section.chords, accentClass)}
      </div>
    </article>
  `;
};

const renderPlusIcon = (): string => `
  <svg viewBox="0 0 16 16" aria-hidden="true" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
    <path d="M8 3.5v9M3.5 8h9" />
  </svg>
`;

const renderArrowUpIcon = (): string => `
  <svg viewBox="0 0 16 16" aria-hidden="true" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 12.5V3.5" />
    <path d="M4.5 7L8 3.5 11.5 7" />
  </svg>
`;

const renderArrowDownIcon = (): string => `
  <svg viewBox="0 0 16 16" aria-hidden="true" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 3.5v9" />
    <path d="M4.5 9L8 12.5 11.5 9" />
  </svg>
`;

const renderCloseIcon = (): string => `
  <svg viewBox="0 0 16 16" aria-hidden="true" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
    <path d="M4.5 4.5l7 7" />
    <path d="M11.5 4.5l-7 7" />
  </svg>
`;

const renderLibraryResult = (song: Song, state: AppState, activeSetlist: Setlist | null): string => {
  const isLightTheme = state.presentationTheme === "light";
  const rowClass = isLightTheme
    ? "border-gray-200 bg-white text-black hover:bg-gray-100"
    : "border-white/10 bg-neutral-950 text-white hover:bg-white/5";

  return `
    <div class="flex items-center gap-3 border-b px-3 py-2 last:border-b-0 ${rowClass}">
      <button type="button" data-action="select-song" data-song-id="${song.id}" class="min-w-0 flex-1 text-left">
        <div class="truncate text-sm font-medium">${escapeHtml(song.title)} - ${escapeHtml(song.artist)}</div>
      </button>
      ${activeSetlist ? `
        <button type="button" data-action="add-song-to-setlist" data-song-id="${song.id}" class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition ${isLightTheme ? "border-gray-300 text-black hover:bg-black hover:text-white" : "border-white/15 text-white hover:bg-white hover:text-black"}" aria-label="Add ${escapeHtml(song.title)} to active playlist">
          ${renderPlusIcon()}
        </button>
      ` : ""}
    </div>
  `;
};

export const renderSongLibraryResults = (state: AppState, activeSetlist: Setlist | null): string => {
  const search = state.searchQuery.trim().toLowerCase();

  if (!search.length) {
    return "";
  }

  const filteredSongs = state.songs.filter((song) => {
    return [song.title, song.artist, song.key].some((value) => value.toLowerCase().includes(search));
  });

  const isLightTheme = state.presentationTheme === "light";
  const emptyClass = isLightTheme ? "text-black/45" : "text-white/45";

  return filteredSongs.length > 0
    ? filteredSongs.map((song) => renderLibraryResult(song, state, activeSetlist)).join("")
    : `<div class="px-3 py-2 text-sm ${emptyClass}">No matching songs.</div>`;
};

const renderSetlistSummary = (setlist: Setlist, state: AppState): string => {
  const isLightTheme = state.presentationTheme === "light";
  const isSelected = setlist.id === state.selectedSetlistId;
  const cardClass = isSelected
    ? isLightTheme
      ? "bg-gray-100 text-black"
      : "bg-white text-black"
    : isLightTheme
      ? "bg-transparent text-black hover:bg-gray-100"
      : "bg-transparent text-white hover:bg-white/10";

  return `
    <button type="button" data-action="select-setlist" data-setlist-id="${setlist.id}" class="w-full rounded-md px-2 py-2 text-left transition ${cardClass}">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="break-words text-sm font-semibold leading-tight">${escapeHtml(setlist.title)}</p>
          <p class="mt-1 text-[0.72rem] ${isSelected ? "text-neutral-700" : isLightTheme ? "text-black/55" : "text-white/55"}">${escapeHtml(setlist.gigDate)}</p>
        </div>
        <span class="rounded-md border px-2 py-1 text-[0.62rem] uppercase tracking-[0.22em] ${isSelected ? "border-black/10 text-black" : isLightTheme ? "border-gray-300 text-black/55" : "border-white/15 text-white/55"}">${getPlaylistSongIds(setlist).length} songs</span>
      </div>
      ${setlist.notes ? `<p class="mt-2 text-[0.72rem] ${isSelected ? "text-neutral-700" : isLightTheme ? "text-black/55" : "text-white/55"}">${escapeHtml(setlist.notes)}</p>` : ""}
    </button>
  `;
};

const renderPlaylistSongRow = (songId: string, index: number, state: AppState): string => {
  const isLightTheme = state.presentationTheme === "light";
  const song = state.songs.find((entry) => entry.id === songId);
  const title = song?.title ?? "Unknown song";
  const artist = song?.artist ?? "Missing record";
  const isPlaying = songId === getCurrentPlaylistSongId(state);
  const rowClass = isPlaying
    ? isLightTheme
      ? "border-black bg-black/5 text-black"
      : "border-white bg-white/5 text-white"
    : isLightTheme
      ? "border-transparent text-black/55"
      : "border-transparent text-white/45";

  return `
    <div class="flex items-center gap-3 border-l-2 py-2 pl-2 ${rowClass}">
      <div class="w-5 shrink-0 text-center text-[0.62rem] font-semibold uppercase tracking-[0.22em] ${isPlaying ? (isLightTheme ? "text-black" : "text-white") : isLightTheme ? "text-black/35" : "text-white/35"}">${index + 1}</div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold">${escapeHtml(title)}</p>
        <p class="truncate text-[0.7rem] ${isPlaying ? (isLightTheme ? "text-black/75" : "text-white/80") : isLightTheme ? "text-black/50" : "text-white/50"}">${escapeHtml(artist)}</p>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <button type="button" data-action="move-song-up" data-song-id="${songId}" class="inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${isLightTheme ? "border-gray-300 text-black hover:bg-black hover:text-white" : "border-white/15 text-white hover:bg-white hover:text-black"}" aria-label="Move ${escapeHtml(title)} up">
          ${renderArrowUpIcon()}
        </button>
        <button type="button" data-action="move-song-down" data-song-id="${songId}" class="inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${isLightTheme ? "border-gray-300 text-black hover:bg-black hover:text-white" : "border-white/15 text-white hover:bg-white hover:text-black"}" aria-label="Move ${escapeHtml(title)} down">
          ${renderArrowDownIcon()}
        </button>
        <button type="button" data-action="remove-song-from-playlist" data-song-id="${songId}" class="inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${isLightTheme ? "border-gray-300 text-black hover:bg-black hover:text-white" : "border-white/15 text-white hover:bg-white hover:text-black"}" aria-label="Remove ${escapeHtml(title)} from playlist">
          ${renderCloseIcon()}
        </button>
      </div>
    </div>
  `;
};

const renderActivePlaylist = (setlist: Setlist, state: AppState): string => {
  const isLightTheme = state.presentationTheme === "light";
  const songIds = getPlaylistSongIds(setlist);

  return `
    <div class="mt-4 border-t ${isLightTheme ? "border-gray-200" : "border-white/10"} pt-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[0.62rem] uppercase tracking-[0.28em] ${isLightTheme ? "text-black/45" : "text-white/45"}">Active Playlist</p>
          <h2 class="mt-1 break-words text-base font-semibold leading-tight">${escapeHtml(setlist.title)}</h2>
          <p class="mt-1 text-xs ${isLightTheme ? "text-black/45" : "text-white/45"}">${escapeHtml(setlist.gigDate)}${setlist.notes ? ` · ${escapeHtml(setlist.notes)}` : ""}</p>
        </div>
      </div>

      <div class="mt-4 space-y-1">
        ${songIds.length > 0 ? songIds.map((songId, index) => renderPlaylistSongRow(songId, index, state)).join("") : `<div class="py-2 text-sm ${isLightTheme ? "text-black/45" : "text-white/45"}">Add songs from the library to build the playlist.</div>`}
      </div>
    </div>
  `;
};

const renderPlaybackBar = (state: AppState, activeSetlist: Setlist | null): string => {
  const isLightTheme = state.presentationTheme === "light";
  const songIds = activeSetlist ? getPlaylistSongIds(activeSetlist) : [];
  const currentSong = getCurrentPlaybackSong(state);
  const canPrev = songIds.length > 0 && state.currentSongIndex > 0;
  const canNext = songIds.length > 0 && state.currentSongIndex < songIds.length - 1;
  const buttonClass = isLightTheme
    ? "border-gray-300 text-black hover:bg-black hover:text-white disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-black"
    : "border-white/15 text-white hover:bg-white hover:text-black disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-white";

  return `
    <div class="sticky top-0 z-20 border-b ${isLightTheme ? "border-gray-200 bg-white" : "border-white/10 bg-black"} px-0 pb-4 pt-0">
      <div class="rounded-md border ${isLightTheme ? "border-gray-200 bg-white" : "border-white/10 bg-black"} p-3">
        <div class="grid grid-cols-2 gap-2">
          <button type="button" data-action="play-previous-song" class="inline-flex min-h-12 items-center justify-center rounded-md border px-3 py-3 text-sm font-semibold transition ${buttonClass}" ${canPrev ? "" : "disabled"}>
            ← Prev Song
          </button>
          <button type="button" data-action="play-next-song" class="inline-flex min-h-12 items-center justify-center rounded-md border px-3 py-3 text-sm font-semibold transition ${buttonClass}" ${canNext ? "" : "disabled"}>
            Next Song →
          </button>
        </div>
        <div class="mt-2 flex items-center justify-between gap-3 text-[0.62rem] uppercase tracking-[0.24em] ${isLightTheme ? "text-black/45" : "text-white/45"}">
          <span>Playback</span>
          <span>${currentSong ? `${state.currentSongIndex + 1} / ${songIds.length}` : "No active song"}</span>
        </div>
      </div>
    </div>
  `;
};

const renderSidebar = (state: AppState, activeSetlist: Setlist | null): string => {
  const isLightTheme = state.presentationTheme === "light";
  const sidebarSurfaceClass = isLightTheme ? "bg-white text-black border-gray-200" : "bg-black text-white border-white/10";
  const sidebarMutedClass = isLightTheme ? "text-black/45" : "text-white/45";
  const sidebarSoftBorderClass = isLightTheme ? "border-gray-200" : "border-white/10";
  const sidebarToggleClass = isLightTheme ? "border-gray-300 text-black hover:bg-black hover:text-white" : "border-white/15 text-white hover:bg-white hover:text-black";
  const sidebarButtonClass = isLightTheme ? "border-gray-300 text-black hover:bg-black hover:text-white" : "border-white/15 text-white hover:bg-white hover:text-black";
  const sidebarInputClass = isLightTheme ? "border-gray-300 bg-white text-black placeholder:text-black/35 focus:border-black" : "border-white/15 bg-black text-white placeholder:text-white/35 focus:border-white";

  return `
    <aside
      class="relative flex min-h-0 flex-none flex-col overflow-auto border-r p-4 ${sidebarSurfaceClass} ${state.sidebarCollapsed ? "lg:w-20" : "lg:w-80"}"
      style="resize: horizontal; overflow: auto; min-width: 16rem; max-width: 32rem;"
    >
      <div class="pointer-events-none absolute right-0 top-1/2 h-16 w-2 -translate-y-1/2 cursor-col-resize bg-transparent">
        <div class="mx-auto h-full w-px bg-current/20"></div>
      </div>

      <div class="flex items-center justify-between gap-3 border-b ${sidebarSoftBorderClass} pb-4">
        <div class="min-w-0 ${state.sidebarCollapsed ? "hidden" : "block"}">
          <p class="text-2xl font-bold tracking-tight">MonoChord</p>
        </div>
        <button type="button" data-action="toggle-sidebar" class="rounded-md border px-2 py-1 text-[0.6rem] uppercase tracking-[0.2em] transition ${sidebarToggleClass}">
          ${state.sidebarCollapsed ? "Open" : "Collapse"}
        </button>
      </div>

      <div class="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 ${state.sidebarCollapsed ? "hidden" : "block"}">
        ${renderPlaybackBar(state, activeSetlist)}

        <section class="border-b ${sidebarSoftBorderClass} pb-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.28em]">CONTROLS</p>
            </div>
          </div>

          <div class="mt-4">
            <p class="text-sm">Transpose Key</p>
            <div class="mt-3 grid grid-cols-4 gap-2">
            ${NOTES.map((note) => {
              const active = note === state.selectedKey;
              return `
                <button type="button" data-action="select-key" data-key="${note}" class="rounded-md border px-2 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] transition ${
                  active ? "bg-black text-white border-black" : isLightTheme ? "bg-white text-black border-gray-300 hover:bg-gray-100" : "bg-black text-white border-white/15 hover:bg-white hover:text-black"
                }">
                  ${note}
                </button>
              `;
            }).join("")}
            </div>
          </div>

          <div class="mt-4 space-y-3">
            <label class="flex items-center justify-between gap-3 text-sm">
              <span>Use Number Notation</span>
              <button type="button" data-action="toggle-number-notation" class="relative inline-flex h-6 w-11 items-center rounded-md border ${sidebarSoftBorderClass} transition">
                <span class="inline-block h-4 w-4 rounded-full bg-current transition ${state.useNumberNotation ? "translate-x-6" : "translate-x-1"}"></span>
              </button>
            </label>
            <label class="flex items-center justify-between gap-3 text-sm">
              <span>Dark / Light</span>
              <button type="button" data-action="toggle-viewer-theme" class="relative inline-flex h-6 w-11 items-center rounded-md border ${sidebarSoftBorderClass} transition">
                <span class="inline-block h-4 w-4 rounded-full bg-current transition ${state.presentationTheme === "light" ? "translate-x-6" : "translate-x-1"}"></span>
              </button>
            </label>
          </div>
        </section>

        <section class="border-b ${sidebarSoftBorderClass} pb-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.28em]">SONG LIBRARY</p>
            </div>
          </div>

          <div class="relative mt-4">
            <label class="block">
            <span class="sr-only">Search songs</span>
            <input
              type="search"
              value="${escapeHtml(state.searchQuery)}"
              data-action="search-songs"
              placeholder="Search songs"
              class="w-full rounded-md border px-3 py-2 text-sm outline-none ring-0 ${sidebarInputClass}"
            />
            </label>

            <div data-song-library-dropdown class="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-md border ${isLightTheme ? "border-gray-200 bg-white text-black shadow-lg shadow-black/5" : "border-white/10 bg-neutral-950 text-white shadow-lg shadow-black/40"} ${state.searchQuery.trim().length > 0 ? "block" : "hidden"}">
              <div data-song-library-results>
                ${renderSongLibraryResults(state, activeSetlist)}
              </div>
            </div>
          </div>
        </section>

        <section class="border-b ${sidebarSoftBorderClass} pb-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.28em]">PLAYLISTS</p>
            </div>
            <button type="button" data-action="open-setlist-modal" class="rounded-md px-3 py-2 text-[0.6rem] uppercase tracking-[0.2em] transition ${sidebarButtonClass}">
              New Playlist
            </button>
          </div>

          <div class="mt-4 space-y-2">
            ${state.setlists.length > 0 ? state.setlists.map((setlist) => renderSetlistSummary(setlist, state)).join("") : `<div class="py-4 text-sm ${sidebarMutedClass}">No setlists yet.</div>`}
          </div>

          ${activeSetlist ? renderActivePlaylist(activeSetlist, state) : `<div class="mt-4 text-sm ${sidebarMutedClass}">Create a playlist to start ordering songs.</div>`}
        </section>
      </div>
    </aside>
  `;
};

const renderSongModal = (state: AppState): string => {
  if (!state.songModalMode) {
    return "";
  }

  const isEditing = state.songModalMode === "edit";
  const title = isEditing ? "Edit Song" : "New Song";
  const submitLabel = isEditing ? "Save Changes" : "Create Song";

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div class="w-full max-w-3xl rounded-[2rem] border border-white/12 bg-neutral-950 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-[0.62rem] uppercase tracking-[0.28em] text-white/45">Song Editor</p>
            <h2 class="mt-1 text-xl font-semibold text-white">${title}</h2>
          </div>
          <button type="button" data-action="close-song-modal" class="rounded-md border border-white/15 px-3 py-2 text-[0.68rem] uppercase tracking-[0.22em] text-white transition hover:bg-white hover:text-black">Close</button>
        </div>

        <form data-action="submit-song-form" class="mt-6 space-y-4">
          <div class="grid gap-3 md:grid-cols-2">
            <input type="text" name="title" value="${escapeHtml(state.songForm.title)}" placeholder="Title" class="rounded-2xl border border-white/12 bg-black px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/40" />
            <input type="text" name="artist" value="${escapeHtml(state.songForm.artist)}" placeholder="Artist" class="rounded-2xl border border-white/12 bg-black px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/40" />
          </div>

          <label class="block">
            <span class="mb-2 block text-[0.62rem] uppercase tracking-[0.28em] text-white/45">Original Key</span>
            <select name="key" class="w-full rounded-2xl border border-white/12 bg-black px-4 py-3 text-white outline-none focus:border-white/40">
              ${NOTES.map((note) => `<option value="${note}" ${state.songForm.key === note ? "selected" : ""}>${note}</option>`).join("")}
            </select>
          </label>

          <label class="block">
            <span class="mb-2 block text-[0.62rem] uppercase tracking-[0.28em] text-white/45">Sections JSON</span>
            <textarea name="sectionsJson" rows="12" class="w-full rounded-[1.5rem] border border-white/12 bg-black px-4 py-3 font-mono text-sm text-white outline-none focus:border-white/40">${escapeHtml(state.songForm.sectionsJson)}</textarea>
          </label>

          <div class="flex items-center justify-between gap-3">
            <p class="text-sm text-white/50">Keep the structure simple: each section needs a name and a non-empty chord list.</p>
            <button type="submit" class="rounded-md border border-white bg-white px-5 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-black transition hover:bg-transparent hover:text-white">
              ${submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
};

const renderSetlistModal = (state: AppState): string => {
  if (!state.setlistModalOpen) {
    return "";
  }

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div class="w-full max-w-xl rounded-[2rem] border border-white/12 bg-neutral-950 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-[0.62rem] uppercase tracking-[0.28em] text-white/45">Gig Folder</p>
            <h2 class="mt-1 text-xl font-semibold text-white">New Setlist</h2>
          </div>
          <button type="button" data-action="close-setlist-modal" class="rounded-md border border-white/15 px-3 py-2 text-[0.68rem] uppercase tracking-[0.22em] text-white transition hover:bg-white hover:text-black">Close</button>
        </div>

        <form data-action="submit-setlist-form" class="mt-6 space-y-4">
          <div class="grid gap-3 md:grid-cols-2">
            <input type="text" name="title" value="${escapeHtml(state.setlistForm.title)}" placeholder="Title" class="rounded-2xl border border-white/12 bg-black px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/40" />
            <input type="date" name="gigDate" value="${escapeHtml(state.setlistForm.gigDate)}" class="rounded-2xl border border-white/12 bg-black px-4 py-3 text-white outline-none focus:border-white/40" />
          </div>
          <label class="block">
            <span class="mb-2 block text-[0.62rem] uppercase tracking-[0.28em] text-white/45">Notes</span>
            <input type="text" name="notes" value="${escapeHtml(state.setlistForm.notes)}" placeholder="Optional notes" class="w-full rounded-2xl border border-white/12 bg-black px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/40" />
          </label>
          <div class="flex items-center justify-end gap-3">
            <button type="submit" class="rounded-md border border-white bg-white px-5 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-black transition hover:bg-transparent hover:text-white">Create Folder</button>
          </div>
        </form>
      </div>
    </div>
  `;
};

const renderGroupModal = (state: AppState): string => {
  if (!state.groupModalOpen) {
    return "";
  }

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div class="w-full max-w-lg rounded-[2rem] border border-white/12 bg-neutral-950 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-[0.62rem] uppercase tracking-[0.28em] text-white/45">Group Builder</p>
            <h2 class="mt-1 text-xl font-semibold text-white">Add Group</h2>
          </div>
          <button type="button" data-action="close-group-modal" class="rounded-md border border-white/15 px-3 py-2 text-[0.68rem] uppercase tracking-[0.22em] text-white transition hover:bg-white hover:text-black">Close</button>
        </div>

        <form data-action="submit-group-form" class="mt-6 space-y-4">
          <input type="text" name="groupName" value="${escapeHtml(state.groupName)}" placeholder="Group name" class="w-full rounded-2xl border border-white/12 bg-black px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/40" />
          <div class="flex items-center justify-end gap-3">
            <button type="submit" class="rounded-md border border-white bg-white px-5 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-black transition hover:bg-transparent hover:text-white">Create Group</button>
          </div>
        </form>
      </div>
    </div>
  `;
};

export const renderApp = (state: AppState): string => {
  const isLightTheme = state.presentationTheme === "light";
  const activeSong = getCurrentPlaybackSong(state) ?? state.songs[0] ?? null;
  const activeSetlist = getSelectedSetlist(state);

  const renderedSong = activeSong ? transposeSong(activeSong, state.selectedKey) : null;
  const displayedSong = renderedSong && state.useNumberNotation ? convertSongToNashville(renderedSong, state.selectedKey) : renderedSong;
  const shellClass = isLightTheme ? "bg-white text-black" : "bg-black text-white";
  const stageThemeClass = isLightTheme ? "bg-white text-black" : "bg-black text-white";
  const stageHeaderClass = isLightTheme ? "bg-white text-black" : "bg-black text-white";
  const stageLabelClass = isLightTheme ? "text-black/45" : "text-white/45";
  const accentClass = isLightTheme ? "text-black" : "text-white";

  return `
    <main class="flex h-screen w-screen overflow-hidden ${shellClass}">
      ${renderSidebar(state, activeSetlist)}

      <section class="flex min-h-0 flex-1 flex-col overflow-y-auto ${stageThemeClass}">
        <header class="sticky top-0 z-10 flex items-center justify-between gap-4 px-4 py-4 ${stageHeaderClass}">
          <div class="min-w-0 flex-1">
            <p class="text-[0.62rem] uppercase tracking-[0.32em] ${stageLabelClass}">SONG TITLE</p>
            <h2 class="mt-1 truncate text-3xl font-semibold tracking-tight">${escapeHtml(displayedSong?.title ?? "Select a song")}</h2>
          </div>

          <div class="min-w-0 flex-1 text-center">
            <p class="text-[0.62rem] uppercase tracking-[0.32em] ${stageLabelClass}">ARTIST</p>
            <p class="mt-1 truncate text-3xl font-semibold tracking-tight">${escapeHtml(displayedSong?.artist ?? "")}</p>
          </div>

          <div class="min-w-0 text-right">
            <p class="text-[0.62rem] uppercase tracking-[0.32em] ${stageLabelClass}">KEY</p>
            <p class="mt-1 text-3xl font-semibold tracking-tight">${escapeHtml(state.selectedKey)}</p>
          </div>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto px-6 py-6 ${isLightTheme ? "bg-white text-black" : "bg-black text-white"}">
          ${displayedSong ? `
            <div class="columns-1 gap-8 md:columns-2 lg:columns-3 [column-fill:balance]">
              ${displayedSong.sections
                .map((section) => renderSongSection(section, accentClass, stageLabelClass))
                .join("")}
            </div>
          ` : `
            <div class="flex h-full items-center justify-center text-center ${isLightTheme ? "text-black/50" : "text-white/50"}">
              <div>
                <p class="text-[0.62rem] uppercase tracking-[0.28em]">No Song Selected</p>
                <p class="mt-2 text-sm">Choose a song from the library to populate the stage.</p>
              </div>
            </div>
          `}
        </div>
      </section>

      ${state.statusMessage ? `
        <div class="pointer-events-none fixed bottom-4 left-4 right-4 z-40 flex justify-center">
          <div class="max-w-3xl rounded-full border border-white/15 bg-black/85 px-4 py-3 text-sm text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">${escapeHtml(state.statusMessage)}</div>
        </div>
      ` : ""}

      ${renderSongModal(state)}
      ${renderSetlistModal(state)}
      ${renderGroupModal(state)}
    </main>
  `;
};
