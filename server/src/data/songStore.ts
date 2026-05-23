import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { Song } from "../types";
import { seedSongs } from "./songs";

const storePath = path.resolve(__dirname, "..", "..", "data", "songs.json");

const ensureStoreFile = async (): Promise<void> => {
  const storeDirectory = path.dirname(storePath);

  if (!existsSync(storeDirectory)) {
    await mkdir(storeDirectory, { recursive: true });
  }

  if (!existsSync(storePath)) {
    await writeFile(storePath, JSON.stringify(seedSongs, null, 2), "utf-8");
  }
};

const readSongsFromDisk = async (): Promise<Song[]> => {
  await ensureStoreFile();

  try {
    const raw = await readFile(storePath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      throw new Error("Song store must contain an array.");
    }

    return parsed as Song[];
  } catch {
    await writeFile(storePath, JSON.stringify(seedSongs, null, 2), "utf-8");
    return seedSongs;
  }
};

export const getSongs = async (): Promise<Song[]> => {
  return readSongsFromDisk();
};

export const getSongById = async (songId: string): Promise<Song | undefined> => {
  const songs = await readSongsFromDisk();

  return songs.find((song) => song.id === songId);
};

export const appendSong = async (song: Song): Promise<Song[]> => {
  const songs = await readSongsFromDisk();
  const updatedSongs = [...songs, song];

  await writeFile(storePath, JSON.stringify(updatedSongs, null, 2), "utf-8");

  return updatedSongs;
};

export const updateSong = async (songId: string, nextSong: Song): Promise<Song[]> => {
  const songs = await readSongsFromDisk();
  const songIndex = songs.findIndex((song) => song.id === songId);

  if (songIndex < 0) {
    return songs;
  }

  const updatedSongs = [...songs];
  updatedSongs[songIndex] = nextSong;

  await writeFile(storePath, JSON.stringify(updatedSongs, null, 2), "utf-8");

  return updatedSongs;
};

export const deleteSong = async (songId: string): Promise<Song[]> => {
  const songs = await readSongsFromDisk();
  const updatedSongs = songs.filter((song) => song.id !== songId);

  await writeFile(storePath, JSON.stringify(updatedSongs, null, 2), "utf-8");

  return updatedSongs;
};