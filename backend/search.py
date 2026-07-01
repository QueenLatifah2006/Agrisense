import os

search_dir = r"D:\projet_soutenance\agritechia"
query = "DEBUG (A supprimer)"

for root, dirs, files in os.walk(search_dir):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if '.next' in dirs:
        dirs.remove('.next')
    if '.git' in dirs:
        dirs.remove('.git')
    if '.pub-cache' in dirs:
        dirs.remove('.pub-cache')
    if 'build' in dirs:
        dirs.remove('build')
        
    for file in files:
        if file.endswith(('.dart', '.js', '.jsx', '.ts', '.tsx', '.html')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    for i, line in enumerate(f):
                        if 'supprimer' in line.lower() and 'debug' in line.lower():
                            print(f"{path}:{i+1}: {line.strip()}")
            except Exception:
                pass

search_dir2 = r"D:\projet_soutenance\agritechia_admin"
for root, dirs, files in os.walk(search_dir2):
    if 'node_modules' in dirs: dirs.remove('node_modules')
    if '.next' in dirs: dirs.remove('.next')
    if '.git' in dirs: dirs.remove('.git')
    for file in files:
        if file.endswith(('.dart', '.js', '.jsx', '.ts', '.tsx', '.html')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    for i, line in enumerate(f):
                        if 'supprimer' in line.lower() and 'debug' in line.lower():
                            print(f"{path}:{i+1}: {line.strip()}")
            except Exception:
                pass
