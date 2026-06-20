# Deploying Prelegal to Fly.io

Prelegal runs as a single Docker container (Next.js static files served by FastAPI). This guide deploys it to Fly.io, which has a free tier generous enough to run a low-traffic app indefinitely.

---

## Prerequisites

- A [Fly.io account](https://fly.io) (free, no credit card required for the free tier)
- `flyctl` CLI installed:
  ```bash
  # macOS
  brew install flyctl

  # Linux
  curl -L https://fly.io/install.sh | sh

  # Windows (PowerShell)
  pwsh -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://fly.io/install.ps1'))"
  ```
- Docker running locally (only needed to build the image; Fly can also build remotely — see step 5)

---

## One-time setup

### 1. Log in to Fly.io

```bash
fly auth login
```

This opens your browser to authenticate. After logging in, return to the terminal.

---

### 2. Choose your app name and update fly.toml

Open `fly.toml` and replace `your-app-name` with a globally unique name (e.g. `prelegal-yourname`):

```toml
app = "prelegal-yourname"
```

> App names become your URL: `https://prelegal-yourname.fly.dev`

---

### 3. Create the Fly app

```bash
fly apps create your-app-name
```

Replace `your-app-name` with the same name you put in `fly.toml`.

---

### 4. Create a persistent volume for SQLite

SQLite data needs to survive deploys and machine restarts. A 1 GB volume is free within Fly's limits.

```bash
fly volumes create prelegal_data --size 1 --region iad --app your-app-name
```

> If you chose a different `primary_region` in `fly.toml`, pass the same region here (e.g. `--region lhr` for London).

The volume name `prelegal_data` must match the `source` in `fly.toml`:
```toml
[[mounts]]
  source = "prelegal_data"
  destination = "/data"
```

---

### 5. Set secrets

Secrets are stored encrypted by Fly and injected as environment variables at runtime. **Never put these in `fly.toml`** (which is committed to git).

**OPENROUTER_API_KEY** — copy from your `.env` file:
```bash
fly secrets set OPENROUTER_API_KEY=sk-or-v1-... --app your-app-name
```

**JWT_SECRET_KEY** — generate a strong random value. If you skip this, the app auto-generates one per boot, which invalidates all sessions on every redeploy.
```bash
# Generate a strong secret (run this once, save the output)
openssl rand -hex 32

# Then set it:
fly secrets set JWT_SECRET_KEY=<paste-the-output-here> --app your-app-name
```

Verify secrets are set:
```bash
fly secrets list --app your-app-name
```

---

### 6. Deploy

From the project root (where `fly.toml` lives):

```bash
fly deploy --app your-app-name
```

Fly will:
1. Build the Docker image remotely (no local Docker required if you pass `--remote-only`)
2. Push it to Fly's internal registry
3. Start a machine with the persistent volume mounted at `/data`

First deploy takes ~3–5 minutes (Node.js build is slow). Subsequent deploys are faster (~1–2 min).

> To build remotely without local Docker:
> ```bash
> fly deploy --remote-only --app your-app-name
> ```

---

### 7. Open the app

```bash
fly open --app your-app-name
```

This opens `https://your-app-name.fly.dev` in your browser.

---

## Subsequent deploys

Every time you push changes and want to redeploy:

```bash
fly deploy --app your-app-name
```

Or from the project root if `fly.toml` has the correct `app` name:

```bash
fly deploy
```

---

## Useful commands

```bash
# Tail live logs
fly logs --app your-app-name

# SSH into the running machine
fly ssh console --app your-app-name

# Check machine status
fly status --app your-app-name

# Scale memory if the app is slow (free tier allows up to 256 MB)
fly scale memory 512 --app your-app-name

# List volumes (confirm the mount exists)
fly volumes list --app your-app-name

# Open a SQLite shell on the running machine
fly ssh console --app your-app-name -C "sqlite3 /data/prelegal.db"
```

---

## Environment variables reference

| Variable | Where to set | Description |
|---|---|---|
| `DB_PATH` | `fly.toml [env]` | Path to SQLite file. Set to `/data/prelegal.db` (on the persistent volume). |
| `OPENROUTER_API_KEY` | `fly secrets set` | API key for OpenRouter (LLM calls). |
| `JWT_SECRET_KEY` | `fly secrets set` | Secret for signing JWT tokens. Generate with `openssl rand -hex 32`. |

---

## Free tier limits (as of 2025)

Fly.io's free allowance per account:

| Resource | Free allowance |
|---|---|
| Shared-CPU VMs | 3 machines |
| RAM | 256 MB per machine |
| Persistent storage | 3 GB total |
| Outbound bandwidth | 100 GB/month |
| Build minutes | Unlimited |

The app is configured with `auto_stop_machines = "stop"` — the VM sleeps after ~5 minutes of no traffic and wakes automatically on the next request (~1–2 second cold start). This keeps you well within the free tier even with a 512 MB machine.

---

## Troubleshooting

**Deploy fails with "No volume named prelegal_data"**
→ Run step 4 to create the volume, then redeploy.

**App starts but AI chat returns 500**
→ Check `OPENROUTER_API_KEY` is set: `fly secrets list --app your-app-name`

**Sessions log out on every redeploy**
→ `JWT_SECRET_KEY` is not set. Set it (step 5) so the same key is used across deploys.

**Out of memory errors in logs**
→ Scale up: `fly scale memory 512 --app your-app-name` (still within free tier on shared CPU).

**SQLite "unable to open database" error**
→ The volume isn't mounted. Confirm with `fly volumes list`. Verify `fly.toml` has the `[[mounts]]` block and the `source` name matches the volume name.

**First request after idle takes too long**
→ Normal — the machine is waking from auto-stop. Set `min_machines_running = 1` in `fly.toml` to keep it always-on (uses more free tier allowance).
