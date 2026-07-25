# Railway PostgreSQL Backup & Restore Guide

A complete step-by-step procedure for exporting your Railway database to a `.sql` file and restoring it into any new Railway account or project.

---

## Prerequisites

You need `pg_dump` and `psql` installed on your local machine.

**Check if already installed:**
```bash
pg_dump --version
psql --version
```

**Install if missing:**

| OS | Command |
|---|---|
| macOS | `brew install postgresql` |
| Ubuntu / Debian | `sudo apt install postgresql-client` |
| Windows | Download from https://www.postgresql.org/download/windows/ and install the "Command Line Tools" component |

---

## Part 1 — Get Your Railway Connection String

1. Open your Railway project dashboard at [railway.app](https://railway.app)
2. Click on your **PostgreSQL** service
3. Go to the **Connect** tab
4. Under **Available Variables**, find `DATABASE_URL` — it looks like this:
   ```
   postgresql://postgres:AbCdEfGhIj123@monorail.proxy.rlwy.net:12345/railway
   ```
5. Copy this full URL — you'll use it in every command below

> **Tip:** You can also find individual credentials (host, port, user, password, database name) listed separately on the same page if you prefer to use them instead of the URL.

---

## Part 2 — Create the Backup (.sql file)

Open your terminal and run:

```bash
pg_dump "YOUR_DATABASE_URL" > backup.sql
```

**Real example:**
```bash
pg_dump "postgresql://postgres:AbCdEfGhIj123@monorail.proxy.rlwy.net:12345/railway" > backup.sql
```

### What this does
- `pg_dump` connects to your Railway database
- It reads every table, row, index, and constraint
- It writes everything as SQL statements into `backup.sql`
- The file is saved in whatever directory your terminal is currently in

### Verify the backup was created
```bash
ls -lh backup.sql
```
You should see the file size. Even a small database will produce a file of at least a few KB.

### Peek inside to confirm it looks right
```bash
head -30 backup.sql
```
You should see lines starting with `--` comments and `CREATE TABLE` statements.

---

## Part 3 — What the .sql File Contains

The `backup.sql` file is a plain text file that includes:

| What | Example SQL inside the file |
|---|---|
| Table definitions | `CREATE TABLE users (id VARCHAR(255) PRIMARY KEY, ...);` |
| All data rows | `INSERT INTO users VALUES ('user_abc123', 'john@email.com', ...);` |
| Indexes | `CREATE INDEX ... ON monthly_records (...);` |
| Constraints | `ALTER TABLE settings ADD CONSTRAINT ... FOREIGN KEY ...;` |
| Sequences | `SELECT setval('..._seq', 42, true);` |

Everything needed to reconstruct the database exactly as it was.

---

## Part 4 — Store the Backup Safely

**Option A — Keep it locally (simplest)**
```
/Documents/khata-backups/backup-2024-07-25.sql
```
Rename it with the date so you can keep multiple versions.

**Option B — Private GitHub repository**
```bash
# Create a private repo on GitHub first, then:
git init khata-backups
cd khata-backups
cp /path/to/backup.sql backup-2024-07-25.sql
git add .
git commit -m "Database backup July 25 2024"
git remote add origin https://github.com/YOUR_USERNAME/khata-backups.git
git push -u origin main
```

> ⚠️ **NEVER push to a public repo.** Your `backup.sql` contains real user data (names, emails, financial records). Always keep it in a private repository or local storage only.

---

## Part 5 — Restore to a New Railway Account / Project

### Step 1 — Create a new PostgreSQL database on Railway

1. Go to [railway.app](https://railway.app) and log in to your **new account**
2. Create a new project
3. Click **+ New** → **Database** → **Add PostgreSQL**
4. Wait for it to provision (takes about 30 seconds)
5. Go to the **Connect** tab and copy the new `DATABASE_URL`

### Step 2 — Restore the backup

```bash
psql "YOUR_NEW_DATABASE_URL" < backup.sql
```

**Real example:**
```bash
psql "postgresql://postgres:NewPassword456@monorail.proxy.rlwy.net:67890/railway" < backup.sql
```

This will replay every SQL statement in the file — creating tables, inserting all rows, and applying all indexes and constraints. Your database will be an exact copy of the original.

### Step 3 — Verify the restore worked

Connect to the new database and check a few tables:

```bash
psql "YOUR_NEW_DATABASE_URL"
```

Once connected, run these SQL commands:

```sql
-- List all tables
\dt

-- Check how many users exist
SELECT COUNT(*) FROM users;

-- Check how many monthly records exist
SELECT COUNT(*) FROM monthly_records;

-- Exit
\q
```

If the counts match your original database, the restore was successful.

### Step 4 — Update your app's DATABASE_URL

In your new Railway project, set the `DATABASE_URL` environment variable in your app service to point to the new database. Railway usually does this automatically if both services are in the same project, but verify it under your app service's **Variables** tab.

---

## Quick Reference — All Commands at a Glance

```bash
# 1. Export (backup)
pg_dump "postgresql://user:pass@host:port/dbname" > backup.sql

# 2. Verify backup file exists
ls -lh backup.sql

# 3. Restore to new database
psql "postgresql://newuser:newpass@newhost:newport/newdbname" < backup.sql

# 4. Open psql shell to verify
psql "postgresql://newuser:newpass@newhost:newport/newdbname"
```

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `pg_dump: command not found` | PostgreSQL client not installed | Run `brew install postgresql` (Mac) or `sudo apt install postgresql-client` (Linux) |
| `connection refused` | Wrong host/port or Railway service is sleeping | Check the connection string on Railway's Connect tab; make sure the service is active |
| `SSL connection required` | Missing SSL flag | Add `?sslmode=require` to the end of the URL |
| `role "postgres" does not exist` | Username mismatch | Copy the exact username from Railway's Connect tab |
| `database already exists` errors on restore | Tables already exist in the new DB | Drop and recreate the database, or use `psql ... -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"` before restoring |

---

## Recommended Backup Schedule

For a low-traffic app like Khata, a **monthly backup** before your Railway credits reset is a good habit:

1. Run `pg_dump` on the last day of each month
2. Save as `backup-YYYY-MM.sql`
3. Keep the last 3 months of backups minimum

This ensures you always have a recent snapshot even if you need to switch hosting providers or accounts.
