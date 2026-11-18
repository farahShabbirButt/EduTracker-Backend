# Putting EduTracker online

EduTracker runs free on three services:

| Service | What it does | Free plan |
|---|---|---|
| [Render](https://render.com) | Runs the server, which serves the app and the API at one address | Sleeps after about 15 idle minutes; the next visit takes up to a minute |
| [Neon](https://neon.tech) | Holds the PostgreSQL database | About 0.5 GB, plenty for one school |
| [Brevo](https://www.brevo.com) | Sends password-reset emails | 300 emails a day |

The live address is **https://farrukh-academy-edutracker.onrender.com**.

You'll copy a few secret values (the database connection string, the Brevo key, the admin password) from one site into another. Paste them only into the places named here. Never commit them to Git, and never paste them in chat: both repos are public.

Plan and reasons: `eduTrackerDocs/Plans/2026-11-18-phase-7-free-hosting.md`.

---

## 1. Neon: the database

1. Sign up at neon.tech (signing in with GitHub is fine).
2. Create a project:
   - **Name:** `edutracker`
   - **PostgreSQL version:** 17
   - **Region:** AWS Asia Pacific (Singapore), the same region as the Render service.
3. Open **Connect** on the project dashboard:
   - Turn **Connection pooling off**, so you get the direct connection string.
   - Copy the string. It looks like `postgresql://<user>:<password>@ep-....aws.neon.tech/neondb?sslmode=require...`.
4. Add `&schema=edu_tracker` to the end. This is your **DATABASE_URL**. The schema name must be `edu_tracker`, because an early migration names it.

## 2. Brevo: email

1. Sign up at brevo.com.
2. Go to **Senders, Domains & Dedicated IPs → Senders → Add a sender**:
   - **Name:** e.g. `EduTracker`.
   - **Email:** an address you can read, e.g. the school's Gmail.
   - Confirm the email Brevo sends you.
3. Go to **SMTP & API → API Keys → Generate a new API key** and copy it. This is your **BREVO_API_KEY**. Brevo shows it only once.
4. Your **EMAIL_FROM** is that name and address, e.g. `EduTracker <school@gmail.com>`.

Emails sent "from" a Gmail address through Brevo sometimes land in spam. Check the spam folder when testing. A domain of the school's own, later, fixes that.

## 3. Render: the app

1. Sign up at render.com with GitHub, and allow it to see the `EduTracker-Backend` repo.
2. Go to **New → Blueprint** and pick `EduTracker-Backend`, branch `main`. Render reads `render.yaml`, which already sets:
   - the service name `farrukh-academy-edutracker`
   - the Singapore region and the free plan
   - the build and start commands
   - `NODE_ENV`, `TZ`, `WEB_DIST`
   - a generated `JWT_SECRET`
3. Render asks for the four values `render.yaml` leaves blank:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | from step 1 |
   | `FRONTEND_URL` | `https://farrukh-academy-edutracker.onrender.com` |
   | `EMAIL_FROM` | from step 2 |
   | `BREVO_API_KEY` | from step 2 |

4. Press **Apply**. The first build takes a few minutes. When the log shows `Server running on port ...`, the service is live.
5. Check the address at the top of the service page.
   - **If the name was taken,** it shows a random ending, e.g. `farrukh-academy-edutracker-x1y2.onrender.com`. Delete that service, change `name:` in `render.yaml` to the backup `farrukh-edutracker`, then:
     - set `FRONTEND_URL` to the new address
     - merge the change
     - repeat from step 2

Every start runs `prisma migrate deploy` first, so the database tables are always up to date with the code.

## 4. The first admin login

The live database starts empty. Create the admin from your computer, in the `edutracker-backend` folder. These commands ask for the secrets without showing them or saving them in your shell history:

```bash
read -rs -p "Neon DATABASE_URL: " DATABASE_URL; echo; export DATABASE_URL
read -rs -p "Admin password (8+ characters): " ADMIN_PASSWORD; echo; export ADMIN_PASSWORD
ADMIN_EMAIL='<the admin email>' SEED_DEV_DATA=false npx prisma db seed
unset DATABASE_URL ADMIN_PASSWORD
```

`SEED_DEV_DATA=false` matters: your local `.env` may say `true`, and that would add sample classes and grades to the live database.

Then open the live address and sign in. In **Settings**:
- fill in School Details (with the logo and school year start)
- set the Grade Boundaries

## 5. Check it works

- Sign in and out, on a computer and a phone.
- Use **Forgot password** to get a real email, open the link and set a password.
- Wrong passwords: after 10 in 15 minutes, sign-in is blocked for a while. That's expected.
- Check the login limit counts each visitor separately:
  - In Render's **Logs**, find the line for your sign-in (`"url":"/edu-tracker/api/v1/auth/login"`). Its `"ip"` should be your own address; a "what is my IP" site shows it.
  - If it's a different, private-looking address (e.g. starting `10.`), set `TRUST_PROXY` to `2` in **Environment** and check again.
- Print a monthly card and a session card.
- Import a large Excel file (several hundred rows).
- Leave the site for 20 minutes, then open it again. The first load is slow while the server wakes up. A notice says so if the app was already open.

## 6. Keeping it awake (optional)

At [UptimeRobot](https://uptimerobot.com), add a free HTTP monitor for `https://farrukh-academy-edutracker.onrender.com/health` every 5 minutes. The server then rarely sleeps. It stays within Render's 750 free hours a month, but Render doesn't promise it will always work.

## 7. Updating the live site

- **Backend:** merging to `main` in `EduTracker-Backend` deploys automatically.
- **Frontend:** merging to `main` in `EduTracker` doesn't deploy automatically. In Render, open the service and choose **Manual Deploy → Deploy latest commit**. The build fetches the frontend's `main` each time.
- `WEB_REF` in the service's Environment picks which frontend branch is built (default `main`). There is only one service, so the branch you name is what the school sees. Use it only briefly, and remove it afterwards.

## 8. Backups

Neon's free plan keeps only about a day of history. So take your own backup weekly, and before any big import. It needs PostgreSQL 17's `pg_dump` on your computer.

```bash
read -rs -p "Neon DATABASE_URL: " DATABASE_URL; echo; export DATABASE_URL
bash scripts/backup-db.sh          # writes backups/edutracker-<date>.dump
unset DATABASE_URL
```

A backup holds every student's details and marks. Keep it somewhere private, such as the school's Google Drive. The `backups/` folder is never committed.

**To restore** (this replaces the database's contents, and the script asks you to confirm):

```bash
read -rs -p "DATABASE_URL to restore into: " DATABASE_URL; echo; export DATABASE_URL
bash scripts/restore-db.sh backups/edutracker-<date>.dump
unset DATABASE_URL
```

Restore a backup into a database at the same or an earlier version of EduTracker. If the live database has a table the backup doesn't know, the restore stops and changes nothing; restore into a new Neon branch instead, then point `DATABASE_URL` at it.

Then restart the Render service (**Manual Deploy → Restart service**). To test a backup without touching live data, restore it into a new Neon branch first.

## 9. When something goes wrong

- **Build or start failed:** open the service's **Logs**.
  - If the log says *Missing or wrong production settings*, it lists each setting to fix under **Environment**.
  - If it says *WEB_DIST ... no index.html*, the frontend build failed. Look further up the log.
- **Reset emails don't arrive:** check spam, then Brevo's **Transactional → Logs**. Render's log shows *Brevo refused the email* with Brevo's reason, e.g. an unverified sender.
- **Everyone was signed out:** `JWT_SECRET` changed, or the password was changed or reset; both end every session. Sign in again.
- **Slow first load:** the free server was asleep. See step 6.
