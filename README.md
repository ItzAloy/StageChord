# StageChord

StageChord is a chord display app for worship or band use. The client renders chord sheets, transposition, and Nashville notation, while the server exposes the song API and persists song data so it survives restarts.

## ✨ Key Features

* **ProPresenter-Style Playlist Workflow:** Easily create setlists (Gig Folders) and append songs from the master library with a single click.
* **Performance Mode:** Distraction-free, bento-less plain text chord rendering with a multi-column layout to completely eliminate vertical scrolling.
* **Intelligent Auto-Transpose:** Instantly change the base key of any song. Alphabetical chords transpose accurately while Nashville Number System notations (1, 5, 6m, 4) remain intact.
* **Number Notation Toggle:** One-click conversion to switch between standard alphabetical chords and relative number notation.
* **Performance Controls:** Seamlessly transition between songs in your active playlist using UI buttons or keyboard shortcuts (Left/Right Arrows).
* **Dynamic Theme:** Synchronized Dark/Light presentation modes tailored for different stage lighting conditions.
* **Full CRUD & Search:** Add, edit, delete, and quick-search songs in the master library without losing input focus.

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Vite, Tailwind CSS
* **Backend:** Node.js, Express
* **Storage:** Local JSON / In-memory (Ready for Database Integration)

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/username/monochord.git](https://github.com/username/monochord.git)
   cd monochord
