// Test database connection with Kysely
const { Kysely, MssqlDialect } = require('kysely');
const Tedious = require('tedious');
const Tarn = require('tarn');

require('dotenv').config({ path: '.env.local' });

const server = process.env.MSSQL_SERVER;
const database = process.env.MSSQL_DATABASE;
const userName = process.env.MSSQL_USER;
const password = process.env.MSSQL_PASSWORD;
const encrypt = process.env.MSSQL_ENCRYPT === 'true';

console.log('Testing connection with:');
console.log('Server:', server);
console.log('Database:', database);
console.log('User:', userName);
console.log('Encrypt:', encrypt);

const dialect = new MssqlDialect({
  tarn: {
    ...Tarn,
    options: {
      min: 0,
      max: 1,
    },
  },
  tedious: {
    ...Tedious,
    connectionFactory: () =>
      new Tedious.Connection({
        server: server,
        authentication: {
          type: 'default',
          options: {
            userName: userName,
            password: password,
          },
        },
        options: {
          database: database,
          encrypt,
          rowCollectionOnRequestCompletion: true,
          trustServerCertificate: false,
        },
      }),
  },
});

const db = new Kysely({ dialect });

async function testConnection() {
  try {
    console.log('Attempting to connect...');
    const result = await db.selectFrom('sys.databases').select('name').limit(1).execute();
    console.log('✅ Connection successful!');
    console.log('Test query result:', result);
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error.message);
    console.error('Full error:', error);
  } finally {
    await db.destroy();
  }
}

testConnection();