import { NOTES } from "./types";
import type { Song } from "./types";

const FLAT_TO_SHARP: Record<string, string> = {
  Cb: "B",
  Db: "C#",
  Eb: "D#",
  Fb: "E",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#"
};

const SPECIAL_EQUIVALENTS: Record<string, string> = {
  "E#": "F",
  "B#": "C"
};

const NASHVILLE_DEGREE_MAP = ["1", "b2", "2", "b3", "3", "4", "#4", "5", "b6", "6", "b7", "7"];

export const normalizeNote = (note: string): string => {
  return FLAT_TO_SHARP[note] ?? SPECIAL_EQUIVALENTS[note] ?? note;
};

const transposeChordPart = (part: string, semitones: number): string => {
  const match = part.match(/^([A-G](?:#|b)?)(.*)$/);

  if (!match) {
    return part;
  }

  const root = normalizeNote(match[1]);
  const suffix = match[2];
  const rootIndex = NOTES.indexOf(root);

  if (rootIndex < 0) {
    return part;
  }

  const targetIndex = (rootIndex + semitones + 12) % 12;
  return `${NOTES[targetIndex]}${suffix}`;
};

export const transposeChord = (chord: string, semitones: number): string => {
  const cleanChord = chord.trim();

  if (/^\d/.test(cleanChord)) {
    return chord;
  }

  const slashSplit = cleanChord.split("/");

  if (slashSplit.length === 1) {
    return transposeChordPart(cleanChord, semitones);
  }

  return slashSplit.map((part) => transposeChordPart(part, semitones)).join("/");
};

export const isValidNoteKey = (key: string): boolean => NOTES.includes(normalizeNote(key));

const getSemitoneShift = (fromKey: string, toKey: string): number => {
  const fromIndex = NOTES.indexOf(normalizeNote(fromKey));
  const toIndex = NOTES.indexOf(normalizeNote(toKey));

  if (fromIndex < 0 || toIndex < 0) {
    return 0;
  }

  return (toIndex - fromIndex + 12) % 12;
};

const toNashvilleChordPart = (part: string, referenceKey: string): string => {
  const match = part.match(/^([A-G](?:#|b)?)(.*)$/);

  if (!match) {
    return part;
  }

  const root = normalizeNote(match[1]);
  const suffix = match[2];
  const rootIndex = NOTES.indexOf(root);
  const keyIndex = NOTES.indexOf(normalizeNote(referenceKey));

  if (rootIndex < 0 || keyIndex < 0) {
    return part;
  }

  const interval = (rootIndex - keyIndex + 12) % 12;
  const degree = NASHVILLE_DEGREE_MAP[interval];

  return `${degree}${suffix}`;
};

export const toNashvilleChord = (chord: string, referenceKey: string): string => {
  const cleanChord = chord.trim();

  if (/^\d/.test(cleanChord)) {
    return chord;
  }

  const slashSplit = cleanChord.split("/");

  if (slashSplit.length === 1) {
    return toNashvilleChordPart(cleanChord, referenceKey);
  }

  return slashSplit.map((part) => toNashvilleChordPart(part, referenceKey)).join("/");
};

export const transposeSong = (song: Song, targetKey: string): Song => {
  const semitoneShift = getSemitoneShift(song.key, targetKey);

  return {
    ...song,
    sections: song.sections.map((section) => ({
      ...section,
      chords: section.chords.map((chord) => transposeChord(chord, semitoneShift))
    }))
  };
};

export const convertSongToNashville = (song: Song, referenceKey: string): Song => {
  return {
    ...song,
    sections: song.sections.map((section) => ({
      ...section,
      chords: section.chords.map((chord) => toNashvilleChord(chord, referenceKey))
    }))
  };
};
