# ACADNOTE — Personal Academic Workspace & Notes Hub

> A modern, responsive Student Notes & Academic Resources Web App built with the **ResourceX** dark academic visual aesthetic (`#000000` deep canvas, `#00FF41` and `#8AFF9B` subtle neon accents, monospace typography, hacker grid, and sleek micro-interactions).

---

## ⚡ Core Concept

A distraction-free, personal academic locker for students:
- **Private User Account**: Zero admin panels or moderation dashboards. Every user owns only their personal notes and subjects.
- **Subject Management**: Create unlimited subjects (e.g., Data Structures, Operating Systems, Database Management).
- **Resource Locker**: Upload files directly into subjects (PDF, DOCX, PPTX, XLSX, TXT, JPG, PNG up to 50MB).
- **In-App File Viewer**:
  - **PDFs**: Embedded viewer modal with responsive controls.
  - **Images**: Direct high-resolution image preview.
  - **Text Files**: Monospace syntax preview with line preservation.
  - **Office Documents (DOCX/PPTX/XLSX)**: Clean metadata presentation with instant direct download button.
- **Direct Downloads**: Download original unmodified files with accurate filenames.
- **Instant Global Search**: Search across subject names and resource file names in real time with `Ctrl+K`.
- **Sorting & Filtering**: Filter by file type (`PDF`, `DOCS`, `SLIDES`, `SHEETS`, `IMAGES`, `TEXT`) and sort by `Recently uploaded`, `Oldest`, `Name A-Z`, `Name Z-A`, or `File Size`.
- **Cascade Deletion**: Safely clean up subjects and all associated disk files with confirmation modals.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**:
  - React 19 + TypeScript
  - Vite 6
  - Tailwind CSS with custom academic theme & dark mode
  - Lucide Icons
  - Space Grotesk & JetBrains Mono Google Fonts
- **Backend & Database**:
  - Bun HTTP Server (`Bun.serve`)
  - SQLite persistent database (`bun:sqlite`) at `data/notes.db`
  - Strict Row-Level Ownership & foreign key cascade enforcement
  - Real disk file storage under `uploads/`
  - PBKDF2 password hashing & HMAC-SHA256 JWT tokens

---

## 🚀 Getting Started

### 1. Launch the Application (Production Mode)
Run:
```bash
bun run build
bun run start
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser.

### 2. Development Mode (Hot Reload)
In one terminal, start the API server:
```bash
bun run server
```
In a second terminal, start the Vite development server:
```bash
bun run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 3. Run Automated E2E Verification Tests
To verify all authentication, upload, view, download, search, security isolation, and cascade deletion flows:
```bash
bun test
# or
bun run test
```

---

## 🔒 Security & User Isolation

Every request checks user ownership:
```sql
SELECT * FROM subjects WHERE id = ? AND user_id = ?
SELECT * FROM resources WHERE id = ? AND user_id = ?
```
Users cannot view, download, modify, or delete any subjects or resources belonging to another user.
