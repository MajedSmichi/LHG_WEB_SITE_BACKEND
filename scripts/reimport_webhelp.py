"""
Script d'import CSV → PostgreSQL pour webhelp deduplicated (RAPIDE)
"""

import os
import psycopg2
from dotenv import load_dotenv
import logging

# Configuration logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Charger variables d'environnement
load_dotenv()
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'projet_lhg_user')
DB_PASSWORD = os.getenv('DB_PASSWORD', '123456')
DB_NAME = os.getenv('DB_NAME', 'projet_lhg_db')

def import_webhelp_fast():
    """Importer le fichier webhelp avec COPY (très rapide)"""
    try:
        csv_file = r'scripts/data/webhelp/WH_FILE_Deduplicated.csv'
        table_name = 'webhelp'
        
        if not os.path.exists(csv_file):
            logger.error(f"❌ Fichier non trouvé: {csv_file}")
            return False
        
        # Connexion PostgreSQL
        logger.info("🔗 Connexion à PostgreSQL...")
        conn = psycopg2.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        cursor = conn.cursor()
        
        # Vider la table
        logger.info(f"🗑️ Vidage de la table {table_name}...")
        cursor.execute(f"TRUNCATE TABLE {table_name}")
        
        # Importer avec COPY (ultra rapide)
        logger.info(f"📥 Import avec COPY...")
        with open(csv_file, 'r', encoding='utf-8') as f:
            cursor.copy_expert(f"COPY {table_name} FROM STDIN WITH (FORMAT csv, HEADER true, DELIMITER ',')", f)
        
        conn.commit()
        
        # Vérifier
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        logger.info(f"✅ {table_name}: {count} lignes importées avec succès!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur import: {str(e)}")
        return False

if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("🚀 RÉIMPORT WEBHELP (COPY RAPIDE)")
    logger.info("=" * 60)
    import_webhelp_fast()