# Utiliser une image de base Linux Debian contenant Node.js
FROM node:22-bullseye-slim

# 1. Installer Python 3, pip, ffmpeg (pour l'audio) et les outils de compilation
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. Définir le dossier de travail principal
WORKDIR /app

# 3. --- CONFIGURATION PYTHON (Dossier agritechs) ---
# Copier tout le dossier IA
COPY agritechs/ /app/agritechs/
# Créer l'environnement virtuel Python (sous Linux c'est 'bin' et non 'Scripts')
RUN python3 -m venv /app/agritechs/.venv
# Installer les dépendances Python
RUN /app/agritechs/.venv/bin/pip install --no-cache-dir -r /app/agritechs/requirements.txt
# S'assurer que le package officiel groq est installé (souvent requis par CrewAI/LiteLLM dans les anciennes versions)
RUN /app/agritechs/.venv/bin/pip install --no-cache-dir groq

# 4. --- CONFIGURATION NODE.JS (Dossier backend) ---
WORKDIR /app/backend
# Copier les fichiers de dépendances Node
COPY backend/package*.json ./
# Installer les modules Node
RUN npm install
# Copier le reste du code backend
COPY backend/ ./
# Compiler le code TypeScript en JavaScript
RUN npm run build

# 5. --- DÉMARRAGE DU SERVEUR ---
# Exposer le port par défaut (Render écrasera avec sa propre variable PORT si besoin)
EXPOSE 3000

# Lancer le serveur de production Node.js
CMD ["npm", "start"]
