# MongoDB Atlas setup for Hostinger

ProjectManager uses MongoDB through the Express server. The browser never receives
the MongoDB connection string.

## Hostinger connection

1. Open the Node.js Web App dashboard in Hostinger.
2. Under **Database**, click **Connect** and select **MongoDB Atlas**.
3. Follow the Atlas authorization/setup flow.
4. In **Settings and redeploy → Environment Variables**, confirm that Hostinger
   added the MongoDB connection string. This application accepts `MONGODB_URI`,
   `MONGO_URL`, or `DATABASE_URL`.
5. Add these variables if they are not present:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=projectmanager
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=production
```

6. Save and redeploy.

## Verify

Open `/api/health`. A successful response looks like:

```json
{"status":"ok","database":"connected","provider":"mongodb","database_name":"projectmanager"}
```

The first successful API connection creates the required indexes. Collections are
created automatically when the first account and project are inserted; no SQL or
manual schema import is required.

Do not commit `MONGODB_URI` or paste it into browser/frontend code.
