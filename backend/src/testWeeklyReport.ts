import { query } from './config/db.js';
import { generateWeeklyReport } from './services/weeklyReportService.js';
import { initializeDatabase } from './config/initDb.js';

async function testRun() {
  console.log('--- STARTING WEEKLY REPORT TEST VALIDATION ---');
  
  try {
    // 1. Initialize Database
    await initializeDatabase();
    
    // 2. Clean any existing test crop records
    console.log('Cleaning crops table for test...');
    await query("DELETE FROM crops WHERE name = 'Maïs Jaune Test'");
    
    // 3. Seed some mock crop price points for the last 7 days
    console.log('Seeding mock crop price points...');
    const today = new Date();
    
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const priceVal = 400 + i * 15; // varying prices: 400, 415, 430, 445, 460
      
      console.log(`Seeding price point: ${dateStr} -> ${priceVal} FCFA`);
      await query(
        `INSERT INTO crops (name, type, planting_date, area, status, variety, progress, price_recorded_date, price, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        ['Maïs Jaune Test', 'Maraîchage', date, (priceVal / 100).toString(), 'active', 'Yaoundé, Zone Centre', 100, dateStr, priceVal, date]
      );
    }
    
    console.log('Mock price points successfully seeded.');
    
    // 4. Run the weekly report generation
    console.log('Invoking generateWeeklyReport()...');
    await generateWeeklyReport();
    
    console.log('--- WEEKLY REPORT TEST COMPLETED ---');
  } catch (err) {
    console.error('Error during weekly report test:', err);
  } finally {
    process.exit(0);
  }
}

testRun();
