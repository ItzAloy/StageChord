import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { Setlist } from "../types";
import { seedSetlists } from "./setlists";

const storePath = path.resolve(__dirname, "..", "..", "data", "setlists.json");

const ensureStoreFile = async (): Promise<void> => {
  const storeDirectory = path.dirname(storePath);

  if (!existsSync(storeDirectory)) {
    await mkdir(storeDirectory, { recursive: true });
  }

  if (!existsSync(storePath)) {
    await writeFile(storePath, JSON.stringify(seedSetlists, null, 2), "utf-8");
  }
};

const readSetlistsFromDisk = async (): Promise<Setlist[]> => {
  await ensureStoreFile();

  try {
    const raw = await readFile(storePath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      throw new Error("Setlist store must contain an array.");
    }

    return parsed as Setlist[];
  } catch {
    await writeFile(storePath, JSON.stringify(seedSetlists, null, 2), "utf-8");
    return seedSetlists;
  }
};

export const getSetlists = async (): Promise<Setlist[]> => {
  return readSetlistsFromDisk();
};

export const saveSetlists = async (setlists: Setlist[]): Promise<Setlist[]> => {
  await ensureStoreFile();
  await writeFile(storePath, JSON.stringify(setlists, null, 2), "utf-8");
  return setlists;
};

export const upsertSetlist = async (setlist: Setlist): Promise<Setlist[]> => {
  const setlists = await readSetlistsFromDisk();
  const existingIndex = setlists.findIndex((entry) => entry.id === setlist.id);
  const updatedSetlists = [...setlists];

  if (existingIndex >= 0) {
    updatedSetlists[existingIndex] = setlist;
  } else {
    updatedSetlists.push(setlist);
  }

  await writeFile(storePath, JSON.stringify(updatedSetlists, null, 2), "utf-8");
  return updatedSetlists;
};