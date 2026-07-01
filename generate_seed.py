import random
import datetime

# Configuration
output_file = 'd:/projet_soutenance/database_crops_seed.sql'
user_id = 7

crops_config = {
    'Tomate': {
        'type': 'Maraîchère', 'varieties': ['Rio Grande', 'Lindo', 'Roma'],
        'plant_month': 3, 'harvest_delay': 3, 'price_range': (400, 1200)
    },
    'Oignon': {
        'type': 'Maraîchère', 'varieties': ['Violet de Galmi', 'Goudel', 'Blanc'],
        'plant_month': 10, 'harvest_delay': 4, 'price_range': (500, 1500)
    },
    'Djindja': {
        'type': 'Epice', 'varieties': ['Local', 'Amélioré'],
        'plant_month': 4, 'harvest_delay': 9, 'price_range': (800, 2000)
    },
    'Ail': {
        'type': 'Epice', 'varieties': ['Local', 'Violet'],
        'plant_month': 10, 'harvest_delay': 4, 'price_range': (1000, 3000)
    },
    'Riz': {
        'type': 'Céréale', 'varieties': ['Tox', 'IR841', 'Nerica'],
        'plant_month': 6, 'harvest_delay': 5, 'price_range': (350, 800)
    },
    'Manioc': {
        'type': 'Tubercule', 'varieties': ['8034', 'Locale', 'TMS'],
        'plant_month': 3, 'harvest_delay': 12, 'price_range': (100, 300)
    },
    'Arachide': {
        'type': 'Légumineuse', 'varieties': ['Garoua', 'Villageoise', 'Campagne'],
        'plant_month': 4, 'harvest_delay': 3, 'price_range': (500, 1200)
    },
    'Maïs': {
        'type': 'Céréale', 'varieties': ['CMS 8704', 'Kasaï', 'Atp'],
        'plant_month': 3, 'harvest_delay': 4, 'price_range': (200, 500)
    }
}

cities_markets = {
    'Yaoundé': ['Marché du Mfoundi', 'Marché Mokolo', 'Marché d\'Essos', 'Marché 8ème', 'Marché d\'Acacia'],
    'Douala': ['Marché Sandaga', 'Marché Central', 'Marché de Bonassama', 'Marché Mboppi', 'Marché Dakar'],
    'Bafoussam': ['Marché A', 'Marché B', 'Marché de Casablanca'],
    'Garoua': ['Marché Central', 'Marché de Yelwa'],
    'Bamenda': ['Main Market', 'Food Market', 'Nkwen Market'],
    'Ngaoundéré': ['Marché Central', 'Petit Marché'],
    'Maroua': ['Marché Central', 'Marché Abattoir'],
    'Dschang': ['Marché A', 'Marché B']
}

def get_random_date(year, month):
    day = random.randint(1, 28)
    return datetime.date(year, month, day)

def generate_inserts():
    inserts = []
    
    for crop, config in crops_config.items():
        for i in range(20):
            # Select random city and market
            city = random.choice(list(cities_markets.keys()))
            market = random.choice(cities_markets[city])
            
            variety = random.choice(config['varieties'])
            
            # Dates
            base_year = random.choice([2024, 2025, 2026])
            planting_date = get_random_date(base_year, config['plant_month'])
            
            sowing_start = planting_date
            sowing_end = sowing_start + datetime.timedelta(days=random.randint(10, 20))
            
            harvest_start = planting_date + datetime.timedelta(days=config['harvest_delay'] * 30)
            harvest_end = harvest_start + datetime.timedelta(days=random.randint(20, 40))
            
            selling_start = harvest_start + datetime.timedelta(days=random.randint(5, 10))
            selling_end = harvest_end + datetime.timedelta(days=random.randint(30, 60))
            
            # Record Date (usually between selling_start and selling_end, or current year)
            record_date = get_random_date(2026, random.randint(1, 12))
            
            price = random.randint(config['price_range'][0], config['price_range'][1])
            # Round price to nearest 25
            price = round(price / 25) * 25
            
            quantity = random.randint(50, 2000)
            
            # Escape single quotes for SQL
            city_sql = city.replace("'", "''")
            market_sql = market.replace("'", "''")
            
            inserts.append(f"""({user_id}, '{crop}', '{config['type']}', '{variety}', '{city_sql}', '{planting_date}', '{sowing_start}', '{sowing_end}', '{harvest_start}', '{harvest_end}', '{selling_start}', '{selling_end}', '{record_date}', '{market_sql}', {quantity}, {price}, 'en cours', {random.randint(10, 100)}, '', CURRENT_TIMESTAMP)""")

    return inserts

inserts = generate_inserts()

with open(output_file, 'w', encoding='utf-8') as f:
    f.write("-- Script d'insertion massif (160 enregistrements)\n")
    f.write("INSERT INTO crops (\n")
    f.write("    user_id, name, type, variety, area, planting_date, sowing_start, sowing_end, \n")
    f.write("    harvest_start, harvest_end, selling_start, selling_end, price_recorded_date, \n")
    f.write("    market, quantity, price, status, progress, image_url, created_at\n")
    f.write(") VALUES \n")
    
    for i, ins in enumerate(inserts):
        if i == len(inserts) - 1:
            f.write(ins + ";\n")
        else:
            f.write(ins + ",\n")

print(f"Successfully generated {len(inserts)} records in {output_file}")
