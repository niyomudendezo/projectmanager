# Hostinger MySQL setup

ProjectManager connects from its Express server to the MySQL database managed in
Hostinger and phpMyAdmin. The server automatically creates `app_users` and
`app_projects` when it connects for the first time.

Add these variables under **Web App → Environment variables**:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=u344479203_projectmanager
MYSQL_USER=u344479203_postgres
MYSQL_PASSWORD=YOUR_PRIVATE_DATABASE_PASSWORD
JWT_SECRET=YOUR_PRIVATE_RANDOM_SECRET
NODE_ENV=production
```

Apply the changes and redeploy. Verify the connection at `/api/health`; it should
report `"provider":"mysql"`. Never commit the database password or JWT secret.
