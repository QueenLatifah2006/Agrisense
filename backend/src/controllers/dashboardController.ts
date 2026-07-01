import { Request, Response } from 'express';
import { query } from '../config/db.js';
import { geocodeMarkets } from '../utils/geocoder.js';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const sessionsQuery = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM chat_history 
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    const notesStatus = await query(`
      SELECT status, COUNT(*) as count FROM farmer_notes GROUP BY status
    `);
    const chatsStatus = await query(`
      SELECT status, COUNT(*) as count FROM chat_history GROUP BY status
    `);
    let validated = 0;
    let pending = 0;
    
    notesStatus.rows.forEach((r: any) => {
      if (r.status === 'validated') validated += Number(r.count);
      if (r.status === 'pending') pending += Number(r.count);
    });
    chatsStatus.rows.forEach((r: any) => {
      if (r.status === 'validated') validated += Number(r.count);
      if (r.status === 'pending') pending += Number(r.count);
    });

    const usersQuery = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM users 
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    const zonesQuery = await query(`
      SELECT location as zone, COUNT(*) as count 
      FROM users 
      WHERE location IS NOT NULL AND location != ''
      GROUP BY location
      ORDER BY count DESC
      LIMIT 10
    `);

    const demandQuery = await query(`
      SELECT name, SUM(quantity) as total_quantity
      FROM crops
      GROUP BY name
      ORDER BY total_quantity DESC
      LIMIT 10
    `);

    const marketsQuery = await query(`
      SELECT DISTINCT market, area as zone FROM crops WHERE market IS NOT NULL AND market != ''
    `);
    
    // Geocode markets
    const rawMarketNames = Array.from(new Set<string>(marketsQuery.rows.map((row: any) => row.market)));
    const geocodedMarketsCoords = await geocodeMarkets(rawMarketNames);

    const finalMarkets = marketsQuery.rows.map((row: any) => {
      const geo = geocodedMarketsCoords.find((g: any) => g.market === row.market);
      return {
        market: row.market,
        zone: row.zone,
        coords: geo ? geo.coords : [7.3697, 12.3547]
      };
    });

    res.json({
      sessions: sessionsQuery.rows,
      validation: { validated, pending },
      users: usersQuery.rows,
      zones: zonesQuery.rows,
      demand: demandQuery.rows,
      markets: finalMarkets
    });
  } catch (error) {
    console.error('[DashboardController] Error fetching stats:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques.' });
  }
};

export const getAdvancedChartsData = async (req: Request, res: Response) => {
  try {
    const cropFilter = req.query.crop as string;

    const demandQuery = await query(`
      SELECT price, SUM(quantity) as quantity
      FROM crops
      WHERE price > 0 AND quantity > 0 ${cropFilter ? "AND name = $1" : ""}
      GROUP BY price
      ORDER BY price ASC
    `, cropFilter ? [cropFilter] : []);
    
    let demandData = demandQuery.rows.map(r => ({ price: Number(r.price), quantity: Number(r.quantity) }));
    if (demandData.length < 3) {
      const basePrice = demandData.length > 0 ? demandData[0].price : 400;
      demandData = [
        { price: basePrice * 0.8, quantity: 1500 },
        { price: basePrice * 0.9, quantity: 1200 },
        { price: basePrice, quantity: 1000 },
        { price: basePrice * 1.1, quantity: 700 },
        { price: basePrice * 1.2, quantity: 400 },
      ];
    }

    const structureData = [
      { name: 'Production', value: 45, color: '#22c55e' }, // green
      { name: 'Transport', value: 25, color: '#f59e0b' }, // amber
      { name: 'Marge Vendeur', value: 20, color: '#3b82f6' }, // blue
      { name: 'Taxes/Pertes', value: 10, color: '#ef4444' } // red
    ];

    // Get historical monthly data for prediction
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

    let predictionData: any[] = [];
    if (monthlyQuery.rows.length > 0) {
      predictionData = monthlyQuery.rows.map(r => {
        // Convert "YYYY-MM" to Date
        const parts = r.month_str.split('-');
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
        const price = Number(r.avg_price);
        return {
          month: d.toLocaleDateString('fr-FR', { month: 'short' }),
          price: Math.round(price),
          intervalMin: Math.round(price * 0.95),
          intervalMax: Math.round(price * 1.05)
        };
      });
      
      // Project into the future
      const lastRow = monthlyQuery.rows[monthlyQuery.rows.length - 1];
      const parts = lastRow.month_str.split('-');
      const lastDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
      const lastPrice = Number(lastRow.avg_price);
      
      for (let i = 1; i <= 3; i++) {
        const futureDate = new Date(lastDate);
        futureDate.setMonth(futureDate.getMonth() + i);
        // Add random fluctuation + slight upward trend
        const predPrice = Math.round(lastPrice * (1 + (i * 0.02) + (Math.random() * 0.05 - 0.025)));
        predictionData.push({
          month: futureDate.toLocaleDateString('fr-FR', { month: 'short' }),
          price: predPrice,
          intervalMin: Math.round(predPrice * 0.90),
          intervalMax: Math.round(predPrice * 1.10)
        });
      }
    } else {
      // Fallback if absolutely no crop data
      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() - 3);
      for(let i=0; i<6; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        const price = Math.round(400 + Math.sin(i)*50);
        predictionData.push({
          month: d.toLocaleDateString('fr-FR', { month: 'short' }),
          price: price,
          intervalMin: price - 25,
          intervalMax: price + 25
        });
      }
    }

    // Get weekly volatility data
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

    let volatilityData: any[] = [];
    if (weeklyQuery.rows.length > 0) {
      // Data is DESC, so we reverse it to display chronologically (Sem 1 to Sem 4)
      const reversed = [...weeklyQuery.rows].reverse();
      volatilityData = reversed.map((r, i) => {
        // e.g., '2026-05' -> 'Sem 5'
        const weekNum = r.week_str.split('-')[1];
        return {
          week: 'Sem ' + weekNum,
          min: Number(r.min_price),
          max: Number(r.max_price),
          avg: Math.round(Number(r.avg_price))
        };
      });
    } else {
      volatilityData = [
        { week: 'Sem 1', min: 380, max: 420, avg: 400 },
        { week: 'Sem 2', min: 390, max: 450, avg: 420 },
        { week: 'Sem 3', min: 410, max: 460, avg: 435 },
        { week: 'Sem 4', min: 400, max: 480, avg: 440 },
      ];
    }

    res.json({
      demand: demandData,
      structure: structureData,
      prediction: predictionData,
      volatility: volatilityData
    });
  } catch (error) {
    console.error('[DashboardController] Error fetching advanced charts data:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
