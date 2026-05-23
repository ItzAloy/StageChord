import type { Setlist, Song } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export interface SongMutationResponse {
  song: Song;
  songs: Song[];
}

export interface SongCollectionResponse {
  songs: Song[];
}

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}/api${path}`, init);

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(errorBody?.message ?? `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const fetchSongs = async (): Promise<Song[]> => {
  return requestJson<Song[]>("/songs");
};

export const createSong = async (payload: Omit<Song, "id">): Promise<SongMutationResponse> => {
  return requestJson<SongMutationResponse>("/songs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
};

export const updateSong = async (songId: string, payload: Omit<Song, "id">): Promise<SongMutationResponse> => {
  return requestJson<SongMutationResponse>(`/songs/${songId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
};

export const deleteSong = async (songId: string): Promise<SongCollectionResponse> => {
  return requestJson<SongCollectionResponse>(`/songs/${songId}`, {
    method: "DELETE"
  });
};

export const fetchSetlists = async (): Promise<Setlist[]> => {
  return requestJson<Setlist[]>("/setlists");
};

export const createSetlist = async (payload: Omit<Setlist, "id">): Promise<Setlist[]> => {
  return requestJson<Setlist[]>("/setlists", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
};

export const updateSetlist = async (setlistId: string, payload: Omit<Setlist, "id">): Promise<Setlist[]> => {
  return requestJson<Setlist[]>(`/setlists/${setlistId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
};
