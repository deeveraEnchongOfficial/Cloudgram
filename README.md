# Cloudgram — Full-Stack Next.js

Cloud storage powered by Telegram, reimplemented as a full-stack Next.js web application. Files are stored in Telegram channels as documents, with folders mapped to broadcast channels for unlimited free cloud storage.

## Features

- **Authentication**: Phone number + verification code + 2FA, QR login via GramJS
- **File Management**: Upload (with real-time progress bar), download, delete, search files
- **Folder Management**: Create/list/delete folders (backed by Telegram channels) with modal dialog for naming
- **File Sharing**: Password-protected shares with expiry, public download links
- **Media Streaming**: Range-request support for video/audio streaming
- **REST API**: v1 API with API key authentication
- **Dark/Light Theme**: System-aware theme switching
- **Mobile Responsive**: Full mobile support with collapsible sidebar
- **Bandwidth Tracking**: Daily upload/download tracking with limits
- **VPN Optimizer**: Proxy support, adaptive timeouts, retry logic
- **Security**: JWT + HttpOnly cookies, AES-256-GCM session encryption, rate limiting
- **Configurable Branding**: App name and folder prefix customizable via environment variables

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- TypeScript 5
- TailwindCSS 4
- Prisma 6 + MongoDB 7
- GramJS 2.26 (Telegram API)
- @tanstack/react-query
- Zustand (state management)
- Framer Motion
- Zod validation
- Sonner (toast notifications)

## Getting Started

### Prerequisites

- Node.js 22+
- MongoDB 7+
- Telegram API credentials from [my.telegram.org](https://my.telegram.org/auth)

### Installation

```bash
# Install dependencies
npm install

# Copy env file and fill in your credentials
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | — |
| `JWT_SECRET` | Secret for JWT access tokens | — |
| `JWT_REFRESH_SECRET` | Secret for JWT refresh tokens | — |
| `ENCRYPTION_KEY` | 32-byte hex key for session encryption (64 hex chars) | — |
| `PUBLIC_URL` | Public URL for share links | — |
| `NODE_ENV` | `production` or `development` | — |
| `APP_NAME` | App display name (shown in UI, sidebar, login) | `Cloudgram` |
| `TELEGRAM_FOLDER_PREFIX` | Prefix for Telegram channel names to identify managed folders | `[td]` |
| `BOT_TOKEN` | Optional Telegram bot token for bot-based features | — |

### Docker

```bash
docker-compose up -d
```

## How It Works

Cloudgram uses Telegram channels as storage backends:

1. **Folders** are Telegram broadcast channels prefixed with `TELEGRAM_FOLDER_PREFIX` (e.g. `[td] My Drive`)
2. **Files** are uploaded as documents to these channels via GramJS
3. **Channel IDs and access hashes** are stored as strings in MongoDB to preserve 64-bit precision
4. **Peer resolution** uses `Api.InputPeerChannel` for GramJS API calls
5. **Upload progress** is tracked via `XMLHttpRequest` upload events on the client

## API Endpoints

### Auth
- `POST /api/auth/connect` — Connect with API credentials
- `POST /api/auth/code` — Send verification code
- `POST /api/auth/sign-in` — Sign in with code
- `POST /api/auth/password` — Verify 2FA password
- `POST /api/auth/qr/start` — Start QR login
- `POST /api/auth/qr/poll` — Poll QR login status
- `POST /api/auth/logout` — Logout
- `GET /api/auth/session` — Get current session

### Files
- `GET /api/files` — List files in a folder
- `POST /api/files` — Upload a file (multipart/form-data with progress)
- `GET /api/files/:id` — Download a file
- `DELETE /api/files/:id` — Delete a file
- `GET /api/files/:id/download` — Stream download with range support
- `GET /api/files/:id/preview` — Get file thumbnail
- `POST /api/files/bulk` — Bulk delete/move
- `GET /api/files/search` — Search files across folders

### Folders
- `GET /api/folders` — List folders (from Prisma + Telegram sync)
- `POST /api/folders` — Create folder (creates Telegram channel + Prisma record)
- `GET /api/folders/:id` — Get folder contents
- `DELETE /api/folders/:id` — Delete folder
- `POST /api/folders/:id/move` — Move files to folder

### Shares
- `GET /api/shares` — List user's shares
- `POST /api/shares` — Create share
- `DELETE /api/shares/:id` — Revoke share
- `GET /api/shares/:token` — Get/download shared file
- `POST /api/shares/:token` — Verify share password

### Settings
- `GET /api/settings` — Get settings
- `PUT /api/settings` — Update settings

### REST API v1 (API Key auth)
- `GET /api/v1/keys` — List API keys
- `POST /api/v1/keys` — Create API key
- `GET /api/v1/files` — List files
- `GET /api/v1/files/:id` — Download file

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (auth, files, folders, shares)
│   ├── dashboard/         # Dashboard layout & pages
│   └── login/             # Login page
├── components/
│   ├── auth/              # Auth wizard (phone, QR, 2FA)
│   ├── dashboard/         # Sidebar, topbar, file explorer, upload progress, create folder modal
│   └── cloudgram-logo.tsx # Reusable SVG logo
├── lib/
│   ├── telegram/          # GramJS client, folder & file operations
│   ├── db/                # Prisma client & queries
│   ├── cache/             # MongoDB cache layer
│   ├── security/          # Validation, rate limiting
│   ├── upload/            # Progress tracking
│   └── constants.ts       # Configurable constants (APP_NAME, TELEGRAM_FOLDER_PREFIX)
├── stores/                # Zustand stores (folder, file, transfer)
├── types/                 # TypeScript types
└── providers/             # React Query & theme providers
```

## License

MIT
