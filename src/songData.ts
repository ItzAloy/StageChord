export type SongSection = {
  label: string
  measures: string[]
  lyrics: string
  repeat?: string
}

export type Song = {
  title: string
  artist: string
  key: string
  tempo: string
  meter: string
  sections: SongSection[]
}

export const songs: Song[] = [
  {
    title: 'Way Maker',
    artist: 'Sinach',
    key: 'C',
    tempo: '68 BPM',
    meter: '4/4',
    sections: [
      {
        label: 'VERSE 1',
        measures: ['D', 'G', 'A', 'Bm7'],
        lyrics: 'You are here, moving in our midst',
        repeat: '(2x)',
      },
      {
        label: 'CHORUS',
        measures: ['G', 'D', 'A', 'Bm7'],
        lyrics: 'Way maker, miracle worker, promise keeper',
        repeat: '(4x)',
      },
      {
        label: 'BRIDGE',
        measures: ['G', 'D/F#', 'Em7', 'Cadd9'],
        lyrics: 'That is who You are, that is who You are',
        repeat: '(2x)',
      },
    ],
  },
  {
    title: 'Great Are You Lord',
    artist: 'All Sons & Daughters',
    key: 'G',
    tempo: '72 BPM',
    meter: '4/4',
    sections: [
      {
        label: 'VERSE 1',
        measures: ['G', 'D', 'Em7', 'C'],
        lyrics: 'You give life, You are love',
      },
      {
        label: 'CHORUS',
        measures: ['G', 'D', 'Em7', 'C'],
        lyrics: 'It\'s Your breath in our lungs',
        repeat: '(2x)',
      },
      {
        label: 'BRIDGE',
        measures: ['Em7', 'C', 'G', 'D'],
        lyrics: 'All the earth will shout Your praise',
        repeat: '(4x)',
      },
    ],
  },
  {
    title: 'Blessed Be Your Name',
    artist: 'Matt Redman',
    key: 'D',
    tempo: '76 BPM',
    meter: '4/4',
    sections: [
      {
        label: 'VERSE 1',
        measures: ['D', 'A', 'Bm7', 'G'],
        lyrics: 'Blessed be Your name in the land that is plentiful',
      },
      {
        label: 'CHORUS',
        measures: ['G', 'D', 'A', 'Bm7'],
        lyrics: 'Blessed be Your glorious name',
        repeat: '(2x)',
      },
      {
        label: 'BRIDGE',
        measures: ['G', 'D', 'A', 'Bm7'],
        lyrics: 'You give and take away, my heart will choose to say',
        repeat: '(4x)',
      },
    ],
  },
]