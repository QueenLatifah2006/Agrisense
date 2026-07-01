import psycopg2

try:
    conn = psycopg2.connect(
        dbname="agridb",
        user="postgres",
        password="postgres",
        host="localhost",
        port="5432"
    )
    cur = conn.cursor()
    cur.execute("SELECT * FROM mais")
    rows = cur.fetchall()
    print(rows)
except psycopg2.Error as e:
    print("Postgres Error:", e)
except UnicodeDecodeError as e:
    print("Unicode error decoding Postgres message. This usually means the database doesn't exist or authentication failed. Raw error:", e.object)
except Exception as e:
    print("Other Error:", repr(e))
