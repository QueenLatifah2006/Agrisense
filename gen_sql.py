import re

with open('local_data_dump_columns_modified.sql', 'r', encoding='utf-8') as f:
    content = f.read()

crops_inserts = re.findall(r'INSERT INTO public\.crops.*?;', content)

user7_query = """TRUNCATE TABLE public.crops CASCADE;
TRUNCATE TABLE public.users CASCADE;

INSERT INTO public.users (id, name, email, password, role, profile_picture, domain, organization_id, created_at, phone, location) VALUES (7, 'Super Admin', 'superadmin@gmail.com', '$2b$12$Oh/3txgSP6Nx94GMAvxhRu7GrzpfwWFDCIRwZczdD.8kZqgTrQCMO', 'superadmin', NULL, NULL, NULL, '2026-05-25 17:33:27.769164+00', NULL, NULL);
"""

with open('render_insert_clean.sql', 'w', encoding='utf-8') as f:
    f.write(user7_query + '\n')
    for c in crops_inserts:
        f.write(c + '\n')
