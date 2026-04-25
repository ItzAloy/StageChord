import { Song } from "../types";

export const songs: Song[] = [
{
    id: "song-1",
    title: "Sukacitaku",
    artist: "LOJ Worship",
    key: "G",
    sections: [
      { id: "s1-intro", name: "Intro", chords: ["G", "D/F#", "F", "C", "G", "D/F#", "F", "C"] },
      { id: "s1-verse", name: "Verse", chords: ["G", "Em", "Am", "D", "G", "Em", "Am", "D"] },
      { id: "s1-pre-chorus", name: "Pre Chorus", chords: ["C", "G", "C", "Em", "D", "C", "G", "Am", "D"] },
      { id: "s1-chorus", name: "Chorus", chords: ["C", "D", "Bm", "Em", "Am", "D", "Dm", "G7", "C", "D", "Bm", "Em", "Am", "D", "G"] },
      { id: "s1-interlude", name: "Interlude", chords: ["Cmaj7", "Cm", "Bm", "Dm", "Em", "Am", "Bm", "Cmaj7", "D"] },
      { id: "s1-coda", name: "Coda", chords: ["Am", "Bm", "C", "Em", "D", "Am", "D", "G"] },
      { id: "s1-outro", name: "Outro", chords: ["G", "G", "A", "C/D", "G", "G", "A", "C/D", "G"] }
    ]
  },
  {
    id: "song-2",
    title: "Rayakan KasihMu",
    artist: "LOJ Worship",
    key: "E",
    sections: [
      { id: "s2-verse", name: "Bait", chords: ["E", "C#m", "F#m", "A", "E", "C#m", "F#m", "A", "E"] },
      { id: "s2-pre-chorus", name: "Pre-chorus", chords: ["A", "E", "A", "E", "A", "E", "A", "C#m", "B"] },
      { id: "s2-chorus", name: "Reff", chords: ["A", "B", "E", "A", "B", "A", "B", "C#m", "F#m", "C#m", "A", "B", "E"] },
      { id: "s2-outro", name: "Outro", chords: ["D", "A", "E", "D", "A", "E"] }
    ]
  },
  {
    id: "song-3",
    title: "Mengikut Yesus",
    artist: "GMS Worship",
    key: "G",
    sections: [
      { id: "s3-verse", name: "Bait", chords: ["G", "C", "Em", "D", "G", "C", "Em", "D", "C", "G/B", "Am", "D"] },
      { id: "s3-chorus", name: "Reff", chords: ["G", "B", "Em", "D", "C", "G/B", "Am", "D", "G", "B", "Em", "D", "C", "G/B", "Am", "D", "G"] }
    ]
  }
];
