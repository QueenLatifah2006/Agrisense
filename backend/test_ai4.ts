import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const jsonPath = path.resolve('D:/projet_soutenance/backend/postman_test.json');
const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const audio = payload.audio;
const base64Data = audio.replace(/^data:audio\/\w+;base64,/, "");

const tempFilePath = path.resolve('temp_test2.wav');
fs.writeFileSync(tempFilePath, base64Data, 'base64');

console.log("Matching temp file...");
const pythonCmd = 'D:/projet_soutenance/agritechs/.venv/Scripts/python.exe';
const matcherScriptPath = 'D:/projet_soutenance/agritechs/src/agritechs/audio_matcher.py';
const child = spawnSync(pythonCmd, [matcherScriptPath, '--audio', tempFilePath], { encoding: 'utf8' });

console.log("STDOUT:", child.stdout);
console.log("STDERR:", child.stderr);
