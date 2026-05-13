# Setup Guide — Workout App with Supabase

## What this gives you
- Multi-client workout app with a real database
- Coach dashboard at yourapp.vercel.app/coach
- Each client gets a unique link: yourapp.vercel.app?client=TOKEN
- All data (logs, measurements, PRs, messages) stored in Supabase
- Real-time messaging between you and clients

---

## Step 1 — Create a Supabase project

1. Go to supabase.com and sign up (free)
2. Click "New Project"
3. Name it "workout-app", pick a region close to you, set a database password
4. Wait about 2 minutes for it to provision

---

## Step 2 — Run the database schema

1. In your Supabase project, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Open the file `supabase_schema.sql` from this project
4. Paste the entire contents into the SQL editor
5. Click "Run" — you should see "exercises_seeded: 60" at the bottom

This creates all the tables, security policies, and seeds the exercise library.

---

## Step 3 — Create your coach account

1. In Supabase, go to "Authentication" → "Users"
2. Click "Add User" → "Create New User"
3. Enter your email and a password
4. Copy the user ID (UUID) shown
5. Go to SQL Editor and run:
   ```sql
   INSERT INTO coaches (id, name, email)
   VALUES ('YOUR-USER-ID-HERE', 'Your Name', 'your@email.com');
   ```

---

## Step 4 — Get your API keys

1. In Supabase, go to Settings → API
2. Copy "Project URL" → this is REACT_APP_SUPABASE_URL
3. Copy "anon public" key → this is REACT_APP_SUPABASE_ANON_KEY

---

## Step 5 — Deploy to Vercel

### Option A — Drag and drop (easiest)
1. Go to vercel.com/new
2. Drag the entire workout-pwa folder into the browser
3. Before clicking Deploy, click "Environment Variables"
4. Add:
   - REACT_APP_SUPABASE_URL = (your project URL)
   - REACT_APP_SUPABASE_ANON_KEY = (your anon key)
5. Click Deploy

### Option B — GitHub (recommended for updates)
1. Push this project to a GitHub repo
2. Connect repo to Vercel
3. Add the environment variables in Vercel project settings
4. Deploy

---

## Step 6 — Create your first client

1. Go to yourapp.vercel.app/coach
2. Sign in with the email and password from Step 3
3. Click "+ New Client"
4. Fill in their details
5. After creating, copy the unique client link
6. Send it to your client — that's their app

---

## Step 7 — Create and assign a plan

1. In the coach dashboard, tap "Plan Builder"
2. Create a new plan and add exercises day by day
3. Go back to the client, tap "Assign Plan"
4. Select the plan — they'll see it immediately when they open their link

---

## How clients access the app

Each client gets a URL like:
`https://yourapp.vercel.app?client=abc123def456`

When they open this link:
- Their workout plan loads automatically
- All their logs, measurements, and PRs save to the database
- They can send you messages from the app
- You see everything in the coach dashboard

They can add it to their iPhone home screen:
Safari → Share → Add to Home Screen

---

## Local development

Create a .env file in the project root:
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

Then run:
```
npm install
npm start
```

---

## Coach dashboard is at /coach

yourapp.vercel.app/coach → requires your coach login
yourapp.vercel.app?client=TOKEN → client view (no login)

---

## Updating a client's plan

When you want to change exercises or progression:
1. Go to coach dashboard → client → Assign Plan
2. Create a modified plan in Plan Builder
3. Assign the new plan — takes effect immediately

Their previous workout logs are preserved regardless of plan changes.
