import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function inspectTables() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  try {
    console.log('\n📊 INSPECTING DATABASE TABLES\n');

    // Inspect reservations table
    console.log('=== RESERVATIONS TABLE ===');
    const reservations = await (prisma as any).$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Reservations'
      ORDER BY ordinal_position
    `;
    console.log('Columns:', reservations);

    // Sample data
    const resSample = await (prisma as any).$queryRaw`SELECT * FROM "Reservations" LIMIT 1`;
    console.log('Sample:', resSample ? Object.keys(resSample[0] || {}) : 'No data');

    // Inspect webhelp table
    console.log('\n=== WEBHELP TABLE ===');
    const webhelp = await (prisma as any).$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Webhelp'
      ORDER BY ordinal_position
    `;
    console.log('Columns:', webhelp);

    // Sample data
    const webSample = await (prisma as any).$queryRaw`SELECT * FROM "Webhelp" LIMIT 1`;
    console.log('Sample:', webSample ? Object.keys(webSample[0] || {}) : 'No data');

    // Inspect colt_file table
    console.log('\n=== COLT_FILE TABLE ===');
    const coltFile = await (prisma as any).$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Colt_file'
      ORDER BY ordinal_position
    `;
    console.log('Columns:', coltFile);

    // Sample data
    const coltSample = await (prisma as any).$queryRaw`SELECT * FROM "Colt_file" LIMIT 1`;
    console.log('Sample:', coltSample ? Object.keys(coltSample[0] || {}) : 'No data');

    // Check webhelp data for type_dappel values
    console.log('\n=== CHECKING WEBHELP VALUES ===');
    const typeValues = await (prisma as any).$queryRaw`
      SELECT DISTINCT type_dappel FROM "Webhelp" LIMIT 20
    `;
    console.log('type_dappel values:', typeValues);

    const codeValues = await (prisma as any).$queryRaw`
      SELECT DISTINCT libelle_code_appel FROM "Webhelp" LIMIT 20
    `;
    console.log('libelle_code_appel values:', codeValues);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectTables();
