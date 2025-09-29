### SQL Server 2022 setup with SSMS (enable SQL authentication and create login)

This guide shows how to enable SQL Server Authentication (username/password) in SQL Server 2022 using SQL Server Management Studio (SSMS), create a SQL login, and grant database permissions. Use this for local development or on a server you control.

---

### Prerequisites
- Install SQL Server 2022 (Developer or Express edition is fine for development).
- Install SQL Server Management Studio (SSMS).
- Know your SQL Server instance name (e.g., `MSSQLSERVER`, `SQLEXPRESS`, or a named instance).

---

### 1) Enable SQL Server and Windows Authentication (Mixed Mode)
1. Open SSMS and connect using Windows Authentication (your Windows account).
2. In Object Explorer, right‑click your server → Properties.
3. Go to Security.
4. Under Server authentication, select: SQL Server and Windows Authentication mode.
5. Click OK.

You must restart the SQL Server service for this to take effect.

---

### 2) Restart the SQL Server service
- In SSMS: right‑click the server in Object Explorer → Restart.
- Or use SQL Server Configuration Manager → SQL Server Services → right‑click your instance → Restart.

---

### 3) Create a SQL Server login (SQL authentication)
1. In SSMS, expand Security → Logins.
2. Right‑click Logins → New Login…
3. Enter a Login name, e.g., `kysely_user`.
4. Select SQL Server authentication.
5. Enter a strong password.
6. (Optional for development) Uncheck Enforce password policy.
7. Set Default database to the target database (e.g., `MyAppDb`).
8. Click OK.

---

### 4) Map the login to a database user and grant permissions
For development, granting `db_owner` is simplest. For production, use least privilege.

1. Expand Databases → <your database> → Security → Users.
2. Right‑click Users → New User…
3. User type: SQL user with login.
4. User name: (e.g., `kysely_user`).
5. Login name: choose the login you created.
6. Click Membership and check `db_owner` (development) or a narrower role set.
7. Click OK.

---

### 5) Connect from Node.js/Kysely (MSSQL)
Set these environment variables used by the Kysely MSSQL client:

```ini
MSSQL_SERVER=localhost            # or servername, or servername\\instance
MSSQL_DATABASE=MyAppDb
MSSQL_USER=kysely_user
MSSQL_PASSWORD=your_password
MSSQL_ENCRYPT=false               # local dev commonly false; Azure SQL requires true
MSSQL_POOL_MIN=0
MSSQL_POOL_MAX=10
```

Notes:
- Local SQL Server often runs on a named instance. If so, use `servername\\instance`.
- If using a non‑default TCP port, configure it in your driver options (or via SQL Browser).
- For Azure SQL Database, `MSSQL_ENCRYPT` must be `true` and you typically connect to `your-server.database.windows.net`.

---

### 6) Common troubleshooting
- Login failed for user: Mixed mode not enabled, wrong password, or user not mapped to the database.
- Cannot connect: Ensure the SQL Server service is running; enable TCP/IP in SQL Server Configuration Manager → SQL Server Network Configuration.
- Firewall: Allow inbound TCP on port 1433 (default). Named instances may use dynamic ports.
- Named instance resolution: Start the SQL Server Browser service, or connect using `servername,port`.

---

### 7) Production guidance (brief)
- Use least‑privilege roles instead of `db_owner`.
- Enforce strong passwords and password policy.
- Require encryption in transit (`MSSQL_ENCRYPT=true`) and consider `trustServerCertificate=false` with valid certificates.
- Restrict firewall to trusted networks.


