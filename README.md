# ReadHaven

A social reading tracker built with Next.js. Users search books, organize them
into shelves, log reviews and ratings, set a yearly reading goal, add friends,
share short posts, and discover new titles via vector similarity over a
locally-seeded book catalogue.

Live demo: https://read-haven-sandy.vercel.app

```mermaid
graph TB
    subgraph Client["Browser / Client"]
        UI["Next.js App Router\nPages & Components"]
    end

    subgraph Auth["Authentication"]
        NA["NextAuth.js\nJWT sessions"]
        CP["Credentials\nEmail + bcrypt"]
        OA["OAuth\nGoogle · GitHub"]
        NA --> CP
        NA --> OA
    end

    subgraph API["API Layer  (/api/*)"]
        AR["Auth · Register"]
        BS["Books · Search · Detail"]
        SH["Shelves · Add · Remove"]
        RV["Reviews · CRUD"]
        PS["Posts · Likes · Comments"]
        FR["Friends · Request · Accept · Remove"]
        RG["Reading Goal · Upsert"]
        RC["Recommendations\n(vector search)"]
        AW["Awards\n(Groq LLM)"]
    end

    subgraph External["External APIs"]
        GB["Google Books API"]
        OL["Open Library API"]
        GR["Groq API\nllama-3.1-8b-instant"]
    end

    subgraph Embed["Local Embeddings"]
        XT["@xenova/transformers\nONNX runtime"]
        ML["all-MiniLM-L6-v2\n384-dim vectors"]
        XT --> ML
    end

    subgraph DB["PostgreSQL + pgvector"]
        PR["Prisma ORM"]
        TU["users · accounts · sessions"]
        TS["shelves · shelf_books"]
        TR["reviews · reading_goals"]
        TP["posts · likes · comments"]
        TF["friendships · activities"]
        TB["books + ivfflat index\nvector(384) embeddings"]
        PR --> TU & TS & TR & TP & TF & TB
    end

    subgraph Scripts["Seed Scripts"]
        SB["seed-books.ts\nOpen Library bulk fetch"]
        SE["backfill-embeddings.ts\nEmbed + build ivfflat index"]
    end

    subgraph CI["GitHub Actions CI"]
        LN["ESLint"]
        TC["tsc --noEmit"]
        JT["Jest · 132 tests\n88% statement coverage"]
        BL["next build"]
        LN --> TC --> JT --> BL
    end

    UI --> NA
    UI --> API

    AR --> DB
    BS --> GB & OL
    SH & RV & PS & FR & RG --> DB
    RC --> Embed
    RC --> DB
    AW --> GR
    AW --> BS

    Scripts --> OL
    Scripts --> DB
    SE --> Embed
```

## Tech stack

- **Next.js 16** (App Router, server components, route handlers)
- **TypeScript**
- **PostgreSQL** with the **pgvector** extension, via **Prisma**
- **NextAuth.js** for auth (email/password, Google, GitHub)
- **Tailwind CSS v4** + a few hand-written per-page stylesheets
- **Zod** for request validation
- **@xenova/transformers** running `Xenova/all-MiniLM-L6-v2` locally for
  384-dim sentence embeddings (no external embedding API needed)
- Book data: **Open Library** + **Google Books**
- **Jest** + ts-jest for the API tests
- **GitHub Actions** for CI
- Optional: **Groq API** for the "Awards" category recommendations

## Features

- **Auth**: sign up with email/password (bcrypt-hashed), or OAuth via Google /
  GitHub. JWT sessions.
- **Book search**: queries Google Books and Open Library in parallel, dedupes
  by title + first author, then ranks by ratings/recency.
- **Book detail**: aggregates fields from both sources, sanitizes the
  description HTML, shows existing reviews, and includes a "More like this"
  row driven by the local catalogue's embeddings.
- **Shelves**: every new user gets *Want to Read*, *Currently Reading* and
  *Read* shelves bootstrapped in a Prisma transaction.
- **Reviews**: 1–5 star rating with optional text. Editing upserts.
- **Reading goal**: one yearly goal per user (`@@unique([userId, year])`).
- **Friends**: search by email, send / accept / remove requests.
- **Posts & comments**: short posts (max 2000 chars) optionally attached to a
  book, with like-toggle and cursor-paginated comments.
