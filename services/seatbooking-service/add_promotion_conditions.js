import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function addPromotionConditions() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL?.includes('sslmode=require') 
            ? { rejectUnauthorized: false } 
            : false,
    });

    try {
        await client.connect();
        console.log('📦 Connected to database');

        console.log('🔧 Adding promotion condition columns...');
        
        // Add applicable_to column
        await client.query(`
            ALTER TABLE promotions 
            ADD COLUMN IF NOT EXISTS applicable_to VARCHAR(20) DEFAULT 'ALL' 
            CHECK (applicable_to IN ('ALL', 'MOVIES', 'COMBOS', 'TICKETS'));
        `);
        console.log('✅ Added applicable_to column');
        
        // Add applicable_items column
        await client.query(`
            ALTER TABLE promotions 
            ADD COLUMN IF NOT EXISTS applicable_items JSONB DEFAULT '[]'::jsonb;
        `);
        console.log('✅ Added applicable_items column');
        
        // Add min_tickets column
        await client.query(`
            ALTER TABLE promotions 
            ADD COLUMN IF NOT EXISTS min_tickets INTEGER DEFAULT 1;
        `);
        console.log('✅ Added min_tickets column');
        
        // Update existing rows with default values
        await client.query(`
            UPDATE promotions 
            SET applicable_to = 'ALL', 
                applicable_items = '[]'::jsonb, 
                min_tickets = 1
            WHERE applicable_to IS NULL;
        `);
        console.log('✅ Updated existing rows with default values');
        
        // Verify columns
        const result = await client.query(`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'promotions' 
            AND column_name IN ('applicable_to', 'applicable_items', 'min_tickets')
            ORDER BY column_name;
        `);
        
        console.log('\n📊 Added columns:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type}): ${row.column_default || 'no default'}`);
        });
        
        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

addPromotionConditions();
