from database import SessionLocal, CalendrierAgricole, Culture, PrixMarche, Base, engine
from datetime import date

def seed_data():
    print("♻️ Nettoyage des anciennes tables et contraintes...")
    # On supprime tout pour réinitialiser les contraintes CHECK de PostgreSQL
    Base.metadata.drop_all(bind=engine) 
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Peuplement des Cultures
        cultures_data = [
            Culture(name="Maïs", categorie="Céréale"),
            Culture(name="Tomate", categorie="Légume"), 
            Culture(name="Oignon", categorie="Légume")
        ]
        db.add_all(cultures_data)
        
        # 2. Peuplement du Calendrier (Précision par semaines 1-52)
        calendriers = [
            CalendrierAgricole(
                culture_nom="Maïs", 
                zone_agro="Ouest",
                semis_debut=14, semis_fin=18, 
                recolte_debut=31, recolte_fin=35,
                vente_optimale_debut=48, vente_optimale_fin=52,
                mots_cles_techniques="maïs, fertilisation, semis",
                conseils_flash="Préparez un labour profond. Apportez du fumier bien décomposé 2 semaines avant le semis."
            ),
            CalendrierAgricole(
                culture_nom="Tomate", 
                zone_agro="Ouest",
                semis_debut=1, semis_fin=8,
                recolte_debut=18, recolte_fin=26,
                vente_optimale_debut=22, vente_optimale_fin=28,
                mots_cles_techniques="tuteurage tomate, irrigation goutte-à-goutte, mildiou",
                conseils_flash="Assurez-vous d'avoir un bon système d'irrigation. Traitez contre le mildiou."
            ),
            CalendrierAgricole(
                culture_nom="Oignon", 
                zone_agro="Ouest",
                semis_debut=27, semis_fin=36,
                recolte_debut=44, recolte_fin=50,
                vente_optimale_debut=8, vente_optimale_fin=15,
                mots_cles_techniques="pépinière oignon, séchage bulbes, conservation paille",
                conseils_flash="Prévoyez un séchage de 15 jours à l'ombre après récolte pour une meilleure conservation."
            ),
        ]
        db.add_all(calendriers)
        
        # 3. Peuplement des Prix (Optionnel pour tes tests)
        prix = [
            PrixMarche(culture_nom="Maïs", zone_agro="Ouest", prix_moyen=250.0, date_releve=str(date.today())),
            PrixMarche(culture_nom="Tomate", zone_agro="Ouest", prix_moyen=450.0, date_releve=str(date.today())),
            PrixMarche(culture_nom="Oignon", zone_agro="Ouest", prix_moyen=350.0, date_releve=str(date.today())),
        ]
        db.add_all(prix)
        
        db.commit()
        print("✅ Données de précision insérées avec succès (S1-S52) !")
        
    except Exception as e:
        print(f"❌ Erreur lors du seeding : {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()