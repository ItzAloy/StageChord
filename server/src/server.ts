import cors from "cors";
import express from "express";
import { songs } from "./data/songs";
import { Song, SongSection } from "./types";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/songs", (_req, res) => {
  res.json(songs);
});

app.post("/api/songs", (req, res) => {
  const { title, artist, key, sections } = req.body as Partial<Song>;

  if (!title || !artist || !key || !Array.isArray(sections) || sections.length === 0) {
    res.status(400).json({ message: "Invalid payload. Provide title, artist, key, and sections." });
    return;
  }

  const sanitizedSections: SongSection[] = sections
    .filter((section) => section && typeof section.name === "string" && Array.isArray(section.chords))
    .map((section, sectionIndex) => ({
      id: section.id?.trim() || `sec-${Date.now()}-${sectionIndex + 1}`,
      name: section.name.trim(),
      chords: section.chords
        .map((chord) => String(chord).trim())
        .filter((chord) => chord.length > 0)
    }))
    .filter((section) => section.name.length > 0 && section.chords.length > 0);

  if (sanitizedSections.length === 0) {
    res.status(400).json({ message: "Sections must include a name and at least one chord." });
    return;
  }

  const newSong: Song = {
    id: `song-${Date.now()}`,
    title: title.trim(),
    artist: artist.trim(),
    key: key.trim(),
    sections: sanitizedSections
  };

  songs.push(newSong);
  res.status(201).json(songs);
});

app.listen(port, () => {
  console.log(`Music chart API running on http://localhost:${port}`);
});
