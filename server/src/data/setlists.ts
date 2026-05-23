import { Setlist } from "../types";

export const seedSetlists: Setlist[] = [
  {
    id: "setlist-1",
    title: "Gigs Today",
    gigDate: "2026-05-23",
    notes: "Default example setlist for tonight's flow.",
    groups: [
      {
        id: "setlist-1-warmup",
        name: "Warmup",
        songIds: ["song-1"]
      },
      {
        id: "setlist-1-main",
        name: "Main Set",
        songIds: ["song-2", "song-3"]
      }
    ]
  }
];