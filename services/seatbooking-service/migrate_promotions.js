import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Client } = pg;

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL?.includes('sslmode=require') 
            ? { rejectUnauthorized: false } 
            : false,
    });

    try {
        await client.connect();
        console.log('📦 Connected to database');

        // Read SQL file
        const sqlPath = path.join(__dirname, 'create_promotions_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🔧 Running migration...');
        await client.query(sql);
        
        console.log('✅ Promotions table created successfully!');
        
        // Verify table exists
        const result = await client.query(`
            SELECT COUNT(*) FROM promotions;
        `);
        console.log(`📊 Current promotions count: ${result.rows[0].count}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
