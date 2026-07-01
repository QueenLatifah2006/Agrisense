import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, '..', '..', 'markets_cache.json');

// Centre du Cameroun par défaut si non trouvé
const DEFAULT_COORDS: [number, number] = [7.3697, 12.3547];

interface CacheData {
  [marketName: string]: [number, number];
}

let cache: CacheData = {};

// Load cache
try {
  if (fs.existsSync(CACHE_FILE)) {
    const data = fs.readFileSync(CACHE_FILE, 'utf-8');
    cache = JSON.parse(data);
  }
} catch (error) {
  console.error('[Geocoder] Erreur lors de la lecture du cache:', error);
}

const saveCache = () => {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Geocoder] Erreur lors de la sauvegarde du cache:', error);
  }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const geocodeMarkets = async (markets: string[]): Promise<Array<{ market: string, coords: [number, number] }>> => {
  const result: Array<{ market: string, coords: [number, number] }> = [];
  let cacheUpdated = false;

  for (const market of markets) {
    if (!market || market.trim() === '') continue;

    // Check cache
    if (cache[market]) {
      result.push({ market, coords: cache[market] });
      continue;
    }

    // Prepare search query
    // If it's a generic word like "Marché de Gros", append Cameroon to be safe
    const searchQuery = `${market}, Cameroun`;
    
    try {
      console.log(`[Geocoder] Recherche sur Nominatim pour: ${searchQuery}`);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`, {
        headers: {
          'User-Agent': 'Agritechia-Dashboard/1.0'
        }
      });
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const coords: [number, number] = [lat, lon];
        
        cache[market] = coords;
        result.push({ market, coords });
        cacheUpdated = true;
      } else {
        console.warn(`[Geocoder] Aucun résultat pour ${searchQuery}, utilisation des coordonnées par défaut.`);
        // Save default coords so we don't query it again and get blocked
        cache[market] = DEFAULT_COORDS;
        result.push({ market, coords: DEFAULT_COORDS });
        cacheUpdated = true;
      }
      
      // Respect Nominatim Usage Policy (1 request per second)
      await sleep(1200);
      
    } catch (error) {
      console.error(`[Geocoder] Erreur pour ${searchQuery}:`, error);
      result.push({ market, coords: DEFAULT_COORDS });
    }
  }

  if (cacheUpdated) {
    saveCache();
  }

  return result;
};
