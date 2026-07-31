# Supabase setup

The application keeps authentication and authorization in the Express API. Supabase
is used as hosted PostgreSQL; the React frontend never receives database
credentials or a Supabase service key.

## 1. Create the tables

1. Create or open your Supabase project.
2. Go to **SQL Editor** and select **New query**.
3. Paste the contents of `database.sql` and click **Run**.

The script creates all tables, relationships, constraints, and indexes. Row Level
Security is enabled to prevent browser access through the Supabase Data API. The
Node server connects with the service role and performs the application's own JWT
and resource authorization.

## 2. Connect it in Hostinger

In the Hostinger Node.js Web App dashboard, go to **Database**, click **Connect**,
choose **Supabase**, authorize your Supabase account, and select this project.
Hostinger adds the connection variables and triggers a deployment automatically.

```env
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_SIDE_SERVICE_ROLE_KEY
JWT_SECRET=GENERATE_A_LONG_RANDOM_VALUE
```

Set these values in the web app host's environment-variable or secrets panel.
Do not prefix them with `VITE_`, commit them, or add them to frontend code.
Percent-encode special characters in the password when it appears in a URL.

You can generate a JWT secret locally with:

```bash
openssl rand -hex 32
```

The server recognizes `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_KEY`, and the common
anon-key names. A service-role key is required with the secure RLS configuration
in `database.sql`; never expose that key through a `VITE_` variable or browser code.

## 4. Verify

After deployment, open `/api/health`. A working connection returns:

```json
{"status":"ok","database":"connected","supabase_url_configured":true}
```

Then register a new account through the application. A successful
registration creates a user, a starter project, and the default To Do, In
Progress, and Done columns in Supabase.

If the API reports missing configuration, confirm that the Supabase variables and
`JWT_SECRET` exist under Hostinger **Environment Variables**, then redeploy.
