# ChargeInspector — Architecture

A crowdsourced billing descriptor lookup. Users submit the obscure text that
appears on their bank statement alongside the real merchant details, so others
can search and identify mystery charges.

---

## Data Model

### `users` (existing — add `total_points`)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | TEXT UNIQUE | |
| password_hash | TEXT | |
| role | TEXT | `user` \| `admin` \| `moderator` |
| total_points | INT | Running points total, default 0 |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `merchants`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT | |
| location | TEXT | |
| website | TEXT | |
| logo_url | TEXT | URL to merchant logo |
| created_at | TIMESTAMPTZ | |

### `descriptors`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| text | TEXT UNIQUE | Raw billing descriptor string |
| canonical_submission_id | UUID FK | Points to the approved/winning submission |
| created_at | TIMESTAMPTZ | |

### `submissions`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| descriptor_id | UUID FK | → descriptors |
| merchant_id | UUID FK | → merchants |
| submitted_by | UUID FK | → users |
| status | TEXT | `pending` \| `approved` \| `rejected` |
| upvote_count | INT | Cached count, default 0 |
| created_at | TIMESTAMPTZ | |

### `votes`
One vote per user per submission.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| submission_id | UUID FK | → submissions |
| user_id | UUID FK | → users |
| created_at | TIMESTAMPTZ | |

### `points_log`
Audit trail of all points earned.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | → users |
| amount | INT | |
| reason | TEXT | `submission_approved` \| `upvote_received` |
| reference_id | UUID | submission_id that triggered the points |
| created_at | TIMESTAMPTZ | |

### `badges`
Badge definitions — awarded automatically when points threshold is crossed.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT | |
| description | TEXT | |
| points_threshold | INT | Points needed to earn this badge |
| icon | TEXT | Emoji or icon name |

### `user_badges`
| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID FK | |
| badge_id | UUID FK | |
| awarded_at | TIMESTAMPTZ | |

---

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/search?q=` | Public | Fuzzy search descriptors, returns merchant details |
| POST | `/api/submissions` | User | Submit descriptor + merchant |
| POST | `/api/submissions/:id/vote` | User | Upvote a submission |
| GET | `/api/submissions/pending` | Admin | List pending submissions |
| PUT | `/api/submissions/:id/approve` | Admin | Approve and make canonical |
| PUT | `/api/submissions/:id/reject` | Admin | Reject submission |
| GET | `/api/users/me/stats` | User | Points, badges, submission count |
| GET | `/api/leaderboard` | Public | Top users by points |

---

## Pages

| Route | Auth | Description |
|-------|------|-------------|
| `/` | Public | Search — fuzzy match on descriptor, shows merchant card |
| `/submit` | User | Submit form with conflict detection |
| `/profile` | User | Points, badges, submission history |
| `/leaderboard` | Public | Top contributors |
| `/admin` | Admin | Moderation queue — approve/reject submissions |
| `/login` | Public | Already built |
| `/register` | Public | Already built |

---

## Key Design Decisions

- **Fuzzy search**: PostgreSQL `pg_trgm` extension for similarity matching on descriptor text. Returns ranked results by similarity score.
- **Conflict flow**: On submit, if the descriptor already exists, the user is shown the current best match and asked to confirm it's a different merchant. If confirmed, the new submission is queued alongside the existing one for admin approval and community voting.
- **Points**: +10 for an approved submission, +1 per upvote received. Logged in `points_log` for auditability.
- **Badges**: Automatically awarded when `total_points` crosses a threshold. Badge names to be defined.
- **Logo**: Stored as a URL (user pastes link). File upload to be added later.
- **Moderation**: All submissions start as `pending`. Only `approved` submissions appear in search results. Admin dashboard makes approve/reject as fast as possible (single click).
- **Canonical answer**: Each descriptor has one `canonical_submission_id` pointing to the approved submission shown by default in search. If multiple approved submissions exist for the same descriptor, the one with the most upvotes wins.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT (access token in memory, refresh token in httpOnly cookie) |
| Search | PostgreSQL `pg_trgm` |
| Client | React + Vite |
| Hosting | Railway |
