import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import './App.css'
import { songs as defaultSongs, type Song, type SongSection } from './songData'

const storageKey = 'stagechord-song-library'

type SongDraftSection = {
  label: string
  measures: string
  lyrics: string
  repeat: string
}

type SongDraft = {
  title: string
  artist: string
  key: string
  tempo: string
  meter: string
  sections: SongDraftSection[]
}

const defaultDraft: SongDraft = {
  title: '',
  artist: '',
  key: 'C',
  tempo: '72 BPM',
  meter: '4/4',
  sections: [
    {
      label: 'VERSE 1',
      measures: 'C, G, Am, F',
      lyrics: '',
      repeat: '',
    },
  ],
}

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

  const slashParts = chord.split('/')

  return slashParts
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

function getSemitoneDistance(from: string, to: string) {
  return (noteValues[to] - noteValues[from] + 12) % 12
}

function prefersFlats(note: string) {
  return note.includes('b')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeSongSection(value: unknown): SongSection | null {
  if (!isRecord(value)) {
    return null
  }

  const label = typeof value.label === 'string' ? value.label.trim() : ''
  const measures = Array.isArray(value.measures)
    ? value.measures.filter((measure): measure is string => typeof measure === 'string')
    : []
  const lyrics = typeof value.lyrics === 'string' ? value.lyrics.trim() : ''

  if (!label || measures.length === 0 || !lyrics) {
    return null
  }

  const repeat = typeof value.repeat === 'string' && value.repeat.trim() ? value.repeat.trim() : undefined

  return {
    label,
    measures,
    lyrics,
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
  const tempo = typeof value.tempo === 'string' ? value.tempo.trim() : ''
  const meter = typeof value.meter === 'string' ? value.meter.trim() : ''

  if (!title || !artist || !key || !tempo || !meter || !Array.isArray(value.sections)) {
    return null
  }

  const sections = value.sections
    .map((section) => normalizeSongSection(section))
    .filter((section): section is SongSection => section !== null)

  if (sections.length === 0) {
    return null
  }

  return {
    title,
    artist,
    key,
    tempo,
    meter,
    sections,
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

function createDraftSection(section?: SongSection): SongDraftSection {
  return {
    label: section?.label ?? 'VERSE 1',
    measures: section?.measures.join(', ') ?? 'C, G, Am, F',
    lyrics: section?.lyrics ?? '',
    repeat: section?.repeat ?? '',
  }
}

function createDraftFromSong(song: Song): SongDraft {
  return {
    title: song.title,
    artist: song.artist,
    key: song.key,
    tempo: song.tempo,
    meter: song.meter,
    sections: song.sections.length > 0 ? song.sections.map((section) => createDraftSection(section)) : [createDraftSection()],
  }
}

function createSongFromDraft(draft: SongDraft): Song {
  const sections = draft.sections
    .map((section) => ({
      label: section.label.trim(),
      measures: section.measures
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      lyrics: section.lyrics.trim(),
      repeat: section.repeat.trim(),
    }))
    .filter((section) => section.label && section.measures.length > 0 && section.lyrics)
    .map((section) => ({
      ...section,
      repeat: section.repeat ? section.repeat : undefined,
    }))

  const fallbackSection: SongSection = {
    label: 'VERSE 1',
    measures: ['C'],
    lyrics: 'New song lyrics',
  }

  return {
    title: draft.title.trim(),
    artist: draft.artist.trim(),
    key: draft.key.trim() || 'C',
    tempo: draft.tempo.trim() || '72 BPM',
    meter: draft.meter.trim() || '4/4',
    sections: sections.length > 0 ? sections : [fallbackSection],
  }
}

function App() {
  const [library, setLibrary] = useState<Song[]>(() => loadSongLibrary())
  const [selectedSongIndex, setSelectedSongIndex] = useState(0)
  const [selectedKey, setSelectedKey] = useState(() => loadSongLibrary()[0].key)
  const [chordOnly, setChordOnly] = useState(false)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [composerMode, setComposerMode] = useState<'add' | 'edit' | null>(null)
  const [draft, setDraft] = useState<SongDraft>(defaultDraft)
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedSong = library[selectedSongIndex]

  const songKeys = useMemo(
    () => Array.from(new Set(library.map((song) => song.key))),
    [library],
  )

  const visibleSongs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return library
    }

    return library.filter((song) => {
      const haystack = [song.title, song.artist, song.key, song.tempo, song.meter]
        .concat(song.sections.flatMap((section) => [section.label, section.lyrics, section.measures.join(' '), section.repeat ?? '']))
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [library, searchQuery])

  const composerTitle = composerMode === 'edit' ? 'Edit Song' : 'Add Song'

  const transposeAmount = useMemo(
    () => getSemitoneDistance(selectedSong.key, selectedKey),
    [selectedSong.key, selectedKey],
  )

  const renderedSections = useMemo(
    () =>
      selectedSong.sections.map((section) => ({
        ...section,
        measures: section.measures.map((chord) =>
          transposeChord(chord, transposeAmount, prefersFlats(selectedKey)),
        ),
      })),
    [selectedKey, selectedSong.sections, transposeAmount],
  )

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(library))
  }, [library])

  function handleSongSelect(index: number) {
    setSelectedSongIndex(index)
    setSelectedKey(library[index].key)
    setIsComposerOpen(false)
    setComposerMode(null)
  }

  function openAddComposer() {
    setComposerMode('add')
    setDraft(defaultDraft)
    setIsComposerOpen(true)
  }

  function openEditComposer() {
    if (!selectedSong) {
      return
    }

    setComposerMode('edit')
    setDraft(createDraftFromSong(selectedSong))
    setIsComposerOpen(true)
  }

  function closeComposer() {
    setIsComposerOpen(false)
    setComposerMode(null)
  }

  function handleComposerChange(field: keyof Omit<SongDraft, 'sections'>, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function handleSectionChange(index: number, field: keyof SongDraftSection, value: string) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [field]: value } : section,
      ),
    }))
  }

  function addComposerSection() {
    setDraft((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          label: `SECTION ${current.sections.length + 1}`,
          measures: 'C, G, Am, F',
          lyrics: '',
          repeat: '',
        },
      ],
    }))
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

  function resetComposer() {
    setDraft(defaultDraft)
  }

  function handleComposerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextSong = createSongFromDraft(draft)

    if (composerMode === 'edit') {
      const nextLibrary = [...library]
      nextLibrary[selectedSongIndex] = nextSong
      setLibrary(nextLibrary)
      setSelectedKey(nextSong.key)
      closeComposer()
      return
    }

    const nextLibrary = [nextSong, ...library]
    setLibrary(nextLibrary)
    setSelectedSongIndex(0)
    setSelectedKey(nextSong.key)
    closeComposer()
    resetComposer()
  }

  function handleDeleteSelectedSong() {
    if (!selectedSong) {
      return
    }

    if (!window.confirm(`Hapus lagu "${selectedSong.title}"?`)) {
      return
    }

    const nextLibrary = library.length > 1 ? library.filter((_, index) => index !== selectedSongIndex) : defaultSongs
    setLibrary(nextLibrary)
    setSelectedSongIndex(0)
    setSelectedKey(nextLibrary[0].key)
    closeComposer()
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

  async function handleImportLibrary(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as unknown

      if (!Array.isArray(parsed)) {
        throw new Error('Invalid file format')
      }

      const importedLibrary = parsed.map((song) => normalizeSong(song)).filter((song): song is Song => song !== null)

      if (importedLibrary.length === 0) {
        throw new Error('No valid songs found')
      }

      setLibrary(importedLibrary)
      setSelectedSongIndex(0)
      setSelectedKey(importedLibrary[0].key)
      setSearchQuery('')
      closeComposer()
    } catch {
      window.alert('File JSON tidak valid.')
    } finally {
      event.target.value = ''
    }
  }

  function handleResetLibrary() {
    setLibrary(defaultSongs)
    setSelectedSongIndex(0)
    setSelectedKey(defaultSongs[0].key)
    setSearchQuery('')
    closeComposer()
    resetComposer()
  }

  return (
    <main className="app-shell">
      <div className="stage-halo stage-halo--one" />
      <div className="stage-halo stage-halo--two" />

      <section className="tablet-frame" aria-label="Chord and lyrics viewer">
        <header className="topbar">
          <div className="song-brand">
            <div className="song-mark" aria-hidden="true">
              ♪
            </div>
            <div>
              <h1>{selectedSong.title}</h1>
              <p>{selectedSong.artist}</p>
            </div>
          </div>

          <div className="topbar-actions">
            <button type="button" onClick={openAddComposer}>
              Add Song +
            </button>
            <button type="button" className="ghost" onClick={openEditComposer}>
              Edit
            </button>
            <button type="button" className="ghost danger" onClick={handleDeleteSelectedSong}>
              Delete
            </button>
            <button type="button" className="ghost">
              Settings
            </button>
          </div>
        </header>

        <section className="song-summary">
          <div className="summary-card summary-card--key">
            <span>Key</span>
            <strong>
              {selectedSong.key} <small>(transposed to {selectedKey})</small>
            </strong>
          </div>

          <div className="summary-card summary-card--transpose">
            <span>Transpose</span>
            <div className="key-pills" role="tablist" aria-label="Transpose key">
              {songKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={key === selectedKey ? 'pill active' : 'pill'}
                  onClick={() => setSelectedKey(key)}
                  aria-pressed={key === selectedKey}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="summary-card summary-card--toggle">
            <span>Lirik / Chord Toggle</span>
            <button
              type="button"
              className={chordOnly ? 'toggle-pill active' : 'toggle-pill'}
              onClick={() => setChordOnly((current) => !current)}
              aria-pressed={chordOnly}
            >
              {chordOnly ? 'Chord Only' : 'Lyrics + Chord'}
            </button>
          </div>
        </section>

        <section className="stage-layout">
          <aside className="meta-rail">
            <div>
              <span>Performance</span>
              <strong>{selectedSong.tempo}</strong>
            </div>
            <div>
              <span>Meter</span>
              <strong>{selectedSong.meter}</strong>
            </div>
            <div>
              <span>Arrangement</span>
              <strong>{selectedSong.sections.map((section) => section.label).join(' / ')}</strong>
            </div>
          </aside>

          <div className="song-canvas">
            {renderedSections.map((section) => (
              <article className="section-card" key={section.label}>
                <div className="section-label">[{section.label}]</div>
                <div className="measure-row" aria-label={section.label}>
                  {section.measures.map((chord, index) => (
                    <span key={`${section.label}-${index}`} className="measure-chip">
                      {chord}
                    </span>
                  ))}
                  {section.repeat ? <span className="repeat-chip">{section.repeat}</span> : null}
                </div>
                {!chordOnly ? <p className="lyric-line">{section.lyrics}</p> : null}
              </article>
            ))}
          </div>

          <aside className="side-panel">
            <div className="panel-card panel-card--dark">
              <span>Current View</span>
              <strong>{chordOnly ? 'Chord only' : 'Chord + lyrics'}</strong>
              <p>Styled for setlist use, practice mode, or projection during live worship.</p>
            </div>

            <div className="panel-card">
              <span>Song Library</span>
              <strong>
                {visibleSongs.length}/{library.length} songs
              </strong>
              <p>Pilih lagu, edit, hapus, atau cari lewat kolom di bawah ini.</p>

              <div className="library-tools">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search song, artist, key..."
                  aria-label="Search song library"
                />
                <div className="library-actions">
                  <button type="button" onClick={handleExportLibrary}>
                    Export JSON
                  </button>
                  <button type="button" className="ghost" onClick={() => fileInputRef.current?.click()}>
                    Import JSON
                  </button>
                  <button type="button" className="ghost" onClick={handleResetLibrary}>
                    Reset Library
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleImportLibrary}
                hidden
              />

              <div className="song-list" role="listbox" aria-label="Song list">
                {visibleSongs.length > 0 ? (
                  visibleSongs.map((song) => {
                    const originalIndex = library.indexOf(song)

                    return (
                      <button
                        key={`${song.title}-${originalIndex}`}
                        type="button"
                        className={originalIndex === selectedSongIndex ? 'song-item active' : 'song-item'}
                        onClick={() => handleSongSelect(originalIndex)}
                        aria-pressed={originalIndex === selectedSongIndex}
                      >
                        <strong>{song.title}</strong>
                        <span>
                          {song.artist} · Key {song.key}
                        </span>
                      </button>
                    )
                  })
                ) : (
                  <div className="song-item song-item--empty">No songs match your search.</div>
                )}
              </div>
            </div>

            {isComposerOpen ? (
              <form className="panel-card composer-card" onSubmit={handleComposerSubmit}>
                <span>{composerTitle}</span>
                <strong>{composerMode === 'edit' ? 'Update the selected song' : 'Create a new song'}</strong>

                <label>
                  Title
                  <input
                    value={draft.title}
                    onChange={(event) => handleComposerChange('title', event.target.value)}
                    placeholder="Song title"
                    required
                  />
                </label>

                <label>
                  Artist
                  <input
                    value={draft.artist}
                    onChange={(event) => handleComposerChange('artist', event.target.value)}
                    placeholder="Song artist"
                    required
                  />
                </label>

                <div className="composer-grid">
                  <label>
                    Key
                    <input
                      value={draft.key}
                      onChange={(event) => handleComposerChange('key', event.target.value)}
                      placeholder="C"
                    />
                  </label>
                  <label>
                    Tempo
                    <input
                      value={draft.tempo}
                      onChange={(event) => handleComposerChange('tempo', event.target.value)}
                      placeholder="72 BPM"
                    />
                  </label>
                </div>

                <label>
                  Meter
                  <input
                    value={draft.meter}
                    onChange={(event) => handleComposerChange('meter', event.target.value)}
                    placeholder="4/4"
                  />
                </label>

                <div className="composer-sections">
                  {draft.sections.map((section, index) => (
                    <fieldset className="composer-section" key={`${section.label}-${index}`}>
                      <div className="composer-section-head">
                        <strong>Section {index + 1}</strong>
                        <button
                          type="button"
                          className="ghost danger small"
                          onClick={() => removeComposerSection(index)}
                          disabled={draft.sections.length === 1}
                        >
                          Remove
                        </button>
                      </div>

                      <label>
                        Label
                        <input
                          value={section.label}
                          onChange={(event) => handleSectionChange(index, 'label', event.target.value)}
                          placeholder="VERSE 1"
                        />
                      </label>

                      <label>
                        Chords
                        <input
                          value={section.measures}
                          onChange={(event) => handleSectionChange(index, 'measures', event.target.value)}
                          placeholder="C, G, Am, F"
                        />
                      </label>

                      <label>
                        Lyrics
                        <textarea
                          value={section.lyrics}
                          onChange={(event) => handleSectionChange(index, 'lyrics', event.target.value)}
                          rows={4}
                          placeholder="Type lyrics here"
                          required
                        />
                      </label>

                      <label>
                        Repeat Note
                        <input
                          value={section.repeat}
                          onChange={(event) => handleSectionChange(index, 'repeat', event.target.value)}
                          placeholder="(2x)"
                        />
                      </label>
                    </fieldset>
                  ))}
                </div>

                <div className="composer-actions composer-actions--stacked">
                  <button type="button" className="ghost" onClick={addComposerSection}>
                    Add Section
                  </button>
                  <button type="submit">{composerMode === 'edit' ? 'Save Changes' : 'Save Song'}</button>
                  <button type="button" className="ghost" onClick={closeComposer}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            <div className="panel-card panel-card--button">
              <button type="button">Open Song Settings</button>
            </div>
          </aside>
        </section>

        <footer className="footer-actions">
          <button type="button">Add New Song +</button>
          <button type="button">Transpose Code</button>
          <button type="button">Transpose Chord</button>
          <button type="button">Song Settings</button>
        </footer>
      </section>
    </main>
  )
}

export default App