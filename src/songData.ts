export type SongSectionType =
  | 'intro'
  | 'verse'
  | 'pre-chorus'
  | 'chorus'
  | 'bridge'
  | 'interlude'
  | 'outro'
  | 'tag'
  | 'instrumental'

export type SongSection = {
  id: string
  type: SongSectionType
  label: string
  chords: string[]
  lyrics: string
  notation?: string
  sameAs?: string
  repeat?: string
}

export type SongMedia = {
  youtubeUrl?: string
  spotifyUrl?: string
}

export type Song = {
  id: string
  title: string
  subtitle?: string
  artist: string
  album?: string
  songwriter?: string
  language: string
  key: string
  songType: string
  sessionPhase: string
  tempo?: string
  meter?: string
  sections: SongSection[]
  media?: SongMedia
}

export const songs: Song[] = [
  {
    id: 'bersyukurlah-live',
    title: 'Bersyukurlah',
    subtitle: 'Live',
    artist: 'JPCC Worship',
    album: 'True to Higher',
    songwriter: 'JPCC Worship',
    language: 'id',
    key: 'G',
    songType: 'Worship',
    sessionPhase: 'SESI 1: PEMBUKAAN',
    tempo: '74 BPM',
    meter: '4/4',
    media: {
      youtubeUrl: 'https://www.youtube.com/watch?v=example',
    },
    sections: [
      {
        id: 'bersyukurlah-intro',
        type: 'intro',
        label: 'INTRO',
        chords: ['G', 'D/F#', 'Em7', 'C'],
        lyrics: '',
        notation: '| 1 • 2 | • • 3 4 |',
      },
      {
        id: 'bersyukurlah-verse-1',
        type: 'verse',
        label: 'VERSE',
        chords: ['G', 'D', 'Em7', 'C'],
        lyrics: 'Tangan Tuhan selalu terbuka bagi kita',
        repeat: '(2x)',
      },
      {
        id: 'bersyukurlah-chorus',
        type: 'chorus',
        label: 'CHORUS',
        chords: ['G', 'D', 'Em7', 'C'],
        lyrics: 'Bersyukurlah kepada Tuhan sebab Ia baik',
        repeat: '(4x)',
      },
      {
        id: 'bersyukurlah-interlude',
        type: 'interlude',
        label: 'INTERLUDE',
        chords: ['G', 'D/F#', 'Em7', 'C'],
        lyrics: '',
        notation: '| 5 • 3 | • • 5 1 |',
      },
    ],
  },
  {
    id: 'way-maker',
    title: 'Way Maker',
    subtitle: 'Original Key',
    artist: 'Sinach',
    album: 'Way Maker',
    songwriter: 'Sinach',
    language: 'en',
    key: 'C',
    songType: 'Worship',
    sessionPhase: 'SESI 2: INTI',
    tempo: '68 BPM',
    meter: '4/4',
    sections: [
      {
        id: 'way-maker-verse',
        type: 'verse',
        label: 'VERSE',
        chords: ['D', 'G', 'A', 'Bm7'],
        lyrics: 'You are here, moving in our midst',
      },
      {
        id: 'way-maker-pre-chorus',
        type: 'pre-chorus',
        label: 'PRE-CHORUS',
        chords: ['G', 'D/F#', 'Em7', 'C'],
        lyrics: 'Even when I don\'t see it, You\'re working',
      },
      {
        id: 'way-maker-chorus',
        type: 'chorus',
        label: 'CHORUS',
        chords: ['G', 'D', 'A', 'Bm7'],
        lyrics: 'Way maker, miracle worker, promise keeper',
        repeat: '(4x)',
      },
    ],
  },
  {
    id: 'great-are-you-lord',
    title: 'Great Are You Lord',
    subtitle: 'Live',
    artist: 'All Sons & Daughters',
    album: 'Live',
    songwriter: 'All Sons & Daughters',
    language: 'en',
    key: 'G',
    songType: 'Praise',
    sessionPhase: 'SESI 3: PENUTUP',
    tempo: '72 BPM',
    meter: '4/4',
    sections: [
      {
        id: 'great-are-you-lord-verse',
        type: 'verse',
        label: 'VERSE',
        chords: ['G', 'D', 'Em7', 'C'],
        lyrics: 'You give life, You are love',
      },
      {
        id: 'great-are-you-lord-bridge',
        type: 'bridge',
        label: 'BRIDGE',
        chords: ['Em7', 'C', 'G', 'D'],
        lyrics: 'All the earth will shout Your praise',
        repeat: '(4x)',
      },
      {
        id: 'great-are-you-lord-outro',
        type: 'outro',
        label: 'OUTRO',
        chords: ['G', 'D', 'C', 'C'],
        lyrics: 'It\'s Your breath in our lungs',
      },
    ],
  },
]