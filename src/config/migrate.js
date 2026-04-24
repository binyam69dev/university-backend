import {pool} from './database.js';
import { createTables } from './schema.js';

async function migrate() {
    try {
        console.log('Starting database migration...');
        await createTables();
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();