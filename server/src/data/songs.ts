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
    title: "Rayakan Kasih-Mu",
    artist: "LOJ Worship",
    key: "E",
    sections: [
      { id: "s2-intro", name: "Intro", chords: ["E", "E", "E", "E"] },
      { id: "s2-verse", name: "Verse (2x)", chords: ["E", "C#m", "F#m", "A", "E"] },
      { id: "s2-pre-chorus", name: "Pre-chorus", chords: ["A", "E", "A", "E", "A", "E", "A", "C#m", "B"] },
      { id: "s2-chorus", name: "Chorus", chords: ["A", "B", "E", "A", "B", "A", "B", "C#m", "F#m", "C#m", "A", "B", "E"] },
      { id: "s2-interlude", name: "Interlude", chords: ["C", "Am", "Bm", "Em", "C", "Am", "Bm", "C", "Am", "Bm", "Em", "C", "Am", "B", "B"] },
      { id: "s2-tag", name: "Tag (2x)", chords: ["D", "A", "E"] }
    ]
  },
{
    id: "song-3",
    title: "Mengikut Yesus",
    artist: "GMS",
    key: "G",
    sections: [
      { id: "s4-intro", name: "Intro", chords: ["G", "G", "C", "C", "Em", "G", "C", "C"] },
      { id: "s4-verse", name: "Verse", chords: ["G", "C/G", "Em", "D", "G", "C/G", "Em", "D", "G/B", "C", "G/B", "Am", "D"] },
      { id: "s4-chorus", name: "Chorus", chords: ["G", "B", "Em", "G/D", "C", "G/B", "Am", "D", "G", "B", "Em", "G/D", "C", "G/B", "Am", "D", "G"] },
      { id: "s4-interlude-1", name: "Interlude 1", chords: ["G", "G", "G", "Em/G"] },
      { id: "s4-interlude-2", name: "Interlude 2 (6x)", chords: ["Em", "C", "G", "D"] },
      { id: "s4-ending", name: "Ending", chords: ["G", "G", "G"] }
    ]
  }
];
