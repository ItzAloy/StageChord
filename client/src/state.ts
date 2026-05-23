import { createEmptySetlistForm, createEmptySongForm } from "./types";
import type { AppState, Setlist, SetlistGroup, Song, SongFormState } from "./types";

export const createInitialState = (): AppState => ({
  songs: [],
  setlists: [],
  selectedSongId: null,
  selectedSetlistId: null,
  selectedGroupId: null,
  selectedKey: "C",
  searchQuery: "",
  sidebarCollapsed: false,
  currentSongIndex: 0,
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
});

export const getSelectedSong = (state: AppState): Song | null => {
  return state.songs.find((song) => song.id === state.selectedSongId) ?? state.songs[0] ?? null;
};

export const getSelectedSetlist = (state: AppState): Setlist | null => {
  return state.setlists.find((setlist) => setlist.id === state.selectedSetlistId) ?? state.setlists[0] ?? null;
};

export const getCurrentPlaylistSongId = (state: AppState): string | null => {
  const activeSetlist = getSelectedSetlist(state);

  if (!activeSetlist) {
    return null;
  }

  const songIds = getPlaylistSongIds(activeSetlist);

  if (songIds.length === 0) {
    return null;
  }

  const clampedIndex = Math.max(0, Math.min(state.currentSongIndex, songIds.length - 1));

  return songIds[clampedIndex] ?? null;
};

export const getCurrentPlaybackSong = (state: AppState): Song | null => {
  const songId = getCurrentPlaylistSongId(state);

  if (songId) {
    return state.songs.find((song) => song.id === songId) ?? null;
  }

  return getSelectedSong(state);
};

export const getSelectedGroup = (state: AppState): SetlistGroup | null => {
  const setlist = getSelectedSetlist(state);

  if (!setlist) {
    return null;
  }

  if (state.selectedGroupId) {
    return setlist.groups.find((group) => group.id === state.selectedGroupId) ?? setlist.groups[0] ?? null;
  }

  return setlist.groups[0] ?? null;
};

export const syncSelection = (state: AppState): void => {
  if (state.songs.length > 0) {
    const selectedSong = getSelectedSong(state);

    if (!selectedSong) {
      state.selectedSongId = state.songs[0].id;
      state.selectedKey = state.songs[0].key;
    }
  } else {
    state.selectedSongId = null;
  }

  if (state.setlists.length > 0) {
    const selectedSetlist = getSelectedSetlist(state);

    if (!selectedSetlist) {
      state.selectedSetlistId = state.setlists[0].id;
      state.selectedGroupId = state.setlists[0].groups[0]?.id ?? null;
    } else if (selectedSetlist.groups.length > 0) {
      const selectedGroup = getSelectedGroup(state);

      if (!selectedGroup) {
        state.selectedGroupId = selectedSetlist.groups[0].id;
      }
    }
  } else {
    state.selectedSetlistId = null;
    state.selectedGroupId = null;
  }

  const activeSetlist = getSelectedSetlist(state);
  const playlistSongIds = activeSetlist ? getPlaylistSongIds(activeSetlist) : [];

  if (playlistSongIds.length > 0) {
    state.currentSongIndex = Math.max(0, Math.min(state.currentSongIndex, playlistSongIds.length - 1));
    state.selectedSongId = playlistSongIds[state.currentSongIndex] ?? state.selectedSongId;

    const currentSong = state.songs.find((song) => song.id === state.selectedSongId);

    if (currentSong) {
      state.selectedKey = currentSong.key;
    }
  } else {
    state.currentSongIndex = 0;
  }
};

export const selectSong = (state: AppState, songId: string): void => {
  const song = state.songs.find((entry) => entry.id === songId);

  if (!song) {
    return;
  }

  state.selectedSongId = song.id;
  state.selectedKey = song.key;
};

export const selectSetlist = (state: AppState, setlistId: string): void => {
  const setlist = state.setlists.find((entry) => entry.id === setlistId);

  if (!setlist) {
    return;
  }

  state.selectedSetlistId = setlist.id;
  state.selectedGroupId = setlist.groups[0]?.id ?? null;
  state.currentSongIndex = 0;
};

export const selectGroup = (state: AppState, groupId: string): void => {
  const setlist = getSelectedSetlist(state);

  if (!setlist) {
    return;
  }

  const groupExists = setlist.groups.some((group) => group.id === groupId);

  if (!groupExists) {
    return;
  }

  state.selectedGroupId = groupId;
};

