# 🌾 Farmly – Local Food Marketplace

Farmly is a full-stack e-commerce platform that connects farms with customers through product catalogs, farm events, offers, reviews, and Stripe-powered orders. The backend is built with Node.js, Express, Prisma, and PostgreSQL, while the frontend runs on React, TanStack Router, and TailwindCSS.

---

## 🚧 Current Progress

- Auth, profiles, farms, events, offers, and reviews endpoints are implemented in the API.
- Stripe checkout (with webhooks) and Cloudinary uploads are wired up for the demo environment.
- Frontend currently focuses on authenticated dashboards and farm management flows.
- More public pages, moderation tooling, and production-ready content are still pending.

---

## 🛠️ Tech & Requirements

- Node.js v20+ and npm (or pnpm) for running both apps.
- PostgreSQL v15+ for the Prisma database.
- Stripe CLI for forwarding webhooks locally (`npm start` spawns it automatically).
- Optional integrations: SMTP account for transactional emails and a Cloudinary account for media uploads.

---

## ⚡ Quick Start (Localhost)

### 1. Clone & install

```bash
git clone https://github.com/Ado-go/farmly.git
cd farmly
npm run install:all          # installs frontend + backend dependencies
```

### 2. Configure environment files

- `backend/.env` (create if it does not exist):

  ```bash
  DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/farmly"
  PORT=5000
  CLIENT_URL=http://localhost:5173

  ACCESS_TOKEN_SECRET=replace_me
  REFRESH_TOKEN_SECRET=replace_me
  RESET_TOKEN_SECRET=replace_me

  EMAIL_HOST=smtp.example.com
  EMAIL_PORT=587
  EMAIL_USER=your_inbox@example.com
  EMAIL_PASS=app_password
  EMAIL_FROM="Farmly Support <noreply@example.com>"

  CLOUDINARY_CLOUD_NAME=your_cloud
  CLOUDINARY_API_KEY=your_key
  CLOUDINARY_API_SECRET=your_secret

  STRIPE_SECRET_KEY=sk_test_xxx
  STRIPE_WEBHOOK_SECRET=whsec_xxx
  FRONTEND_URL=http://localhost:5173
  BACKEND_URL=http://localhost:5000
  ```

  The Stripe secrets come from the Stripe dashboard + `stripe listen`. Cloudinary and email credentials are optional but needed for the corresponding features.

- `frontend/.env` (Vite-style variables):
  ```bash
  VITE_STRIPE_PUBLIC_KEY=pk_test_xxx
  ```

### 3. Prepare the database

```bash
cd backend
npx prisma migrate dev
npm run prisma:seed   # optional demo data (use npm run prisma:clear to reset)
cd ..
```

### 4. Run the stack

```bash
npm start
```

This script launches:

- `start:frontend` → Vite dev server on `http://localhost:5173`
- `start:backend` → Express API on `http://localhost:5000`
- `start:stripe` → `stripe listen` forwarding to `/api/checkout/stripe/webhook`

If you prefer to avoid Stripe while developing other parts, run `npm run start:frontend` and `npm run start:backend` manually in separate terminals instead.

---

## 🧪 Testing

```bash
cd backend
npm run test
```

---

## 🔧 Useful scripts

| Command                                        | Description                                                      |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| `npm run install:all`                          | Install dependencies in both frontend and backend.               |
| `npm start`                                    | Run frontend, backend, and Stripe webhook listener concurrently. |
| `npm run start:frontend`                       | Launch only the Vite dev server.                                 |
| `npm run start:backend`                        | Launch only the API (requires env + Postgres).                   |
| `npm run install:frontend` / `install:backend` | Install dependencies per workspace.                              |
| `cd backend && npm run prisma:seed`            | Seed demo data into the DB.                                      |
| `cd backend && npm run prisma:clear`           | Remove seeded data.                                              |

---

## 🧱 Project Structure

```
farmly/
├─ backend/   # Express + Prisma API
├─ frontend/  # React + TanStack Router + Tailwind
├─ package.json  # Root scripts for installing & running
```
