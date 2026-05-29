const { Pool } = require('pg');
require('dotenv').config();

async function inspect() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('\n📊 INSPECTING DATABASE TABLES\n');

    // Get all tables
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('Tables:', tables.rows.map(r => r.table_name));

    // Inspect each table
    for (const { table_name } of tables.rows) {
      console.log(`\n=== ${table_name.toUpperCase()} ===`);
      
      // Get columns
      const columns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table_name]);
      
      console.log('Columns:', columns.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
      
      // Get sample row
      const sample = await pool.query(`SELECT * FROM "${table_name}" LIMIT 1`);
      if (sample.rows.length > 0) {
        console.log('Sample keys:', Object.keys(sample.rows[0]).join(', '));
      }

      // For webhelp, check distinct values
      if (table_name === 'Webhelp') {
        console.log('\n--- Checking webhelp values ---');
        
        const typeVals = await pool.query(`
          SELECT DISTINCT type_dappel FROM "Webhelp" LIMIT 10
        `);
        console.log('type_dappel:', typeVals.rows.map(r => r.type_dappel));

        const codeVals = await pool.query(`
          SELECT DISTINCT libelle_code_appel FROM "Webhelp" LIMIT 10
        `);
        console.log('libelle_code_appel:', codeVals.rows.map(r => r.libelle_code_appel));
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

inspect();
