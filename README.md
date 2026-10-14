# AncestryRoots – Vintage Family Tree Application

An interactive, multi-user Family Tree application featuring dual-parent relationships, generation calculations, vintage oak visualization, timelines, and pedigree views, backed by **Node.js, Express & MongoDB**.

---

## Architecture & Features

- **MongoDB Cloud / Local Persistence**: Dedicated MongoDB schemas for User profiles and Tree nodes, with atomic saves and real-time synchronization.
- **Graceful Offline / Local Fallback**: Seamless client-side caching ensures the app works smoothly both online and offline.
- **Google Sign-In & Multi-User Isolated Storage**: Each account (via Google or Email) has its own private, isolated family tree in MongoDB.
- **Oak Tree Canvas**: Rich vintage artistic presentation with parchment styling and pedigree branches.
- **Dual-Parent Linking**: Automatic reciprocal sync between fathers, mothers, spouses, siblings, and children.
- **Export & Import**: Full support for JSON backup, GEDCOM (.ged), and high-resolution PNG snapshots.

---

## Getting Started

### 1. Start the MongoDB Backend Server
Ensure MongoDB is running locally (or provide a MongoDB Atlas URI in `server/.env`).

```bash
# Run server from project root
npm run server

# Or with automatic reload
npm run server:dev
```
The server runs on `http://localhost:5000` with endpoints:
* Health check: `GET /api/health`
* Authentication: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/google`, `GET /api/auth/me`
* Tree Data: `GET /api/tree`, `PUT /api/tree`, `PATCH /api/tree/name`

### 2. Start the Frontend (Vite)
In another terminal:
```bash
npm run dev
```
The client runs on `http://localhost:5173` and automatically proxies `/api` requests to the Express backend on port `5000`.

---

## Google Login Setup

### 1. Instant Access (Development / Local Testing)
Click **"Continue with Google"** on the login page:
- Choose from pre-configured Google demo profiles (e.g. Alex Morgan, Eleanor Vance, William Sterling).
- Or click **"Use another Google account"** to enter your real Google name and Gmail address for immediate personalized access without credentials setup.

### 2. Official Google OAuth 2.0 (Production / Real Google Popups)
To use official Google Identity Services popups:
1. Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Application type: *Web application*).
3. Add `http://localhost:5173` to **Authorized JavaScript origins**.
4. In this repository, either:
   - Create a `.env` file with `VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`
   - Or paste your Client ID directly into the **Google Cloud Client ID Setup** panel in the app's Google login modal.
