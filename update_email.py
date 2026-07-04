import psycopg2

URL = 'postgresql://agritechs_user:PMyewkuO1VzKf8P5EEfh7qnnnXpQskqY@dpg-d933690k1i2s73dgorkg-a.oregon-postgres.render.com/agritechs'

try:
    conn = psycopg2.connect(URL)
    cur = conn.cursor()
    # Delete the conflicting user or rename their email
    cur.execute("UPDATE users SET email = 'old_superadmin@agrisense.ai' WHERE email = 'superadmin@agrisense.ai' AND id != 7")
    
    # Update user 7
    cur.execute("UPDATE users SET email = 'superadmin@agrisense.ai' WHERE id = 7")
    
    conn.commit()
    print('Successfully updated user 7 to superadmin@agrisense.ai.')
    conn.close()
except Exception as e:
    print('Error:', e)
