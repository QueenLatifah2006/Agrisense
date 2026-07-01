import { executeDailyTasks } from './src/services/schedulerService.js';
import { initializeDatabase } from './src/config/initDb.js';

async function run() {
  console.log("Initializing database connection...");
  await initializeDatabase();
  console.log("Starting daily task manually...");
  await executeDailyTasks();
  console.log("Daily task complete. Exiting...");
  process.exit(0);
}

run().catch(err => {
  console.error("Error running daily task:", err);
  process.exit(1);
});
