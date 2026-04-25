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
