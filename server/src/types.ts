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
