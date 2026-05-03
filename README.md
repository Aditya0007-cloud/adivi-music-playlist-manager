# Adivi

Adivi is a Spotify-inspired Music Playlist Manager built for a DSA laboratory demonstration. It uses React, Tailwind CSS, Framer Motion, Node.js, Express, JWT authentication, and MongoDB with Mongoose models.

## Features

- JWT signup/login with user-specific playlists
- Dark Spotify-inspired dashboard with sidebar, search, cards, mini player, responsive layout, skeleton loaders, toasts, and custom scrollbars
- Playlist CRUD with add/remove songs and drag-and-drop ordering
- Favorite songs, recently played, trending playlists, user profile
- 70 seeded demo songs, including a 45-song "Arijit Singh Essentials" playlist
- Spotify Premium Web Playback SDK support for full-song playback, with preview fallback
- Backend DSA utilities with comments for viva explanation

## DSA Concepts Used

| Concept | Feature | Where |
| --- | --- | --- |
| Array / Dynamic List | Song catalog, playlist song arrays, sorting | `backend/src/utils/dsaAlgorithms.js` |
| Linked List | Playlist queue explanation and linked ordering conversion | `backend/src/utils/dsaAlgorithms.js` |
| Stack | Recently played songs | `backend/src/controllers/songController.js` |
| Queue | Upcoming songs | `frontend/src/context/MusicContext.jsx` |
| Linear Search | Search suggestions and song filtering | `backend/src/utils/dsaAlgorithms.js` |
| Sorting | Sort by title, artist, duration | `backend/src/utils/dsaAlgorithms.js` |
| Binary Search | Fast search on sorted song names | `backend/src/utils/dsaAlgorithms.js` |
| HashMap | User lookup, song lookup, favorite lookup | `backend/src/utils/dsaAlgorithms.js`, controllers |

## Folder Structure

```text
Adivi1/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      utils/
  frontend/
    src/
      api/
      components/
      context/
      pages/
      utils/
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create backend environment file:

```bash
cp backend/.env.example backend/.env
```

3. Use local MongoDB or MongoDB Atlas:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/adivi
JWT_SECRET=adivi-lab-secret
PORT=5001
```

4. Run both frontend and backend:

```bash
npm start
```

Frontend runs at `http://localhost:5173` and backend at `http://localhost:5001`.

If MongoDB is unavailable, the backend falls back to an in-memory demo mode so the lab demo still opens locally. For real persistence, start MongoDB or use Atlas.

## Spotify Premium Playback

Adivi can play full tracks through the Spotify Web Playback SDK when the user connects a Spotify Premium account. The app still falls back to Apple Music/iTunes or Deezer previews when Spotify is not connected.

1. Open the Spotify Developer Dashboard and create an app.
2. Copy the Client ID.
3. Add these redirect URIs in the Spotify app settings:

```text
http://localhost:5173/
https://adivi-client.onrender.com/
```

4. Add the client ID to the frontend environment:

```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
```

5. Restart local Vite or redeploy the frontend after changing the env variable.

Spotify redirect URIs must match exactly, including the trailing slash.

## API Routes

| Method | Route | Description |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create account and return JWT |
| POST | `/api/auth/login` | Login and return JWT |
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/songs` | List/search/sort songs |
| GET | `/api/songs/suggestions?q=` | Search suggestions |
| GET | `/api/songs/binary-search?title=` | Binary search demo |
| POST | `/api/songs/:id/play` | Add song to recently played stack |
| PATCH | `/api/songs/:id/favorite` | Toggle favorite |
| GET | `/api/playlists` | User playlists |
| POST | `/api/playlists` | Create playlist |
| PUT | `/api/playlists/:id` | Edit playlist |
| DELETE | `/api/playlists/:id` | Delete playlist |
| POST | `/api/playlists/:id/songs` | Add song to playlist |
| DELETE | `/api/playlists/:id/songs/:songId` | Remove song from playlist |
| PATCH | `/api/playlists/:id/reorder` | Drag-and-drop reorder |
| GET | `/api/playlists/trending` | Demo trending playlists |

## MongoDB Schemas

### User

```js
{
  name: String,
  email: String,
  passwordHash: String,
  favorites: [ObjectId],
  recentlyPlayed: [{ song: ObjectId, playedAt: Date }]
}
```

### Song

```js
{
  title: String,
  artist: String,
  album: String,
  duration: Number,
  coverImage: String,
  audioUrl: String,
  mood: String,
  plays: Number
}
```

### Playlist

```js
{
  name: String,
  description: String,
  user: ObjectId,
  coverGradient: String,
  songs: [{ song: ObjectId, addedAt: Date }]
}
```

## Deployment

The repo includes deployment config:

- `render.yaml` for Render Blueprint deployments
- `frontend/vercel.json` for Vercel SPA routing
- `backend/.env.production.example`
- `frontend/.env.production.example`

Use MongoDB Atlas for production persistence. The local JSON fallback is only for demos when MongoDB is unavailable.

### Backend on Render

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Add environment variables:
  - `MONGODB_URI=mongodb+srv://...`
  - `JWT_SECRET=<long-random-secret>`
  - `CLIENT_URL=https://your-vercel-app.vercel.app`

### Frontend on Vercel

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_API_URL=https://your-render-backend.onrender.com/api`
- Add `VITE_SPOTIFY_CLIENT_ID=<spotify-client-id>` if you want full Spotify playback

After both are deployed, update Render's `CLIENT_URL` to the final Vercel URL and redeploy the backend.

## Screenshot Preview Descriptions

- Login screen: Adivi wave logo, dark gradient glass panel, animated background glow
- Dashboard: Left sidebar, neon search, album cards, trending playlists, mini player
- Playlist view: Glass playlist cards, song rows, drag-and-drop order handles
