from sqlalchemy import create_engine, Column, Integer, String, Float, Text, CheckConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/agri_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Culture(Base):
    __tablename__ = "cultures"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
    categorie = Column(String)

class CalendrierAgricole(Base):
    __tablename__ = "calendrier_agricole"
    id = Column(Integer, primary_key=True, index=True)
    culture_nom = Column(String, nullable=False)
    zone_agro = Column(String, nullable=False)
    # Les contraintes sont portées à 52 pour les semaines
    semis_debut = Column(Integer, CheckConstraint('semis_debut BETWEEN 1 AND 52'))
    semis_fin = Column(Integer, CheckConstraint('semis_fin BETWEEN 1 AND 52'))
    recolte_debut = Column(Integer)
    recolte_fin = Column(Integer)
    vente_optimale_debut = Column(Integer)
    vente_optimale_fin = Column(Integer)
    mots_cles_techniques = Column(String)
    conseils_flash = Column(String)

class PrixMarche(Base):
    __tablename__ = "prix_marche"
    id = Column(Integer, primary_key=True, index=True)
    culture_nom = Column(String, nullable=False)
    zone_agro = Column(String, nullable=False) # Harmonisé en zone_agro
    prix_moyen = Column(Float)
    unite = Column(String, default="kg")
    date_releve = Column(String)

def init_db():
    Base.metadata.create_all(bind=engine)
    print("✅ Base de données initialisée avec succès!")

if __name__ == "__main__":
    init_db()