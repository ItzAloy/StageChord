import { useEffect, useMemo, useState, type FormEvent, type ChangeEvent } from 'react'
import DashboardLayout from './DashboardLayout'
import './App.css'
import { songs as defaultSongs, type Song, type SongSection, type SongSectionType } from './songData'

const storageKey = 'stagechord-song-library-v2'

const keyOptions = ['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab']

const sectionTypeOptions: Array<{ label: string; value: SongSectionType }> = [
  { label: 'Intro', value: 'intro' },
  { label: 'Verse', value: 'verse' },
  { label: 'Pre-Chorus', value: 'pre-chorus' },
  { label: 'Chorus', value: 'chorus' },
  { label: 'Bridge', value: 'bridge' },
  { label: 'Interlude', value: 'interlude' },
  { label: 'Instrumental', value: 'instrumental' },
  { label: 'Tag', value: 'tag' },
  { label: 'Outro', value: 'outro' },
]

function getSectionTypeLabel(type: SongSectionType) {
  return sectionTypeOptions.find((option) => option.value === type)?.label ?? type.toUpperCase()
}

const songTypeOptions = [
  'Upbeat (Praise)',
  'Slowbeat (Worship)',
  'Offering',
  'Christmas',
  'For the nation',
  'Passover',
  'Kids',
  'Evangelism',
  'Healing',
  'Hymn',
  'Unknown',
  'Salvation',
]

const noteValues: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
}

const sharpNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const flatNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const chordPattern = /^([A-G])([#b]?)(.*)$/

type ComposerSectionDraft = {
  id: string
  type: SongSectionType
  label: string
  content: string
  sameAs: string
  repeat: string
}

type SongDraft = {
  title: string
  subtitle: string
  artist: string
  album: string
  songwriter: string
  language: string
  key: string
  songType: string
  youtubeUrl: string
  spotifyUrl: string
  sections: ComposerSectionDraft[]
}

const createDraftSection = (type: SongSectionType = 'verse', label = 'VERSE'): ComposerSectionDraft => ({
  id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  type,
  label,
  content: 'C   G   Am   F\nLyrics here',
  sameAs: '',
  repeat: '',
})

const defaultDraft: SongDraft = {
  title: '',
  subtitle: '',
  artist: '',
  album: '',
  songwriter: '',
  language: 'id',
  key: 'C',
  songType: 'Worship',
  youtubeUrl: '',
  spotifyUrl: '',
  sections: [createDraftSection()],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function prefersFlats(note: string) {
  return note.includes('b') || note === 'F'
}

function parseChordRoot(chordPart: string) {
  const match = chordPart.trim().match(chordPattern)

  if (!match) {
    return null
  }

  return {
    root: `${match[1]}${match[2]}`,
    suffix: match[3],
  }
}

function getMajorScaleRoots(key: string, preferFlats: boolean) {
  const keyValue = noteValues[key]

  if (keyValue === undefined) {
    return []
  }

  return [0, 2, 4, 5, 7, 9, 11].map((interval) => {
    const normalized = (keyValue + interval) % 12
    return (preferFlats ? flatNames : sharpNames)[normalized]
  })
}

function findScaleDegree(note: string, scaleRoots: string[]) {
  const noteValue = noteValues[note]

  if (noteValue === undefined) {
    return -1
  }

  const index = scaleRoots.findIndex((root) => noteValues[root] === noteValue)
  return index >= 0 ? index + 1 : -1
}

function chordToNashville(chord: string, key: string) {
  if (!chord || chord === 'N.C.') {
    return chord
  }

  const preferFlats = prefersFlats(key)
  const scaleRoots = getMajorScaleRoots(key, preferFlats)
  const [main, bass] = chord.split('/')
  const parsed = parseChordRoot(main)

  if (!parsed) {
    return chord
  }

  const degree = findScaleDegree(parsed.root, scaleRoots)

  if (degree < 0) {
    return chord
  }

  let result = `${degree}${parsed.suffix}`

  if (bass) {
    const bassParsed = parseChordRoot(bass)

    if (bassParsed) {
      const bassDegree = findScaleDegree(bassParsed.root, scaleRoots)

      if (bassDegree >= 0) {
        result = `${degree}${parsed.suffix}/${bassDegree}${bassParsed.suffix}`
      } else {
        result = `${degree}${parsed.suffix}/${bass}${bassParsed.suffix}`
      }
    }
  }

  return result
}

function normalizeChordTokens(chords: string[]) {
  return chords
    .flatMap((chord) => (chord.includes(',') ? chord.split(/[,|\s]+/) : [chord]))
    .map((chord) => chord.trim())
    .filter(Boolean)
}

function splitSectionContent(content: string) {
  const lines = content.split(/\r?\n/);
  const chords: string[] = [];

  lines.forEach(line => {
    const matched = line.match(/([A-G][#b]?[^\s]*)/g);
    if (matched) {
      matched.forEach(c => chords.push(c.trim()));
    }
  });

  return {
    chords: chords.length > 0 ? chords : ['C'],
    lyrics: content
  };
}

function transposeNote(note: string, shift: number, preferFlats: boolean) {
  const noteValue = noteValues[note]

  if (noteValue === undefined) {
    return note
  }

  const normalized = (noteValue + shift + 12 * 4) % 12
  return (preferFlats ? flatNames : sharpNames)[normalized]
}

function transposeChord(chord: string, shift: number, preferFlats: boolean) {
  if (!chord || chord === 'N.C.') {
    return chord
  }

  return chord
    .split('/')
    .map((part) => {
      const match = part.match(chordPattern)

      if (!match) {
        return part
      }

      const [, letter, accidental, suffix] = match
      return `${transposeNote(`${letter}${accidental}`, shift, preferFlats)}${suffix}`
    })
    .join('/')
}

function transposeChordLineWithSpaces(line: string, shift: number, preferFlats: boolean, toNashvilleKey?: string) {
  const regex = /([A-G][#b]?[^\s]*)/g;
  let match;
  let result = "";
  let lastIndex = 0;

  while ((match = regex.exec(line)) !== null) {
    const chord = match[1];
    const index = match.index;

    result += line.substring(lastIndex, index);

    let newChord = transposeChord(chord, shift, preferFlats);
    if (toNashvilleKey) {
      newChord = chordToNashville(newChord, toNashvilleKey);
    }

    result += newChord;
    lastIndex = regex.lastIndex;
  }

  result += line.substring(lastIndex);
  return result;
}

function getSemitoneDistance(from: string, to: string) {
  return (noteValues[to] - noteValues[from] + 12) % 12
}

function normalizeSongSection(value: unknown): SongSection | null {
  if (!isRecord(value)) {
    return null
  }

  const rawLabel = typeof value.label === 'string' ? value.label.trim() : ''
  const label = rawLabel || 'SECTION'
  const typeValue = typeof value.type === 'string' ? value.type.toLowerCase() : 'verse'
  const sectionType = sectionTypeOptions.some((option) => option.value === typeValue)
    ? (typeValue as SongSectionType)
    : 'verse'
  const rawChords = Array.isArray(value.chords)
    ? value.chords
    : Array.isArray(value.measures)
      ? value.measures
      : typeof value.chords === 'string'
        ? value.chords.split(/[,|\n]+/)
        : typeof value.measures === 'string'
          ? value.measures.split(/[,|\n]+/)
          : []
  const chords = normalizeChordTokens(
    rawChords.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean),
  )
  const lyrics = typeof value.lyrics === 'string' ? value.lyrics.trim() : ''
  const notation = typeof value.notation === 'string' ? value.notation.trim() : ''
  const repeat = typeof value.repeat === 'string' && value.repeat.trim() ? value.repeat.trim() : undefined

  if (chords.length === 0 && !lyrics && !notation) {
    return null
  }

  return {
    id: typeof value.id === 'string' && value.id.trim() ? value.id.trim() : `${label}-${Date.now()}`,
    type: sectionType,
    label,
    lyrics,
    sameAs: typeof value.sameAs === 'string' && value.sameAs.trim() ? value.sameAs.trim() : undefined,
    repeat,
  }
}

function normalizeSong(value: unknown): Song | null {
  if (!isRecord(value)) {
    return null
  }

  const title = typeof value.title === 'string' ? value.title.trim() : ''
  const artist = typeof value.artist === 'string' ? value.artist.trim() : ''
  const key = typeof value.key === 'string' ? value.key.trim() : ''
  const sections = Array.isArray(value.sections)
    ? value.sections.map((section) => normalizeSongSection(section)).filter((section): section is SongSection => section !== null)
    : []

  if (!title || !artist || !key || sections.length === 0) {
    return null
  }

  return {
    id: typeof value.id === 'string' && value.id.trim() ? value.id.trim() : `${title}-${Date.now()}`,
    title,
    subtitle: typeof value.subtitle === 'string' ? value.subtitle.trim() : undefined,
    artist,
    album: typeof value.album === 'string' ? value.album.trim() : undefined,
    songwriter: typeof value.songwriter === 'string' ? value.songwriter.trim() : undefined,
    language: typeof value.language === 'string' && value.language.trim() ? value.language.trim() : 'id',
    key,
    songType: typeof value.songType === 'string' && value.songType.trim() ? value.songType.trim() : 'Worship',
    sections,
    media: isRecord(value.media)
      ? {
        youtubeUrl: typeof value.media.youtubeUrl === 'string' ? value.media.youtubeUrl.trim() : undefined,
        spotifyUrl: typeof value.media.spotifyUrl === 'string' ? value.media.spotifyUrl.trim() : undefined,
      }
      : undefined,
  }
}

function loadSongLibrary() {
  if (typeof window === 'undefined') {
    return defaultSongs
  }

  const raw = window.localStorage.getItem(storageKey)

  if (!raw) {
    return defaultSongs
  }

  try {
    const parsed = JSON.parse(raw) as unknown

    if (Array.isArray(parsed)) {
      const normalized = parsed.map((song) => normalizeSong(song)).filter((song): song is Song => song !== null)

      if (normalized.length > 0) {
        return normalized
      }
    }
  } catch {
    return defaultSongs
  }

  return defaultSongs
}

function createSongFromDraft(draft: SongDraft): Song {
  return {
    id: `${draft.title.trim() || 'new-song'}-${Date.now()}`,
    title: draft.title.trim() || 'Untitled Song',
    subtitle: draft.subtitle.trim() || undefined,
    artist: draft.artist.trim() || 'Unknown Artist',
    album: draft.album.trim() || undefined,
    songwriter: draft.songwriter.trim() || undefined,
    language: draft.language.trim() || 'id',
    key: draft.key.trim() || 'C',
    songType: draft.songType.trim() || 'Worship',
    sections: draft.sections.map((section) => {
      const parsedContent = splitSectionContent(section.content)
      return {
        id: section.id,
        type: section.type,
        label: section.label.trim() || section.type.toUpperCase(),
        chords: normalizeChordTokens(parsedContent.chords),
        lyrics: parsedContent.lyrics,
        sameAs: section.sameAs.trim() || undefined,
        repeat: section.repeat.trim() || undefined,
      }
    }),
    media: {
      youtubeUrl: draft.youtubeUrl.trim() || undefined,
      spotifyUrl: draft.spotifyUrl.trim() || undefined,
    },
  }
}

function buildDraftFromSong(song: Song): SongDraft {
  return {
    title: song.title,
    subtitle: song.subtitle ?? '',
    artist: song.artist,
    album: song.album ?? '',
    songwriter: song.songwriter ?? '',
    language: song.language,
    key: song.key,
    songType: song.songType,
    youtubeUrl: song.media?.youtubeUrl ?? '',
    spotifyUrl: song.media?.spotifyUrl ?? '',
    sections:
      song.sections.length > 0
        ? song.sections.map((section) => ({
          id: section.id,
          type: section.type,
          label: section.label,
          content: [section.lyrics].filter(Boolean).join('\n'),
          sameAs: section.sameAs ?? '',
          repeat: section.repeat ?? '',
        }))
        : [createDraftSection()],
  }
}

function App() {
  const [library, setLibrary] = useState<Song[]>(() => loadSongLibrary())
  const [selectedSongIndex, setSelectedSongIndex] = useState(0)
  const [selectedKey, setSelectedKey] = useState(() => loadSongLibrary()[0]?.key ?? 'C')
  const [showLyrics, setShowLyrics] = useState(true)
  const [showNotation, setShowNotation] = useState(false) // Set default ke Chord abjad dulu biar pas render awal pas
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(0.6) // 1.0 adalah ukuran normal (100%)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerMode, setComposerMode] = useState<'add' | 'edit'>('add')
  const [composerTargetSongId, setComposerTargetSongId] = useState<string | null>(null)
  const [draft, setDraft] = useState<SongDraft>(defaultDraft)
  const [searchQuery, setSearchQuery] = useState('')
  const [sessionPlaylistIds, setSessionPlaylistIds] = useState<string[]>([])
  const [draggedSessionSongId, setDraggedSessionSongId] = useState<string | null>(null)

  const safeSongIndex = Math.min(selectedSongIndex, Math.max(0, library.length - 1))
  const selectedSong = library[safeSongIndex] ?? library[0] ?? defaultSongs[0]

  const displaySong = useMemo(() => {
    if (composerOpen && composerMode === 'edit' && composerTargetSongId) {
      const preview = createSongFromDraft(draft)

      return { ...preview, id: composerTargetSongId }
    }

    return selectedSong
  }, [composerMode, composerOpen, composerTargetSongId, draft, selectedSong])

  const transposeAmount = useMemo(
    () => getSemitoneDistance(displaySong.key, selectedKey),
    [displaySong.key, selectedKey],
  )

  const renderedSections = useMemo(
    () =>
      displaySong.sections.map((section) => {
        const lines = section.lyrics.split(/\r?\n/);

        const processedLines = lines.map((line) => {
          const isChordLine = line.trim() !== "" && !/[a-z]{3,}/i.test(line.replace(/([A-G][#b]?[^\s]*)/g, ""));

          if (isChordLine) {
            const preferFlats = prefersFlats(selectedKey);
            const chordLine = transposeChordLineWithSpaces(line, transposeAmount, preferFlats);
            const numberLine = transposeChordLineWithSpaces(line, transposeAmount, preferFlats, selectedKey);

            return {
              isChord: true,
              text: showNotation ? numberLine : chordLine
            };
          }

          return {
            isChord: false,
            text: line
          };
        });

        return {
          ...section,
          processedLines
        };
      }),
    [displaySong.sections, selectedKey, transposeAmount, showNotation],
  )

  const visibleSongs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return library
    }

    return library.filter((song) => {
      const haystack = [
        song.title,
        song.subtitle ?? '',
        song.artist,
        song.album ?? '',
        song.songwriter ?? '',
        song.language,
        song.key,
        song.songType,
        ...song.sections.flatMap((section) => [section.label, section.lyrics, section.repeat ?? '']),
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [library, searchQuery])

  const sessionPlaylistSongs = useMemo(
    () => sessionPlaylistIds.map((songId) => library.find((song) => song.id === songId)).filter((song): song is Song => song !== undefined),
    [library, sessionPlaylistIds],
  )

  const liveSetSongs = sessionPlaylistSongs
  const navigationSongs = liveSetSongs.length > 0 ? liveSetSongs : library
  const navigationIndex = useMemo(() => {
    const index = navigationSongs.findIndex((song) => song.id === selectedSong.id)

    return index >= 0 ? index : 0
  }, [navigationSongs, selectedSong.id])

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(library))
  }, [library])

  function handleSongSelect(index: number) {
    setSelectedSongIndex(index)
    setSelectedKey(library[index]?.key ?? 'C')

    if (!(composerOpen && composerMode === 'edit')) {
      setDraft(buildDraftFromSong(library[index] ?? selectedSong))
    }
  }

  function openAddComposer() {
    setComposerMode('add')
    setComposerTargetSongId(null)
    setDraft(defaultDraft)
    setComposerOpen(true)
  }

  function openEditComposer() {
    setComposerMode('edit')
    setComposerTargetSongId(selectedSong.id)
    setDraft(buildDraftFromSong(selectedSong))
    setComposerOpen(true)
  }

  function closeComposer() {
    setComposerOpen(false)
  }

  function addSongToSessionPlaylist(songId: string) {
    setSessionPlaylistIds((current) => (current.includes(songId) ? current : [...current, songId]))
  }

  function clearSessionPlaylist() {
    setSessionPlaylistIds([])
  }

  function handleSessionSongSelect(songId: string) {
    const index = library.findIndex((song) => song.id === songId)

    if (index >= 0) {
      handleSongSelect(index)
    }
  }

  function reorderSessionPlaylist(activeSongId: string, targetSongId: string) {
    if (activeSongId === targetSongId) {
      return
    }

    setSessionPlaylistIds((current) => {
      const fromIndex = current.indexOf(activeSongId)
      const toIndex = current.indexOf(targetSongId)

      if (fromIndex < 0 || toIndex < 0) {
        return current
      }

      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  function handleNavigation(direction: -1 | 1) {
    const nextIndex = (navigationIndex + direction + navigationSongs.length) % navigationSongs.length
    const nextSong = navigationSongs[nextIndex]
    const libraryIndex = library.findIndex((song) => song.id === nextSong.id)

    if (libraryIndex >= 0) {
      handleSongSelect(libraryIndex)
    }
  }

  function addComposerSection() {
    setDraft((current) => ({
      ...current,
      sections: [...current.sections, createDraftSection()],
    }))
  }

  function updateComposerSection(index: number, field: keyof ComposerSectionDraft, value: string) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) =>
        sectionIndex === index
          ? {
            ...section,
            [field]: value,
            ...(field === 'type' && typeof value === 'string' ? { label: getSectionTypeLabel(value as SongSectionType) } : {}),
          }
          : section,
      ),
    }))
  }

  function applySameAsSection(index: number) {
    setDraft((current) => {
      const section = current.sections[index]
      const targetLabel = section.sameAs.trim()

      if (!targetLabel) {
        return current
      }

      const normalizedTarget = targetLabel.toLowerCase()
      const source = current.sections.find(
        (candidate, candidateIndex) =>
          candidateIndex !== index &&
          (candidate.label.trim().toLowerCase() === normalizedTarget ||
            getSectionTypeLabel(candidate.type).toLowerCase() === normalizedTarget ||
            candidate.type.toLowerCase() === normalizedTarget),
      )

      if (!source) {
        return current
      }

      return {
        ...current,
        sections: current.sections.map((candidate, candidateIndex) =>
          candidateIndex === index
            ? {
              ...candidate,
              content: source.content,
            }
            : candidate,
        ),
      }
    })
  }

  function removeComposerSection(index: number) {
    setDraft((current) => {
      if (current.sections.length === 1) {
        return current
      }

      return {
        ...current,
        sections: current.sections.filter((_, sectionIndex) => sectionIndex !== index),
      }
    })
  }

  function handleComposerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextSong = createSongFromDraft(draft)

    if (composerMode === 'edit') {
      const targetSongId = composerTargetSongId ?? selectedSong.id

      setLibrary((current) => {
        return current.map((song) => (song.id === targetSongId ? { ...nextSong, id: targetSongId } : song))
      })
      setDraft(buildDraftFromSong({ ...nextSong, id: targetSongId }))
      setSelectedKey(nextSong.key)
      closeComposer()
      setComposerTargetSongId(null)
      return
    }

    setLibrary((current) => [nextSong, ...current])
    setSelectedSongIndex(0)
    setSelectedKey(nextSong.key)
    closeComposer()
    setDraft(defaultDraft)
    setComposerTargetSongId(null)
  }

  // === DIDEKLARASIKAN & DIHUBUNGKAN KE SIDEBAR UTK MENGHINDARI WARN TS ===
  async function handleImportLibrary(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed)) throw new Error()
      const imported = parsed.map(normalizeSong).filter((s): s is Song => s !== null)
      if (imported.length === 0) throw new Error()
      setLibrary(imported)
      setSelectedSongIndex(0)
      setSelectedKey(imported[0].key)
      closeComposer()
    } catch { window.alert('File JSON tidak valid.') }
  }

  function handleExportLibrary() {
    const blob = new Blob([JSON.stringify(library, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'stagechord-library.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleExportSongDataTs() {
    const serializedSongs = library
      .map((song) => {
        const lines = [
          '  {',
          `    id: ${JSON.stringify(song.id)},`,
          `    title: ${JSON.stringify(song.title)},`,
          song.subtitle ? `    subtitle: ${JSON.stringify(song.subtitle)},` : null,
          `    artist: ${JSON.stringify(song.artist)},`,
          song.album ? `    album: ${JSON.stringify(song.album)},` : null,
          song.songwriter ? `    songwriter: ${JSON.stringify(song.songwriter)},` : null,
          `    language: ${JSON.stringify(song.language)},`,
          `    key: ${JSON.stringify(song.key)},`,
          `    songType: ${JSON.stringify(song.songType)},`,
          '    sections: [',
          ...song.sections.flatMap((section) => [
            '      {',
            `        id: ${JSON.stringify(section.id)},`,
            `        type: ${JSON.stringify(section.type)},`,
            `        label: ${JSON.stringify(section.label)},`,
            `        lyrics: ${JSON.stringify(section.lyrics)},`,
            section.sameAs ? `        sameAs: ${JSON.stringify(section.sameAs)},` : null,
            section.repeat ? `        repeat: ${JSON.stringify(section.repeat)},` : null,
            '      },',
          ]),
          '    ],',
          '  },',
        ]

        return lines.filter((line): line is string => line !== null).join('\n')
      })
      .join('\n')

    const fileContent = `import { type Song } from './songData'\n\nexport const songs: Song[] = [\n${serializedSongs}\n]\n`
    const blob = new Blob([fileContent], { type: 'text/typescript' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'songData.ts'
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleResetLibrary() {
    if (!window.confirm('Reset library ke data default?')) return
    window.localStorage.removeItem(storageKey)
    setLibrary(defaultSongs)
    setSelectedSongIndex(0)
    setSelectedKey(defaultSongs[0]?.key ?? 'C')
  }

  const sidebar = (
    <div className="sidebar-shell">
      <div className="sidebar-top">
        <div>
          <p className="eyebrow">Stage Display</p>
          <h2>StageChord</h2>
        </div>
      </div>

      <section className="sidebar-panel">
        <div className="panel-heading">
          <span>Song Bank</span>
          <div className="panel-heading__actions">
            <strong>{library.length}</strong>
            <button type="button" className="sidebar-icon-button" onClick={openAddComposer} aria-label="Add song to bank">
              +
            </button>
          </div>
        </div>
        <label className="search-field">
          <span className="sr-only">Search library</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search title, artist, key..."
          />
        </label>

        <div className="song-list">
          {visibleSongs.map((song) => {
            const absoluteIndex = library.findIndex((item) => item.id === song.id)
            const active = absoluteIndex === safeSongIndex

            return (
              <div key={song.id} className={active ? 'song-row song-row--active' : 'song-row'}>
                <button type="button" className="song-row__main" onClick={() => handleSongSelect(absoluteIndex)}>
                  <span className="song-row__meta">
                    {song.title} · Key {song.key}
                  </span>
                  <span className="song-row__subtle">{song.artist}</span>
                </button>
                <button type="button" className="song-row__action" onClick={() => addSongToSessionPlaylist(song.id)} aria-label={`Add ${song.title} to live set`}>
                  +
                </button>
              </div>
            )
          })}

          {visibleSongs.length === 0 ? <div className="empty-state">No songs match the current search.</div> : null}
        </div>
      </section>

      <section className="sidebar-panel sidebar-panel--playlist">
        <div className="panel-heading">
          <span>Live Set</span>
          <div className="panel-heading__actions">
            <strong>{sessionPlaylistSongs.length}</strong>
            {sessionPlaylistSongs.length > 0 ? (
              <button type="button" className="playlist-clear-button" onClick={clearSessionPlaylist}>
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <div className="playlist-groups">
          {sessionPlaylistSongs.length > 0 ? (
            sessionPlaylistSongs.map((song) => {
              const active = library[safeSongIndex]?.id === song.id

              return (
                <button
                  key={song.id}
                  type="button"
                  className={active ? 'playlist-row playlist-row--active' : 'playlist-row'}
                  onClick={() => handleSessionSongSelect(song.id)}
                  draggable
                  onDragStart={() => setDraggedSessionSongId(song.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDragEnter={() => {
                    if (draggedSessionSongId && draggedSessionSongId !== song.id) {
                      reorderSessionPlaylist(draggedSessionSongId, song.id)
                    }
                  }}
                  onDrop={() => {
                    setDraggedSessionSongId(null)
                  }}
                  onDragEnd={() => setDraggedSessionSongId(null)}
                >
                  <span>{song.title}</span>
                  <small>{song.artist}</small>
                </button>
              )
            })
          ) : (
            <div className="empty-state">Tambah lagu dari Song Bank untuk sesi ini.</div>
          )}
        </div>
      </section>

      {/* PANEL MANAGEMENT DATA */}
      <section className="sidebar-panel sidebar-management-panel" style={{ marginTop: 'auto', padding: '15px', borderTop: '1px solid #333' }}>
        <div style={{ display: 'grid', gap: '8px' }}>
          <button 
            type="button" 
            onClick={handleExportSongDataTs} 
            style={{ 
              padding: '8px', 
              background: '#0284c7', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer' 
            }}
          >
            Export songData.ts
          </button>
          <button 
            type="button" 
            onClick={handleExportLibrary} 
            style={{ 
              padding: '6px', 
              background: '#222', 
              color: '#ccc', 
              border: '1px solid #444', 
              borderRadius: '4px',
              cursor: 'pointer' 
            }}
          >
            Backup (.json)
          </button>
          <label 
            style={{ 
              display: 'block', 
              textAlign: 'center', 
              background: '#222', 
              padding: '6px', 
              color: '#ccc', 
              border: '1px solid #444', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Import Backup
            <input type="file" accept=".json" onChange={handleImportLibrary} style={{ display: 'none' }} />
          </label>
          <button 
            type="button" 
            onClick={handleResetLibrary} 
            style={{ 
              padding: '6px', 
              background: '#3b1111', 
              color: '#ff8888', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '5px'
            }}
          >
            Reset Default
          </button>
        </div>
      </section>
    </div>
  )
  
const header = (
    <div className="header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', minHeight: '50px', borderBottom: '1px solid #222', gap: '12px' }}>
      
      {/* Kolom Kiri: Menu & Edit yang ditumpuk vertikal, lalu Informasi Lagu */}
      <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Kontainer Tombol Menu dan Edit (Ditumpuk Vertikal) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button 
            type="button" 
            className="icon-button header-menu-button" 
            onClick={() => setSidebarOpen((current) => !current)} 
            aria-label="Toggle sidebar"
            style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: '14px', cursor: 'pointer' }}
          >
            ☰
          </button>
          <button 
            type="button" 
            className="icon-button header-edit-button" 
            onClick={openEditComposer} 
            aria-label="Edit current song"
            style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: '12px', cursor: 'pointer' }}
          >
            ✎
          </button>
        </div>

        {/* Info Lagu (Diperkecil gap-nya) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <p className="eyebrow" style={{ margin: 0, fontSize: '10px', textTransform: 'uppercase', color: '#888', letterSpacing: '0.5px', lineHeight: '1' }}>Now Showing</p>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold', lineHeight: '1.2', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {displaySong.title}
            {displaySong.subtitle ? <span style={{ fontSize: '1rem', color: '#666', fontWeight: 'normal' }}> - {displaySong.subtitle}</span> : null}
          </h1>
          <p className="header-subtitle" style={{ margin: 0, fontSize: '0.9rem', color: '#aaa', lineHeight: '1' }}>
            {displaySong.artist}
          </p>
        </div>
      </div>

      {/* Kolom Tengah: Tampilan Key Saat Ini (Dibuat super compact) */}
      <div className="header-key" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', padding: '2px 10px', background: '#111', borderRadius: '4px', border: '1px solid #222', minWidth: '45px' }}>
        <span style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', lineHeight: '1' }}>Key</span>
        <strong style={{ fontSize: '1.1rem', color: '#38bdf8', lineHeight: '1' }}>{selectedKey}</strong>
      </div>

      {/* Kolom Kanan: Selector Key Cepat & Toggles */}
      <div className="header-meta" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Quick Keys (Dirampingkan paddingnya) */}
        <div className="quick-keys" aria-label="Quick key selector" style={{ display: 'flex', gap: '3px' }}>
          {keyOptions.map((key) => (
            <button
              key={key}
              type="button"
              className={key === selectedKey ? 'quick-key quick-key--active' : 'quick-key'}
              onClick={() => setSelectedKey(key)}
              aria-pressed={key === selectedKey}
              style={{ padding: '3px 6px', fontSize: '11px', borderRadius: '3px', cursor: 'pointer' }}
            >
              {key}
            </button>
          ))}
        </div>

        {/* View & Size Toggles */}
        <div className="view-toggles" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Font Size Adjuster (Lebih compact) */}
          <div className="font-size-adjuster" style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#1a1a1a', padding: '1px 6px', borderRadius: '15px', border: '1px solid #333' }}>
            <span style={{ fontSize: '9px', color: '#666', marginRight: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>Size</span>
            <button 
              type="button" 
              onClick={() => setFontSizeMultiplier(prev => Math.max(0.6, prev - 0.1))} 
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', padding: '0 4px' }}
            >
              -
            </button>
            <span style={{ color: '#38bdf8', fontWeight: 'bold', minWidth: '30px', textAlign: 'center', fontSize: '11px' }}>
              {Math.round(fontSizeMultiplier * 100)}%
            </span>
            <button 
              type="button" 
              onClick={() => setFontSizeMultiplier(prev => Math.min(2.0, prev + 0.1))} 
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', padding: '0 4px' }}
            >
              +
            </button>
          </div>

          <button 
            type="button" 
            className={showLyrics ? 'toggle-pill toggle-pill--active' : 'toggle-pill'} 
            onClick={() => setShowLyrics((current) => !current)}
            style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '15px' }}
          >
            Show Lyrics
          </button>
          <button 
            type="button" 
            className={showNotation ? 'toggle-pill toggle-pill--active' : 'toggle-pill'} 
            onClick={() => setShowNotation((current) => !current)}
            style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '15px' }}
          >
            Number Notation
          </button>
        </div>
      </div>

    </div>
  )

  const footer = (
    <div className="footer-bar">
      <button type="button" className="ghost" onClick={() => handleNavigation(-1)}>
        Previous
      </button>
      <span className="footer-counter">
        {navigationIndex + 1} / {navigationSongs.length}
        {liveSetSongs.length > 0 ? <small className="footer-mode">Live Set</small> : null}
      </span>
      <button type="button" className="ghost" onClick={() => handleNavigation(1)}>
        Next
      </button>
    </div>
  )

  const drawer = composerOpen ? (
    <div className="composer-backdrop" role="presentation" onClick={closeComposer}>
      <form className="composer-drawer" onSubmit={handleComposerSubmit} onClick={(event) => event.stopPropagation()}>
      <div className="panel-heading panel-heading--stacked">
        <span>{composerMode === 'edit' ? 'Edit Lagu' : 'Tambah Lagu'}</span>
        <strong>{composerMode === 'edit' ? 'Perubahan tersimpan otomatis setelah Save' : 'Masuk ke Song Bank'}</strong>
      </div>

      <section className="composer-section-block">
        <h3>Song Information</h3>
        <div className="composer-grid">
          <label>
            Song Title
            <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label>
            Language
            <select value={draft.language} onChange={(event) => setDraft((current) => ({ ...current, language: event.target.value }))}>
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            Artist
            <input value={draft.artist} onChange={(event) => setDraft((current) => ({ ...current, artist: event.target.value }))} />
          </label>
          <label>
            Album
            <input value={draft.album} onChange={(event) => setDraft((current) => ({ ...current, album: event.target.value }))} />
          </label>
          <label>
            Songwriter
            <input value={draft.songwriter} onChange={(event) => setDraft((current) => ({ ...current, songwriter: event.target.value }))} />
          </label>
        </div>
      </section>

      <section className="composer-section-block">
        <h3>Song Attributes</h3>
        <div className="composer-grid composer-grid--three">
          <label>
            Default Key
            <input
              value={draft.key}
              onChange={(event) => {
                const key = event.target.value
                setDraft((current) => ({ ...current, key }))
                if (composerMode === 'edit') {
                  setSelectedKey(key)
                }
              }}
            />
          </label>
          <label>
            Song Type
            <select value={draft.songType} onChange={(event) => setDraft((current) => ({ ...current, songType: event.target.value }))}>
              {songTypeOptions.map((songType) => (
                <option key={songType} value={songType}>
                  {songType}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="composer-section-block">
        <div className="section-row section-row--spread">
          <h3>Dynamic Song Contents Builder</h3>
          <button type="button" className="small-button" onClick={addComposerSection}>
            + Add Section
          </button>
        </div>

        <div className="composer-sections">
          {draft.sections.map((section, index) => (
            <fieldset key={section.id} className="composer-item">
              <legend>
                <div className="section-row section-row--spread composer-section-legend">
                  <div className="composer-section-legend__left">
                    <select value={section.type} onChange={(event) => updateComposerSection(index, 'type', event.target.value)}>
                      {sectionTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <label className="composer-legend-repeat">
                      Repeat this part
                      <div className="composer-repeat-row">
                        <input
                          value={section.repeat}
                          onChange={(event) => updateComposerSection(index, 'repeat', event.target.value)}
                          placeholder="e.g. 2"
                        />
                        <button type="button" className="composer-repeat-clear" onClick={() => updateComposerSection(index, 'repeat', '')}>
                          X
                        </button>
                      </div>
                    </label>
                  </div>
                  <button type="button" className="small-button small-button--danger" onClick={() => removeComposerSection(index)}>
                    Remove
                  </button>
                </div>
              </legend>

              <div className="composer-part-grid">
                <div className="composer-part-left">
                  <label>
                    Chord mapping + Lyrics
                    <textarea
                      rows={6}
                      value={section.content}
                      onChange={(event) => updateComposerSection(index, 'content', event.target.value)}
                      placeholder={'C   G   Am   F\nLyrics here'}
                    />
                  </label>

                  <label className="composer-more-option">
                    Make this part the same as
                    <div className="composer-inline-field">
                      <input
                        value={section.sameAs}
                        onChange={(event) => updateComposerSection(index, 'sameAs', event.target.value)}
                        placeholder='e.g. "Intro", "Verse 1"'
                      />
                      <button type="button" className="small-button" onClick={() => applySameAsSection(index)}>
                        confirm
                      </button>
                    </div>
                  </label>
                </div>

              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section className="composer-section-block">
        <h3>Song Media Embed Links</h3>
        <div className="composer-grid">
          <label>
            YouTube URL
            <input value={draft.youtubeUrl} onChange={(event) => setDraft((current) => ({ ...current, youtubeUrl: event.target.value }))} />
          </label>
          <label>
            Spotify Song URL
            <input value={draft.spotifyUrl} onChange={(event) => setDraft((current) => ({ ...current, spotifyUrl: event.target.value }))} />
          </label>
        </div>
      </section>

      <button type="submit" className="submit-button">
        Save
      </button>
      </form>
    </div>
  ) : null

return (
    <DashboardLayout sidebar={sidebar} header={header} footer={footer} drawer={drawer} sidebarOpen={sidebarOpen}>
      <section className="song-canvas" style={{ padding: '20px' }}>
        {renderedSections.map((section) => (
          <article key={section.id} className="section-card" style={{ marginBottom: '24px' }}>
            
            {/* Header Section: Tempat menyatukan Badge Label dan Repeat agar sejajar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div className="section-badge" style={{ margin: 0 }}>
                {section.label}
              </div>
              {section.repeat ? (
                <span 
                  className="repeat-badge" 
                  style={{ 
                    background: '#1e293b', 
                    color: '#f43f5e', // Warna merah muda/pink estetik untuk repeat marker
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    border: '1px solid #312e81'
                  }}
                >
                  {section.repeat}
                </span>
              ) : null}
            </div>

            <div 
              className="section-body" 
              style={{ 
                fontFamily: 'monospace', 
                whiteSpace: 'pre', 
                lineHeight: '1.8' 
              }}
            >
              {section.processedLines.map((line, idx) => {
                if (line.isChord) {
                  return (
                    <div 
                      key={idx} 
                      className="chord-line" 
                      style={{ 
                        color: '#38bdf8', 
                        fontWeight: 'bold',
                        fontSize: `${1.25 * fontSizeMultiplier}rem`, // Mengikuti multiplier
                        marginBottom: '4px'
                      }}
                    >
                      {line.text}
                    </div>
                  );
                }

                return showLyrics ? (
                  <div 
                    key={idx} 
                    className="lyric-line" 
                    style={{ 
                      color: '#ffffff',
                      fontSize: `${1.4 * fontSizeMultiplier}rem`, // Mengikuti multiplier
                      marginBottom: '10px'
                    }}
                  >
                    {line.text}
                  </div>
                ) : null;
              })}
            </div>
          </article>
        ))}
      </section>
    </DashboardLayout>
  )
}

export default App