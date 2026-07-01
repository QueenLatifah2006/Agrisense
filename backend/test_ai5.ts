import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const pythonCmd = 'D:/projet_soutenance/agritechs/.venv/Scripts/python.exe';
const matcherScriptPath = 'D:/projet_soutenance/agritechs/src/agritechs/audio_matcher.py';

const files = [
    'D:/projet_soutenance/agritechs/assets/audio_qa/Dans_quelle_ville_puis_je_vendre_toute_ma_production_d_oignons_et_réaliser_un_bénéfice.wav',
    'D:/projet_soutenance/agritechs/assets/audio_qa/Quel_est_le_prix_moyen_d_un_kilo_de_tomates_a_l_Ouest.wav',
    'D:/projet_soutenance/agritechs/assets/audio_qa/Quelle_est_la_bonne_période_pour_cultiver_le_maïs_dans_la_zone_du_Nord.wav'
];

for (const file of files) {
    console.log(`\nTesting file: ${path.basename(file)}`);
    const child = spawnSync(pythonCmd, [matcherScriptPath, '--audio', file], { encoding: 'utf8' });
    console.log("STDOUT:", child.stdout.trim());
}
