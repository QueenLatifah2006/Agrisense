import random
import datetime

output_file = r'C:\Users\PC\.gemini\antigravity\brain\7a2d8167-863c-44fe-a592-91656048b5d9\crops_160_records.md'

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

def generate_markdown():
    lines = []
    lines.append("# Données Agricoles (160 Enregistrements)\n")
    lines.append("Ce document contient 20 enregistrements détaillés pour 8 cultures différentes. Vous pouvez exporter cette page en PDF ou la copier dans Word.\n")
    
    for crop, config in crops_config.items():
        lines.append(f"## Culture : {crop}\n")
        lines.append("| Variété | Ville (Area) | Marché | Prix (FCFA) | Date Relevé Prix | Plantation | Début Semis | Fin Semis | Début Récolte | Fin Récolte | Début Vente | Fin Vente | Quantité |")
        lines.append("|---|---|---|---|---|---|---|---|---|---|---|---|---|")
        for i in range(20):
            city = random.choice(list(cities_markets.keys()))
            market = random.choice(cities_markets[city])
            variety = random.choice(config['varieties'])
            
            base_year = random.choice([2024, 2025, 2026])
            planting_date = get_random_date(base_year, config['plant_month'])
            
            sowing_start = planting_date
            sowing_end = sowing_start + datetime.timedelta(days=random.randint(10, 20))
            
            harvest_start = planting_date + datetime.timedelta(days=config['harvest_delay'] * 30)
            harvest_end = harvest_start + datetime.timedelta(days=random.randint(20, 40))
            
            selling_start = harvest_start + datetime.timedelta(days=random.randint(5, 10))
            selling_end = harvest_end + datetime.timedelta(days=random.randint(30, 60))
            
            record_date = get_random_date(2026, random.randint(1, 12))
            
            price = random.randint(config['price_range'][0], config['price_range'][1])
            price = round(price / 25) * 25
            quantity = random.randint(50, 2000)
            
            lines.append(f"| {variety} | {city} | {market} | **{price}** | {record_date} | {planting_date} | {sowing_start} | {sowing_end} | {harvest_start} | {harvest_end} | {selling_start} | {selling_end} | {quantity} kg |")
        lines.append("\n")

    return lines

md_lines = generate_markdown()

with open(output_file, 'w', encoding='utf-8') as f:
    f.write("\n".join(md_lines))

print(f"Generated Markdown at {output_file}")
