export interface SongSection {
  id: string;
  name: string;
  chords: string[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  sections: SongSection[];
}

export interface SetlistGroup {
  id: string;
  name: string;
  songIds: string[];
}

export interface Setlist {
  id: string;
  title: string;
  gigDate: string;
  notes?: string;
  groups: SetlistGroup[];
}

export type PresentationTheme = "dark" | "light";
export type SongModalMode = "create" | "edit";

export interface SongFormState {
  title: string;
  artist: string;
  key: string;
  sectionsJson: string;
}

export interface SetlistFormState {
  title: string;
  gigDate: string;
  notes: string;
}

export interface AppState {
  songs: Song[];
  setlists: Setlist[];
  selectedSongId: string | null;
  selectedSetlistId: string | null;
  selectedGroupId: string | null;
  currentSongIndex: number;
  selectedKey: string;
  searchQuery: string;
  sidebarCollapsed: boolean;
  presentationTheme: PresentationTheme;
  presentationMode: boolean;
  useNumberNotation: boolean;
  songModalMode: SongModalMode | null;
  songForm: SongFormState;
  setlistModalOpen: boolean;
  setlistForm: SetlistFormState;
  groupModalOpen: boolean;
  groupName: string;
  statusMessage: string | null;
}

export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const DEFAULT_SECTIONS_JSON = JSON.stringify(
  [
    { name: "Intro", chords: ["C", "G", "Am", "F"] },
    { name: "Verse", chords: ["C", "Em", "F", "G"] }
  ],
  null,
  2
);

export const createEmptySongForm = (): SongFormState => ({
  title: "",
  artist: "",
  key: "C",
  sectionsJson: DEFAULT_SECTIONS_JSON
});

export const createEmptySetlistForm = (): SetlistFormState => ({
  title: "",
  gigDate: new Date().toISOString().slice(0, 10),
  notes: ""
});
