"""
Script complet: Créer les 3 tables + importer les données
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

def create_tables_and_import():
    """Créer les 3 tables et importer les données"""
    try:
        # Connexion PostgreSQL
        logger.info("🔗 Connexion à PostgreSQL...")
        conn = psycopg2.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        cursor = conn.cursor()

        # ============================================================
        # 1. CRÉER TABLE WEBHELP
        # ============================================================
        logger.info("📋 Création table webhelp...")
        cursor.execute("""
            DROP TABLE IF EXISTS webhelp CASCADE;
            CREATE TABLE webhelp (
                id SERIAL PRIMARY KEY,
                nom_projet VARCHAR(255),
                nom_vdn VARCHAR(255),
                vdn__id_ FLOAT,
                zone_geographique VARCHAR(255),
                nom_activite VARCHAR(255),
                acw FLOAT,
                mea FLOAT,
                duree_totale_appel FLOAT,
                date_de_debut_et_heure_en_paris_time VARCHAR(255),
                date_de_fin_et_heure_en_paris_time VARCHAR(255),
                duree_de_comm FLOAT,
                libelle_code_appel VARCHAR(255),
                ringtime FLOAT,
                queuetime FLOAT,
                raccroche_agent FLOAT,
                code_appel FLOAT,
                held FLOAT,
                interruptdel FLOAT,
                login_agent FLOAT,
                numero_compose FLOAT
            );
        """)
        conn.commit()
        logger.info("✅ Table webhelp créée")

        # ============================================================
        # 2. CRÉER TABLE RESERVATIONS
        # ============================================================
        logger.info("📋 Création table reservations...")
        cursor.execute("""
            DROP TABLE IF EXISTS reservations CASCADE;
            CREATE TABLE reservations (
                id SERIAL PRIMARY KEY,
                brand VARCHAR(255),
                resort VARCHAR(255),
                resort_name VARCHAR(255),
                booking_date VARCHAR(255),
                resort_countr_name VARCHAR(255),
                customer_country VARCHAR(255),
                reservation_status VARCHAR(255),
                arrival_date VARCHAR(255),
                departure_date VARCHAR(255),
                duree_sejour INT,
                nb_booking INT,
                adult_par_nuit INT,
                kid_par_nuit INT,
                rooms_sold INT,
                resv_revenue_in_euro FLOAT,
                resv_revenue_total_in_euro FLOAT
            );
        """)
        conn.commit()
        logger.info("✅ Table reservations créée")

        # ============================================================
        # 3. CRÉER TABLE COLT_FILE
        # ============================================================
        logger.info("📋 Création table colt_file...")
        cursor.execute("""
            DROP TABLE IF EXISTS colt_file CASCADE;
            CREATE TABLE colt_file (
                id SERIAL PRIMARY KEY,
                point_dentree VARCHAR(255),
                session_dappel VARCHAR(255),
                appelant FLOAT,
                type_dappel VARCHAR(255),
                numero_cible FLOAT,
                svi_seulement FLOAT,
                demande_de_mise_en_relation FLOAT,
                abandon_dans_lattente FLOAT,
                appel_dissuade FLOAT,
                resultat VARCHAR(255),
                code FLOAT,
                occupe FLOAT,
                non_reponse FLOAT,
                identifiant_de_lappel VARCHAR(255),
                date_colt_file VARCHAR(255),
                heure_colt_file VARCHAR(255),
                duree_globale__secondes_ INT,
                duree_svi__secondes_ INT,
                duree_dattente__secondes_ INT,
                duree_de_contact__secondes_ INT,
                duree_de_mise_en_garde__secondes_ INT,
                duree_svi_appele_post_contact__secondes_ INT,
                annee FLOAT,
                mois FLOAT,
                jour FLOAT,
                heure FLOAT,
                minute FLOAT,
                seconde FLOAT
            );
        """)
        conn.commit()
        logger.info("✅ Table colt_file créée")

        # ============================================================
        # 4. IMPORTER WEBHELP
        # ============================================================
        logger.info("📥 Import webhelp...")
        webhelp_file = r'backend/scripts/data/webhelp/WH_FILE_Deduplicated.csv'
        with open(webhelp_file, 'r', encoding='utf-8') as f:
            cursor.copy_expert("COPY webhelp(nom_projet,nom_vdn,vdn__id_,zone_geographique,nom_activite,acw,mea,duree_totale_appel,date_de_debut_et_heure_en_paris_time,date_de_fin_et_heure_en_paris_time,duree_de_comm,libelle_code_appel,ringtime,queuetime,raccroche_agent,code_appel,held,interruptdel,login_agent,numero_compose) FROM STDIN WITH (FORMAT csv, HEADER true, DELIMITER ',')", f)
        conn.commit()
        cursor.execute("SELECT COUNT(*) FROM webhelp")
        count = cursor.fetchone()[0]
        logger.info(f"✅ webhelp: {count} lignes importées")

        # ============================================================
        # 5. IMPORTER RESERVATIONS
        # ============================================================
        logger.info("📥 Import reservations...")
        reservations_file = r'C:\Users\MajedSmichi\Desktop\LHG_FABRIC\Backup_Fabric\RESERVATION_opera_NETTOYE.csv'
        with open(reservations_file, 'r', encoding='utf-8') as f:
            cursor.copy_expert("COPY reservations(brand,resort,resort_name,booking_date,resort_countr_name,customer_country,reservation_status,arrival_date,departure_date,duree_sejour,nb_booking,adult_par_nuit,kid_par_nuit,rooms_sold,resv_revenue_in_euro,resv_revenue_total_in_euro) FROM STDIN WITH (FORMAT csv, HEADER true, DELIMITER ',')", f)
        conn.commit()
        cursor.execute("SELECT COUNT(*) FROM reservations")
        count = cursor.fetchone()[0]
        logger.info(f"✅ reservations: {count} lignes importées")

        # ============================================================
        # 6. IMPORTER COLT_FILE
        # ============================================================
        logger.info("📥 Import colt_file...")
        colt_file = r'C:\Users\MajedSmichi\Desktop\LHG_FABRIC\Backup_Fabric\COLT_FILE_NETTOYE.csv'
        with open(colt_file, 'r', encoding='utf-8') as f:
            cursor.copy_expert("COPY colt_file(point_dentree,session_dappel,appelant,type_dappel,numero_cible,svi_seulement,demande_de_mise_en_relation,abandon_dans_lattente,appel_dissuade,resultat,code,occupe,non_reponse,identifiant_de_lappel,date_colt_file,heure_colt_file,duree_globale__secondes_,duree_svi__secondes_,duree_dattente__secondes_,duree_de_contact__secondes_,duree_de_mise_en_garde__secondes_,duree_svi_appele_post_contact__secondes_,annee,mois,jour,heure,minute,seconde) FROM STDIN WITH (FORMAT csv, HEADER true, DELIMITER ',', NULL 'NULL')", f)
        conn.commit()
        cursor.execute("SELECT COUNT(*) FROM colt_file")
        count = cursor.fetchone()[0]
        logger.info(f"✅ colt_file: {count} lignes importées")

        cursor.close()
        conn.close()

        logger.info("=" * 60)
        logger.info("🎉 TOUS LES IMPORTS TERMINÉS AVEC SUCCÈS!")
        logger.info("=" * 60)
        return True

    except Exception as e:
        logger.error(f"❌ Erreur: {str(e)}")
        return False

if __name__ == '__main__':
    create_tables_and_import()
