# Supabase setup

The application keeps authentication and authorization in the PHP API. Supabase
is used as hosted PostgreSQL; the React frontend never receives database
credentials or a Supabase service key.

## 1. Create the tables

1. Create or open your Supabase project.
2. Go to **SQL Editor** and select **New query**.
3. Paste the contents of `database.sql` and click **Run**.

The script creates all tables, relationships, constraints, and indexes. Row Level
Security is enabled to prevent browser access through the Supabase Data API. The
PHP server connects with the database role and performs the application's own JWT
and resource authorization.

## 2. Copy the server connection

In Supabase, open **Connect** and choose **Transaction pooler**. Use its URI as the
server-side `DATABASE_URL`. The pooler is preferred for hosted web apps and is
usually available over IPv4.

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@POOLER_HOST:6543/postgres?sslmode=require
JWT_SECRET=GENERATE_A_LONG_RANDOM_VALUE
```

Set these values in the web app host's environment-variable or secrets panel.
Do not prefix them with `VITE_`, commit them, or add them to frontend code.
Percent-encode special characters in the password when it appears in a URL.

You can generate a JWT secret locally with:

```bash
openssl rand -hex 32
```

If the host presents separate connection fields instead of a URI, use the
`SUPABASE_DB_*` variables documented in `.env.example`.

## 3. PHP requirement

The deployed PHP runtime must enable the `pdo_pgsql` extension. Verify it with:

```bash
php -m | grep pdo_pgsql
```

## 4. Verify

After deploying, register a new account through the application. A successful
registration creates a user, a starter project, and the default To Do, In
Progress, and Done columns in Supabase.

If the API reports that configuration is missing, confirm that `DATABASE_URL` and
`JWT_SECRET` are defined for the PHP process and restart/redeploy the web app.
