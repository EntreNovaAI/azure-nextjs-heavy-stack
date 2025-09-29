// Initial Kysely migration for auth tables on MSSQL (Azure SQL)
// Based on Kysely migration docs: https://kysely.dev/docs/migrations
// Note: We use raw SQL to support IF NOT EXISTS/IF EXISTS patterns in T-SQL.

import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Create dbo.[User]
  await sql`
    IF NOT EXISTS (
      SELECT * FROM sys.objects 
      WHERE object_id = OBJECT_ID(N'dbo.[User]') AND type IN (N'U')
    )
    BEGIN
      CREATE TABLE dbo.[User] (
        id                NVARCHAR(100)  NOT NULL PRIMARY KEY,
        name              NVARCHAR(255)  NULL,
        email             NVARCHAR(255)  NULL,
        emailVerified     DATETIME2      NULL,
        image             NVARCHAR(2083) NULL,
        accessLevel       NVARCHAR(50)   NOT NULL CONSTRAINT DF_User_accessLevel DEFAULT ('free'),
        stripeCustomerId  NVARCHAR(100)  NULL,
        createdAt         DATETIME2      NOT NULL CONSTRAINT DF_User_createdAt DEFAULT (SYSUTCDATETIME()),
        updatedAt         DATETIME2      NOT NULL CONSTRAINT DF_User_updatedAt DEFAULT (SYSUTCDATETIME())
      );
      CREATE UNIQUE INDEX IX_User_Email ON dbo.[User] (email) WHERE email IS NOT NULL;
    END
  `.execute(db)

  // Create dbo.[Account]
  await sql`
    IF NOT EXISTS (
      SELECT * FROM sys.objects 
      WHERE object_id = OBJECT_ID(N'dbo.[Account]') AND type IN (N'U')
    )
    BEGIN
      CREATE TABLE dbo.[Account] (
        id                 NVARCHAR(100) NOT NULL PRIMARY KEY,
        userId             NVARCHAR(100) NOT NULL,
        type               NVARCHAR(255) NOT NULL,
        provider           NVARCHAR(255) NOT NULL,
        providerAccountId  NVARCHAR(255) NOT NULL,
        refresh_token      NVARCHAR(MAX) NULL,
        access_token       NVARCHAR(MAX) NULL,
        expires_at         INT NULL,
        token_type         NVARCHAR(100) NULL,
        scope              NVARCHAR(1000) NULL,
        id_token           NVARCHAR(MAX) NULL,
        session_state      NVARCHAR(255) NULL,
        CONSTRAINT FK_Account_User FOREIGN KEY (userId) REFERENCES dbo.[User](id) ON DELETE CASCADE
      );
      CREATE UNIQUE INDEX IX_Account_Provider_ProviderAccountId ON dbo.[Account](provider, providerAccountId);
    END
  `.execute(db)

  // Create dbo.[Session]
  await sql`
    IF NOT EXISTS (
      SELECT * FROM sys.objects 
      WHERE object_id = OBJECT_ID(N'dbo.[Session]') AND type IN (N'U')
    )
    BEGIN
      CREATE TABLE dbo.[Session] (
        id            NVARCHAR(100) NOT NULL PRIMARY KEY,
        sessionToken  NVARCHAR(255) NOT NULL,
        userId        NVARCHAR(100) NOT NULL,
        expires       DATETIME2      NOT NULL,
        CONSTRAINT UQ_Session_SessionToken UNIQUE (sessionToken),
        CONSTRAINT FK_Session_User FOREIGN KEY (userId) REFERENCES dbo.[User](id) ON DELETE CASCADE
      );
    END
  `.execute(db)

  // Create dbo.[VerificationToken]
  await sql`
    IF NOT EXISTS (
      SELECT * FROM sys.objects 
      WHERE object_id = OBJECT_ID(N'dbo.[VerificationToken]') AND type IN (N'U')
    )
    BEGIN
      CREATE TABLE dbo.[VerificationToken] (
        identifier NVARCHAR(255) NOT NULL,
        token      NVARCHAR(255) NOT NULL,
        expires    DATETIME2      NOT NULL,
        CONSTRAINT UQ_VerificationToken_Token UNIQUE (token)
      );
      CREATE UNIQUE INDEX IX_VerificationToken_Identifier_Token ON dbo.[VerificationToken](identifier, token);
    END
  `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop in dependency order
  await sql`
    IF OBJECT_ID(N'dbo.[VerificationToken]', N'U') IS NOT NULL
    BEGIN
      DROP TABLE dbo.[VerificationToken];
    END
  `.execute(db)

  await sql`
    IF OBJECT_ID(N'dbo.[Session]', N'U') IS NOT NULL
    BEGIN
      DROP TABLE dbo.[Session];
    END
  `.execute(db)

  await sql`
    IF OBJECT_ID(N'dbo.[Account]', N'U') IS NOT NULL
    BEGIN
      DROP TABLE dbo.[Account];
    END
  `.execute(db)

  await sql`
    IF OBJECT_ID(N'dbo.[User]', N'U') IS NOT NULL
    BEGIN
      DROP TABLE dbo.[User];
    END
  `.execute(db)
}


