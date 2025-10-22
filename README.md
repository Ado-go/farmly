# Farmly – Eshop Project

Farmly is an e-commerce application for managing farms, products, and users. It is built with Node.js, React, Prisma, and PostgreSQL.

---

## Requirements

Before running the project, make sure you have installed the following:

- [Node.js](https://nodejs.org/) v20+  
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)  
- [PostgreSQL](https://www.postgresql.org/) v15+  

---

## Project Structure
farmly/\
├─ backend/ # Node.js + Express + Prisma API\
├─ frontend/ # React + TanStack Router + TailwindCSS\
├─ package.json # Main repo scripts for running backend + frontend

---

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/Ado-go/farmly.git
cd farmly
```
### 2. Install dependencies
```bash
npm run install:all
```

### 3. Set up environment variables
Create a .env file in the backend folder and add the following:
```yaml
# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/farmly_db

# Backend port
PORT=5000

# Client URL (frontend)
CLIENT_URL=http://localhost:3000

# JWT secrets
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
RESET_TOKEN_SECRET=your_reset_token_secret

# Email configuration (for password reset and notifications)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email_user
EMAIL_PASS="your_email_app_password"
EMAIL_FROM="Farmly <noreply@example.com>"
```

### 4. Set up the database

1. Create a PostgreSQL database, e.g., farmly_db.

2. Run Prisma migrations to create the database schema:
```bash
cd backend
npx prisma migrate dev --name init
```

### 5. Seed the database (optional)
in backend/ 
```bash
npm run prisma:seed
```
To clear the database before seeding, you can run:
```bash
npm run prisma:clear
```

### 6. Start the application

From the main repo folder:
```bash
npm start
```

### Testing
in backend/ run
```bash
npm run test
```