- **Discover** page (`/discover`): free-text semantic search over the local
  book catalogue. Backed by pgvector cosine-distance with an ivfflat index.
- **Awards section** *(optional)*: asks Groq for 5 book titles in a category,
  then resolves each through the book search/detail APIs.

## Project layout

```
app/
  (auth)/                login & signup
  api/                   route handlers
  book/                  detail + /book/resolve helper
  discover/              semantic search page
  feed/ friends/ ...     social pages
  layout.tsx             metadata, OG, theme color
  robots.ts              robots.txt generator
  sitemap.ts             static + book-detail sitemap
lib/
  auth.ts                NextAuth config
  prisma.ts              Prisma client singleton
  embeddings.ts          local sentence-embedding pipeline
  recommendations.ts     pgvector cosine-distance queries
  shelves.ts             default-shelf bootstrap helper
  shelf-slug.ts          URL slug helpers for shelves
  validation.ts          pagination + Zod helpers
prisma/
  schema.prisma          models incl. Book + vector(384) embedding
  migrations/            includes the pgvector + ivfflat + composite-index migration
scripts/
  seed-books.ts          one-shot seeder from Open Library
  backfill-embeddings.ts one-shot embedding backfill
__tests__/               Jest API tests
.github/workflows/ci.yml lint, typecheck, jest, build
```

## Setup

Requires Node 20+ and Postgres with the pgvector extension. Neon, Supabase,
and `pgvector/pgvector` Docker images all work.

```bash
git clone https://github.com/Devdatt-58
cd ReadHaven
npm install
```

Create `.env` in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<output of: openssl rand -base64 32>"

# Used by app/robots.ts, app/sitemap.ts, app/layout.tsx for OG URLs.
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Optional OAuth providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Optional — enables the LLM-powered Awards category recommendations
GROQ_API_KEY=""
```

Apply migrations (this also creates the `vector` extension and the `books`
table + `ivfflat` embedding index):

```bash
npx prisma migrate deploy
```

Seed the book catalogue and backfill embeddings:

```bash
npm run seed:books        # pulls ~6k books from Open Library
npm run seed:embeddings   # embeds each book locally; first run downloads ~25 MB ONNX model
```

Then:

```bash
npm run dev
```

App runs at <http://localhost:3000>.

## Scripts

- `npm run dev` — Next.js dev server
- `npm run build` — production build
- `npm run start` — start the built app
- `npm run lint` — ESLint (warnings only)
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — Jest
- `npm run test:coverage` — Jest with HTML + lcov coverage into `coverage/`
- `npm run seed:books` — pull books from Open Library into the local catalogue
- `npm run seed:embeddings` — embed every book without an embedding, then
  (re)build the pgvector `ivfflat` index over the populated data (idempotent)

## API surface

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/auth/register` | name, email, password (8–72 bytes) |
| `GET` | `/api/books/search?q=&page=` | merged Google + Open Library |
| `GET` | `/api/books/[id]` | merged detail (Google ID or `OL…` ID) |
| `GET`/`POST`/`DELETE` | `/api/reviews` | list by `bookId`; upsert / delete by id |
| `POST` | `/api/shelves/add-book` | requires auth; checks shelf ownership |
| `POST` | `/api/shelves/remove-book` | requires auth |
| `GET`/`POST` | `/api/reading-goal?year=` | one goal per `(userId, year)` |
| `GET`/`POST` | `/api/posts` | list recent / create a post |
| `POST` | `/api/posts/like` | toggle like |
| `GET`/`POST` | `/api/posts/[id]/comments` | cursor paginated |
| `GET` | `/api/friends/search?email=` | find a user to friend |
| `POST` | `/api/friends/request` `/accept` `/remove` | manage friendships |
| `PATCH` | `/api/user/profile` | name, bio, location, website |
| `POST` | `/api/awards` | category → LLM → resolved books (rate limited) |
| `GET` | `/api/recommendations?q=` | semantic search over the catalogue |

## Notes & known limitations

- OAuth callbacks need the corresponding `NEXTAUTH_URL` and provider redirect
  URIs to match.
- The friends activity feed is populated from `added_book` events; review and
  challenge events are not tracked yet.
- `<img>` is still used in a few components instead of `next/image` — these
  surface as ESLint warnings.

## License

MIT.