export const createSongFormFromSong = (song: Song): SongFormState => ({
  title: song.title,
  artist: song.artist,
  key: song.key,
  sectionsJson: JSON.stringify(song.sections.map((section) => ({ name: section.name, chords: section.chords })), null, 2)
});

export const createNewSetlist = (title: string, gigDate: string, notes: string): Setlist => ({
  id: `setlist-${Date.now()}`,
  title: title.trim() || "New Setlist",
  gigDate: gigDate.trim() || new Date().toISOString().slice(0, 10),
  notes: notes.trim() || undefined,
  groups: [
    {
      id: `group-${Date.now()}-main`,
      name: "Playlist",
      songIds: []
    }
  ]
});

export const getPlaylistSongIds = (setlist: Setlist): string[] => {
  return setlist.groups[0]?.songIds ?? [];
};

const updatePlaylistSongs = (setlist: Setlist, updater: (songIds: string[]) => string[]): Setlist => {
  const playlistGroup = setlist.groups[0] ?? {
    id: `group-${setlist.id}-playlist`,
    name: "Playlist",
    songIds: [] as string[]
  };

  const nextPlaylistGroup: SetlistGroup = {
    ...playlistGroup,
    songIds: updater([...playlistGroup.songIds])
  };

  return {
    ...setlist,
    groups: [nextPlaylistGroup]
  };
};

export const addSongToPlaylist = (setlist: Setlist, songId: string): Setlist => {
  return updatePlaylistSongs(setlist, (songIds) => {
    const nextSongIds = songIds.filter((currentSongId) => currentSongId !== songId);
    nextSongIds.push(songId);
    return nextSongIds;
  });
};

export const moveSongInPlaylist = (setlist: Setlist, songId: string, direction: "up" | "down"): Setlist => {
  return updatePlaylistSongs(setlist, (songIds) => {
    const songIndex = songIds.indexOf(songId);

    if (songIndex < 0) {
      return songIds;
    }

    const swapIndex = direction === "up" ? songIndex - 1 : songIndex + 1;

    if (swapIndex < 0 || swapIndex >= songIds.length) {
      return songIds;
    }

    [songIds[songIndex], songIds[swapIndex]] = [songIds[swapIndex], songIds[songIndex]];
    return songIds;
  });
};

export const removeSongFromPlaylist = (setlist: Setlist, songId: string): Setlist => {
  return updatePlaylistSongs(setlist, (songIds) => songIds.filter((currentSongId) => currentSongId !== songId));
};

export const addGroupToSetlist = (setlist: Setlist, name: string): Setlist => ({
  ...setlist,
  groups: [
    ...setlist.groups,
    {
      id: `group-${Date.now()}`,
      name: name.trim() || "New Group",
      songIds: []
    }
  ]
});

export const addSongToGroup = (setlist: Setlist, groupId: string, songId: string): Setlist => {
  return {
    ...setlist,
    groups: setlist.groups.map((group) => {
      if (group.id !== groupId) {
        return group;
      }

      const nextSongIds = group.songIds.filter((currentSongId) => currentSongId !== songId);
      nextSongIds.push(songId);

      return {
        ...group,
        songIds: nextSongIds
      };
    })
  };
};

export const moveSongInGroup = (setlist: Setlist, groupId: string, songId: string, direction: "up" | "down"): Setlist => {
  return {
    ...setlist,
    groups: setlist.groups.map((group) => {
      if (group.id !== groupId) {
        return group;
      }

      const songIndex = group.songIds.indexOf(songId);

      if (songIndex < 0) {
        return group;
      }

      const nextSongIds = [...group.songIds];
      const swapIndex = direction === "up" ? songIndex - 1 : songIndex + 1;

      if (swapIndex < 0 || swapIndex >= nextSongIds.length) {
        return group;
      }

      [nextSongIds[songIndex], nextSongIds[swapIndex]] = [nextSongIds[swapIndex], nextSongIds[songIndex]];

      return {
        ...group,
        songIds: nextSongIds
      };
    })
  };
};

export const removeSongFromGroup = (setlist: Setlist, groupId: string, songId: string): Setlist => ({
  ...setlist,
  groups: setlist.groups.map((group) => {
    if (group.id !== groupId) {
      return group;
    }

    return {
      ...group,
      songIds: group.songIds.filter((currentSongId) => currentSongId !== songId)
    };
  })
});

export const removeSongFromAllSetlists = (setlists: Setlist[], songId: string): Setlist[] => {
  return setlists.map((setlist) => ({
    ...setlist,
    groups: setlist.groups.map((group) => ({
      ...group,
      songIds: group.songIds.filter((currentSongId) => currentSongId !== songId)
    }))
  }));
};
