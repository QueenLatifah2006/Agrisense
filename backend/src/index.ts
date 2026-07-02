import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import cropRoutes from './routes/crops.js';
import aiRoutes from './routes/ai.js';
import { closeInactiveChats } from './controllers/aiController.js';
import { scheduleNextDailyRun } from './services/schedulerService.js';
import { scheduleWeeklyReportRun } from './services/weeklyReportService.js';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { initializeDatabase } from './config/initDb.js';
import { checkConnection } from './config/db.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

// Initialiser la base de données au démarrage
await initializeDatabase();

app.use('/api/ia', createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  on: {
    error: (err, req, res: any) => {
      res.status(503).json({ 
        error: 'Le service IA est indisponible',
        detail: err.message 
      });
    }
  }
}));

// Middleware de log GLOBAL pour voir absolument tout ce qui rentre
app.use((req, res, next) => {
  console.log(`>>> [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Configurer CORS de manière très permissive pour le développement
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/ai', aiRoutes); 

// Route de test
app.get('/api/health', async (req, res) => {
  const dbStatus = await checkConnection();
  res.json({ 
    status: 'ok', 
    message: 'AgriSense API is running',
    database: dbStatus,
    environment: {
      port: PORT,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET
    }
  });
});

// Empêcher la boucle de proxy infinie : si une route /api n'a pas été interceptée avant, on retourne 404
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API Route not found' });
});

// Proxy vers Next.js pour tout le reste (Dashboard)
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      // Si Next.js n'est pas encore prêt, renvoyer une page d'attente
      (res as any).status(503).send('Le frontend Next.js est en cours de démarrage ou indisponible. Veuillez patienter...');
    }
  }
}));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Lancer le scheduler pour archiver les chats inactifs (seuil 30 min, scan toutes les 5 min)
  closeInactiveChats();
  setInterval(closeInactiveChats, 5 * 60 * 1000);

  // Lancer le planificateur journalier (calibrage des prix & articles IA chaque minuit)
  scheduleNextDailyRun();

  // Lancer le planificateur hebdomadaire (rapport PDF avec diagrammes le dimanche soir)
  scheduleWeeklyReportRun();
});

export default app;
