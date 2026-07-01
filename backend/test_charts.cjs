const { query } = require('./dist/config/db.js');

async function testQuery() {
  const cropFilter = 'Tomate';
  
  // 1. Demand Data
  const demandQuery = await query(`
    SELECT price, SUM(quantity) as quantity
    FROM crops
    WHERE price > 0 AND quantity > 0 ${cropFilter ? "AND name = $1" : ""}
    GROUP BY price
    ORDER BY price ASC
  `, cropFilter ? [cropFilter] : []);
  console.log("Demand:", demandQuery.rows.length);
  
  // 2. Prediction Data (Monthly averages)
  const monthlyQuery = await query(`
    SELECT 
      TO_CHAR(CAST(price_recorded_date AS DATE), 'YYYY-MM') as month_str,
      AVG(price) as avg_price
    FROM crops
    WHERE price > 0 ${cropFilter ? "AND name = $1" : ""}
    GROUP BY month_str
    ORDER BY month_str ASC
    LIMIT 6
  `, cropFilter ? [cropFilter] : []);
  console.log("Monthly (Prediction):", monthlyQuery.rows);

  // 3. Volatility Data (Weekly min/max/avg)
  const weeklyQuery = await query(`
    SELECT 
      TO_CHAR(CAST(price_recorded_date AS DATE), 'IYYY-IW') as week_str,
      MIN(price) as min_price,
      MAX(price) as max_price,
      AVG(price) as avg_price
    FROM crops
    WHERE price > 0 ${cropFilter ? "AND name = $1" : ""}
    GROUP BY week_str
    ORDER BY week_str DESC
    LIMIT 4
  `, cropFilter ? [cropFilter] : []);
  console.log("Weekly (Volatility):", weeklyQuery.rows);
  
  process.exit();
}

testQuery();
