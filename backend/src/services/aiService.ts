import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to execute_agent.py relative to the service file
const executeAgentScriptPath = path.resolve(__dirname, '../../../agritechs/src/agritechs/execute_agent.py');

interface ChatResponse {
  status: 'success' | 'warning' | 'error';
  result?: string;
  message?: string;
  extracted_parameters?: {
    phrase_utilisateur: string;
    culture: string;
    zone: string;
    climat: string;
  };
}

interface PriceDataPoint {
  date: string;
  prix_moyen_fcfa_kg: number;
  nb_sources: number;
}

interface PriceResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    status: 'OK' | 'VIDE';
    culture: string;
    zone: string;
    total_points: number;
    dataset: PriceDataPoint[];
  };
}

/**
 * Execute Python Script safely and return stdout parsed as JSON
 */
export const runPythonScript = <T>(args: string[], scriptOverride?: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const executeScript = scriptOverride || executeAgentScriptPath;
    
    // Resolve path to the virtual environment python executable
    let pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const venvPythonPath = process.platform === 'win32'
      ? path.resolve(__dirname, '../../../agritechs/.venv/Scripts/python.exe')
      : path.resolve(__dirname, '../../../agritechs/.venv/bin/python');

    if (fs.existsSync(venvPythonPath)) {
      pythonCmd = venvPythonPath;
    }

    console.log(`[AI-Service] Spawning child process: ${pythonCmd} ${executeScript} ${args.join(' ')}`);

    const child = spawn(pythonCmd, [executeScript, ...args], {
      env: {
        ...process.env,
        // Ensure python output is NOT buffered so we can read it instantly
        PYTHONUNBUFFERED: '1'
      }
    });

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.log(`[AI-Service-STDERR] ${data.toString().trim()}`);
    });

    child.on('close', (code) => {
      // Normaliser les sauts de ligne pour éviter le bug CRLF sous Windows
      const normalizedStdout = stdoutData.replace(/\r\n/g, '\n');

      // Toujours essayer de lire le JSON de stdout en premier,
      const lastOpen = normalizedStdout.lastIndexOf('{\n  "status"');
      if (lastOpen !== -1) {
        try {
          const jsonSubstr = normalizedStdout.substring(lastOpen);
          const lastClose = jsonSubstr.lastIndexOf('}');
          const jsonStr = jsonSubstr.substring(0, lastClose + 1);
          const parsed = JSON.parse(jsonStr);
          return resolve(parsed);
        } catch (err) { }
      }

      const matchLastOpen = normalizedStdout.lastIndexOf('{"match"');
      if (matchLastOpen !== -1) {
        try {
          const jsonSubstr = normalizedStdout.substring(matchLastOpen);
          const lastClose = jsonSubstr.lastIndexOf('}');
          const jsonStr = jsonSubstr.substring(0, lastClose + 1);
          const parsed = JSON.parse(jsonStr);
          return resolve(parsed);
        } catch (err) { }
      }

      const errLastOpen = normalizedStdout.lastIndexOf('{"error"');
      if (errLastOpen !== -1) {
        try {
          const jsonSubstr = normalizedStdout.substring(errLastOpen);
          const lastClose = jsonSubstr.lastIndexOf('}');
          const jsonStr = jsonSubstr.substring(0, lastClose + 1);
          const parsed = JSON.parse(jsonStr);
          return resolve(parsed);
        } catch (err) { }
      }

      // Aucun JSON valide trouvé dans stdout : rejeter avec le stderr
      if (code !== 0) {
        return reject(new Error(`Python process failed (code ${code}): ${stderrData.slice(-500)}`));
      }
      return reject(new Error(`No JSON found in stdout: ${normalizedStdout.slice(-300)}`));
    });

    child.on('error', (err) => {
      console.error(`[AI-Service] Failed to start python process:`, err);
      reject(new Error(`Failed to invoke Python service. Check if python is in path: ${err.message}`));
    });
  });
}

/**
 * Sanitize user input to prevent command injection
 */
function sanitizeInput(input: string): string {
  if (!input) return '';
  return input.replace(/[&|;$><`"\\]/g, '').trim();
}

/**
 * Interface with CrewAI Chat/Conseil Agent (Module 1)
 */
export async function askConseillerAgent(phrase: string): Promise<ChatResponse> {
  try {
    return await runPythonScript<ChatResponse>([
      '--module', 'chat',
      '--phrase', sanitizeInput(phrase)
    ]);
  } catch (error) {
    console.error('Error in askConseillerAgent:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Une erreur inattendue est survenue.'
    };
  }
}

/**
 * Interface with CrewAI Aggregation Agent (Module 2)
 */
export async function getAggregatedPrices(params: {
  culture: string;
  zone: string;
  marche?: string;
  date_debut?: string;
  date_fin?: string;
}): Promise<PriceResponse> {
  try {
    const args = [
      '--module', 'prices',
      '--culture', sanitizeInput(params.culture),
      '--zone', sanitizeInput(params.zone)
    ];

    if (params.marche) {
      args.push('--marche', sanitizeInput(params.marche));
    }
    if (params.date_debut) {
      args.push('--date_debut', params.date_debut);
    }
    if (params.date_fin) {
      args.push('--date_fin', params.date_fin);
    }

    return await runPythonScript<PriceResponse>(args);
  } catch (error: any) {
    console.error('[AI-Service] Failed to retrieve aggregated prices:', error);
    return {
      status: 'error',
      message: error.message || 'Une erreur est survenue lors du calcul des prix moyens.'
    };
  }
}

export interface LocalAudioMatchResponse {
  match: boolean;
  confidence: number;
  distance?: number;
  response_url?: string;
  language?: string;
  error?: string;
}

/**
 * Match a local language audio file against the predefined ChromaDB database
 */
export const matchLocalLanguageAudio = async (audioFilePath: string): Promise<LocalAudioMatchResponse> => {
  const matcherScriptPath = path.resolve(__dirname, '../../../agritechs/src/agritechs/audio_matcher.py');
  
  try {
    return await runPythonScript<LocalAudioMatchResponse>([
      '--audio', audioFilePath
    ], matcherScriptPath);
  } catch (error: any) {
    console.error('[AI-Service] Failed to match local audio:', error);
    return {
      match: false,
      confidence: 0,
      error: error.message || 'Error processing audio fingerprint'
    };
  }
};
