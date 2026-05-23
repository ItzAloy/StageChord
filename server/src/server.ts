import cors from "cors";
import express from "express";
import { existsSync } from "fs";
import path from "path";

import { appendSong, deleteSong, getSongById, getSongs, updateSong } from "./data/songStore";
import { getSetlists, saveSetlists, upsertSetlist } from "./data/setlistStore";
import { Setlist, SetlistGroup, Song, SongSection } from "./types";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const clientBuildPath = path.resolve(__dirname, "..", "..", "client", "dist");

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/songs", async (_req, res) => {
  const songs = await getSongs();

  res.json(songs);
});

app.get("/api/songs/:songId", async (req, res) => {
  const { songId } = req.params;
  const song = await getSongById(songId);

  if (!song) {
    res.status(404).json({ message: "Song not found." });
    return;
  }

  res.json(song);
});

app.get("/api/setlists", async (_req, res) => {
  const setlists = await getSetlists();

  res.json(setlists);
});

app.post("/api/setlists", async (req, res) => {
  const { title, gigDate, notes, groups } = req.body as Partial<Setlist>;

  if (!title || !gigDate || !Array.isArray(groups) || groups.length === 0) {
    res.status(400).json({ message: "Invalid payload. Provide title, gigDate, and groups." });
    return;
  }

  const sanitizedGroups: SetlistGroup[] = groups
    .filter((group) => group && typeof group.name === "string" && Array.isArray(group.songIds))
    .map((group, groupIndex) => ({
      id: group.id?.trim() || `group-${Date.now()}-${groupIndex + 1}`,
      name: group.name.trim(),
      songIds: group.songIds.map((songId) => String(songId).trim()).filter((songId) => songId.length > 0)
    }))
    .filter((group) => group.name.length > 0);

  if (sanitizedGroups.length === 0) {
    res.status(400).json({ message: "Groups must include a name." });
    return;
  }

  const newSetlist: Setlist = {
    id: `setlist-${Date.now()}`,
    title: title.trim(),
    gigDate: gigDate.trim(),
    notes: typeof notes === "string" ? notes.trim() : undefined,
    groups: sanitizedGroups
  };

  const updatedSetlists = await upsertSetlist(newSetlist);

  res.status(201).json(updatedSetlists);
});

app.put("/api/setlists/:setlistId", async (req, res) => {
  const { setlistId } = req.params;
  const { title, gigDate, notes, groups } = req.body as Partial<Setlist>;

  if (!title || !gigDate || !Array.isArray(groups) || groups.length === 0) {
    res.status(400).json({ message: "Invalid payload. Provide title, gigDate, and groups." });
    return;
  }

  const sanitizedGroups: SetlistGroup[] = groups
    .filter((group) => group && typeof group.name === "string" && Array.isArray(group.songIds))
    .map((group, groupIndex) => ({
      id: group.id?.trim() || `group-${Date.now()}-${groupIndex + 1}`,
      name: group.name.trim(),
      songIds: group.songIds.map((songId) => String(songId).trim()).filter((songId) => songId.length > 0)
    }))
    .filter((group) => group.name.length > 0);

  if (sanitizedGroups.length === 0) {
    res.status(400).json({ message: "Groups must include a name." });
    return;
  }

  const updatedSetlist: Setlist = {
    id: setlistId,
    title: title.trim(),
    gigDate: gigDate.trim(),
    notes: typeof notes === "string" ? notes.trim() : undefined,
    groups: sanitizedGroups
  };

  const updatedSetlists = await upsertSetlist(updatedSetlist);

  res.json(updatedSetlists);
});

app.patch("/api/setlists/:setlistId/reorder", async (req, res) => {
  const { setlistId } = req.params;
  const { groups } = req.body as Partial<Pick<Setlist, "groups">>;

  if (!Array.isArray(groups) || groups.length === 0) {
    res.status(400).json({ message: "Invalid payload. Provide groups array." });
    return;
  }

  const setlists = await getSetlists();
  const targetSetlist = setlists.find((entry) => entry.id === setlistId);

  if (!targetSetlist) {
    res.status(404).json({ message: "Setlist not found." });
    return;
  }

  const normalizedGroups: SetlistGroup[] = groups
    .filter((group) => group && typeof group.name === "string" && Array.isArray(group.songIds))
    .map((group) => ({
      id: typeof group.id === "string" && group.id.trim().length > 0 ? group.id.trim() : `group-${Date.now()}`,
      name: group.name.trim(),
      songIds: group.songIds.map((songId) => String(songId).trim()).filter((songId) => songId.length > 0)
    }))
    .filter((group) => group.name.length > 0);

  if (normalizedGroups.length === 0) {
    res.status(400).json({ message: "Groups must include a name." });
    return;
  }

  const updatedSetlists = setlists.map((entry) =>
    entry.id === setlistId ? { ...targetSetlist, groups: normalizedGroups } : entry
  );

  await saveSetlists(updatedSetlists);
  res.json(updatedSetlists);
});

app.post("/api/songs", async (req, res) => {
  const { title, artist, key, sections } = req.body as Partial<Song>;
  const sanitizedSections = sanitizeSections(sections);

  if (!title || !artist || !key || sanitizedSections.length === 0) {
    res.status(400).json({ message: "Invalid payload. Provide title, artist, key, and sections." });
    return;
  }

  const newSong: Song = {
    id: `song-${Date.now()}`,
    title: title.trim(),
    artist: artist.trim(),
    key: key.trim(),
    sections: sanitizedSections
  };

  const updatedSongs = await appendSong(newSong);

  res.status(201).json({ song: newSong, songs: updatedSongs });
});

app.put("/api/songs/:songId", async (req, res) => {
  const { songId } = req.params;
  const { title, artist, key, sections } = req.body as Partial<Song>;
  const sanitizedSections = sanitizeSections(sections);

  if (!title || !artist || !key || sanitizedSections.length === 0) {
    res.status(400).json({ message: "Invalid payload. Provide title, artist, key, and sections." });
    return;
  }

  const existingSong = await getSongById(songId);

  if (!existingSong) {
    res.status(404).json({ message: "Song not found." });
    return;
  }

  const updatedSong: Song = {
    ...existingSong,
    title: title.trim(),
    artist: artist.trim(),
    key: key.trim(),
    sections: sanitizedSections
  };

  const updatedSongs = await updateSong(songId, updatedSong);

  res.json({ song: updatedSong, songs: updatedSongs });
});

app.delete("/api/songs/:songId", async (req, res) => {
  const { songId } = req.params;
  const existingSong = await getSongById(songId);

  if (!existingSong) {
    res.status(404).json({ message: "Song not found." });
    return;
  }

  const updatedSongs = await deleteSong(songId);

  res.json({ songs: updatedSongs });
});

if (existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get("/", (_req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Music chart API running on http://localhost:${port}`);
});

function sanitizeSections(sections: Partial<Song>["sections"]): SongSection[] {
  if (!Array.isArray(sections)) {
    return [];
  }

  return sections
    .filter((section) => section && typeof section.name === "string" && Array.isArray(section.chords))
    .map((section, sectionIndex) => ({
      id: section.id?.trim() || `sec-${Date.now()}-${sectionIndex + 1}`,
      name: section.name.trim(),
      chords: section.chords.map((chord) => String(chord).trim()).filter((chord) => chord.length > 0)
    }))
    .filter((section) => section.name.length > 0 && section.chords.length > 0);
}
