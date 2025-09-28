import fs from 'fs/promises';
import pg from 'pg';

const { Client } = pg;

async function run() {
  console.log('Starting database cleanup script...');

  try {
    // 1. Read database configuration
    const dbConfigRaw = await fs.readFile('db-config.json', 'utf-8');
    const dbConfig = JSON.parse(dbConfigRaw);
    const connectionString = dbConfig.database.connection_string;

    if (!connectionString) {
      throw new Error('Database connection string not found in db-config.json');
    }
    console.log('Successfully read database configuration.');

    // 2. Read the cleanup SQL script
    const cleanupSql = await fs.readFile('04_cleanup_old_functions.sql', 'utf-8');
    console.log('Successfully read cleanup SQL file.');

    // 3. Connect to the database
    const client = new Client({ connectionString });
    await client.connect();
    console.log('Successfully connected to the database.');

    // 4. Execute the cleanup query
    const result = await client.query(cleanupSql);
    console.log('Successfully executed cleanup script.');

    // Log the final message from the SQL script
    if (result.rows && result.rows.length > 0) {
        console.log('Database response:', result.rows[result.rows.length -1]);
    }


    // 5. Close the connection
    await client.end();
    console.log('Database connection closed. Cleanup complete.');

  } catch (error) {
    console.error('An error occurred during the cleanup process:', error);
    process.exit(1); // Exit with an error code
  }
}

run();