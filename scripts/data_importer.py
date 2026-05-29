"""
Script d'import CSV → PostgreSQL pour LHG Chatbot
Importe les 3 fichiers CSV en tables PostgreSQL
"""

import os
import pandas as pd
import psycopg2
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import logging

# Configuration logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Charger variables d'environnement
load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://projet_lhg_user:123456@localhost:5432/projet_lhg_db?schema=public')

# Chemin des CSV
CSV_PATH = r'C:\Users\MajedSmichi\Desktop\LHG_FABRIC\Backup_Fabric'

def sanitize_column_name(col):
    """Nettoyer les noms de colonnes pour PostgreSQL"""
    col = col.lower().strip()
    col = col.replace(' ', '_').replace('-', '_')
    col = col.replace('é', 'e').replace('è', 'e').replace('ê', 'e')
    col = col.replace('à', 'a').replace('ù', 'u').replace('ç', 'c')
    # Supprimer caractères spéciaux
    col = ''.join(c for c in col if c.isalnum() or c == '_')
    return col

def import_csv(csv_filename, table_name):
    """Importer un fichier CSV en table PostgreSQL"""
    try:
        csv_file = os.path.join(CSV_PATH, csv_filename)
        
        if not os.path.exists(csv_file):
            logger.error(f"❌ Fichier non trouvé: {csv_file}")
            return False
        
        logger.info(f"📂 Lecture du fichier: {csv_filename}")
        df = pd.read_csv(csv_file, encoding='utf-8', sep=',')
        
        logger.info(f"📊 Colonnes détectées: {df.columns.tolist()}")
        logger.info(f"📈 Nombre de lignes: {len(df)}")
        
        # Nettoyer les noms de colonnes
        df.columns = [sanitize_column_name(col) for col in df.columns]
        
        # Connexion à PostgreSQL
        engine = create_engine(DATABASE_URL)
        
        # Supprimer table existante (optionnel)
        with engine.connect() as conn:
            conn.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE"))
            conn.commit()
            logger.info(f"🗑️ Table {table_name} supprimée (si existante)")
        
        # Importer les données
        logger.info(f"🔄 Importation en cours vers {table_name}...")
        df.to_sql(table_name, engine, if_exists='replace', index=False, method='multi')
        
        logger.info(f"✅ {table_name}: {len(df)} lignes importées avec succès!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur import {csv_filename}: {str(e)}")
        return False

def main():
    """Importer tous les fichiers CSV"""
    logger.info("=" * 60)
    logger.info("🚀 DÉMARRAGE IMPORT CSV → PostgreSQL")
    logger.info("=" * 60)
    
    imports = [
        ('WH_FILE_Nettoye.csv', 'webhelp'),
        ('COLT_FILE_NETTOYE.csv', 'colt_file'),
    ]
    
    results = []
    for csv_file, table_name in imports:
        logger.info(f"\n{'─' * 60}")
        result = import_csv(csv_file, table_name)
        results.append((csv_file, result))
    
    # Résumé
    logger.info(f"\n{'=' * 60}")
    logger.info("📋 RÉSUMÉ DE L'IMPORT")
    logger.info("=" * 60)
    
    for csv_file, result in results:
        status = "✅ SUCCÈS" if result else "❌ ERREUR"
        logger.info(f"{status}: {csv_file}")
    
    success_count = sum(1 for _, r in results if r)
    logger.info(f"\n✨ {success_count}/{len(results)} fichiers importés avec succès!")

if __name__ == '__main__':
    main()