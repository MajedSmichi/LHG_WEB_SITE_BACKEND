"""
Script de création du schéma en étoile depuis la table webhelp PostgreSQL
Crée DIM_* et Fact_WebHelp, puis exporte en CSV pour Power BI
"""

import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv
import logging

# Configuration logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Charger variables d'environnement
load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://projet_lhg_user:123456@localhost:5432/projet_lhg_db?schema=public')

def create_star_schema():
    """Créer le schéma en étoile depuis la table webhelp PostgreSQL"""
    try:
        # Connexion PostgreSQL
        logger.info("🔗 Connexion à PostgreSQL...")
        engine = create_engine(DATABASE_URL)
        
        # Lire webhelp depuis PostgreSQL
        logger.info("📖 Lecture de la table webhelp...")
        df_webhelp = pd.read_sql("SELECT * FROM webhelp", engine)
        
        logger.info(f"✅ {len(df_webhelp)} lignes lues")
        
        # ========== DIM_Date_WebHelp ==========
        logger.info("\n📅 Création DIM_Date_WebHelp...")
        df_dim_date = df_webhelp[['date_de_debut_et_heure_en_paris_time', 'date_de_fin_et_heure_en_paris_time']].drop_duplicates().reset_index(drop=True)
        df_dim_date.insert(0, 'DateKey', range(1, len(df_dim_date) + 1))
        df_dim_date.columns = ['DateKey', 'Date_debut_heure_Paris_Time', 'Date_fin_heure_Paris_Time']
        logger.info(f"  {len(df_dim_date)} dates uniques")
        
        # ========== DIM_Activité ==========
        logger.info("\n🎯 Création DIM_Activité...")
        df_dim_activite = df_webhelp[['nom_activite']].drop_duplicates().reset_index(drop=True)
        df_dim_activite.insert(0, 'ActivityKey', range(1, len(df_dim_activite) + 1))
        df_dim_activite.columns = ['ActivityKey', 'Nom_activite']
        logger.info(f"  {len(df_dim_activite)} activités uniques")
        
        # ========== DIM_Appel_WH ==========
        logger.info("\n📞 Création DIM_Appel_WH...")
        df_dim_appel = df_webhelp[['libelle_code_appel', 'code_appel', 'held', 'raccroche_agent', 'interruptdel', 'numero_compose']].drop_duplicates().reset_index(drop=True)
        df_dim_appel.insert(0, 'AppelKey', range(1, len(df_dim_appel) + 1))
        df_dim_appel.columns = ['AppelKey', 'Libelle_code_appel', 'Code_appel', 'Held', 'Raccroche_agent', 'Interruptdel', 'Numero_compose']
        logger.info(f"  {len(df_dim_appel)} types d'appel uniques")
        
        # ========== DIM_Projet ==========
        logger.info("\n🏢 Création DIM_Projet...")
        df_dim_projet = df_webhelp[['nom_projet']].drop_duplicates().reset_index(drop=True)
        df_dim_projet.insert(0, 'ProjectKey', range(1, len(df_dim_projet) + 1))
        df_dim_projet.columns = ['ProjectKey', 'Nom_Projet']
        logger.info(f"  {len(df_dim_projet)} projets uniques")
        
        # ========== DIM_VDN ==========
        logger.info("\n🌍 Création DIM_VDN...")
        df_dim_vdn = df_webhelp[['nom_vdn', 'vdn__id_', 'zone_geographique']].drop_duplicates().reset_index(drop=True)
        df_dim_vdn.insert(0, 'VDNKey', range(1, len(df_dim_vdn) + 1))
        df_dim_vdn.columns = ['VDNKey', 'Nom_VDN', 'VDN_ID', 'Zone_geographique']
        logger.info(f"  {len(df_dim_vdn)} VDN uniques")
        
        # ========== DIM_Agent ==========
        logger.info("\n👤 Création DIM_Agent...")
        df_dim_agent = df_webhelp[['login_agent']].drop_duplicates().reset_index(drop=True)
        df_dim_agent.insert(0, 'AgentKey', range(1, len(df_dim_agent) + 1))
        df_dim_agent.columns = ['AgentKey', 'Login_Agent']
        logger.info(f"  {len(df_dim_agent)} agents uniques")
        
        # ========== Fact_WebHelp ==========
        logger.info("\n📊 Création Fact_WebHelp...")
        df_fact = df_webhelp.copy()
        
        # Ajouter les clés de dimension (lookup sans dupliquer)
        # DateKey
        date_lookup = dict(zip(df_dim_date['Date_debut_heure_Paris_Time'], df_dim_date['DateKey']))
        df_fact['DateKey'] = df_fact['date_de_debut_et_heure_en_paris_time'].map(date_lookup)
        
        # ActivityKey
        activity_lookup = dict(zip(df_dim_activite['Nom_activite'], df_dim_activite['ActivityKey']))
        df_fact['ActivityKey'] = df_fact['nom_activite'].map(activity_lookup)
        
        # AppelKey
        appel_lookup = {}
        for idx, row in df_dim_appel.iterrows():
            key = (row['Libelle_code_appel'], row['Code_appel'], row['Held'])
            appel_lookup[key] = row['AppelKey']
        df_fact['AppelKey'] = df_fact.apply(lambda r: appel_lookup.get((r['libelle_code_appel'], r['code_appel'], r['held'])), axis=1)
        
        # ProjectKey
        project_lookup = dict(zip(df_dim_projet['Nom_Projet'], df_dim_projet['ProjectKey']))
        df_fact['ProjectKey'] = df_fact['nom_projet'].map(project_lookup)
        
        # VDNKey
        vdn_lookup = {}
        for idx, row in df_dim_vdn.iterrows():
            key = (row['Nom_VDN'], row['VDN_ID'], row['Zone_geographique'])
            vdn_lookup[key] = row['VDNKey']
        df_fact['VDNKey'] = df_fact.apply(lambda r: vdn_lookup.get((r['nom_vdn'], r['vdn__id_'], r['zone_geographique'])), axis=1)
        
        # AgentKey
        agent_lookup = dict(zip(df_dim_agent['Login_Agent'], df_dim_agent['AgentKey']))
        df_fact['AgentKey'] = df_fact['login_agent'].map(agent_lookup)
        
        # Sélectionner colonnes de fait
        df_fact = df_fact[[
            'DateKey', 'ActivityKey', 'AppelKey', 'ProjectKey', 'VDNKey', 'AgentKey',
            'acw', 'mea', 'duree_totale_appel', 'duree_de_comm', 'ringtime', 'queuetime'
        ]]
        
        df_fact.columns = ['DateKey', 'ActivityKey', 'AppelKey', 'ProjectKey', 'VDNKey', 'AgentKey',
                          'ACW', 'MeA', 'Duree_totale_appel', 'Duree_de_comm', 'Ringtime', 'Queuetime']
        
        logger.info(f"  {len(df_fact)} lignes dans Fact_WebHelp")
        
        # ========== Exporter en CSV ==========
        output_dir = 'backend/scripts/data/powerbi'
        os.makedirs(output_dir, exist_ok=True)
        
        logger.info(f"\n💾 Export en CSV vers {output_dir}...")
        
        df_dim_date.to_csv(f'{output_dir}/DIM_Date_WebHelp.csv', index=False, encoding='utf-8')
        logger.info("  ✅ DIM_Date_WebHelp.csv")
        
        df_dim_activite.to_csv(f'{output_dir}/DIM_Activite.csv', index=False, encoding='utf-8')
        logger.info("  ✅ DIM_Activite.csv")
        
        df_dim_appel.to_csv(f'{output_dir}/DIM_Appel_WH.csv', index=False, encoding='utf-8')
        logger.info("  ✅ DIM_Appel_WH.csv")
        
        df_dim_projet.to_csv(f'{output_dir}/DIM_Projet.csv', index=False, encoding='utf-8')
        logger.info("  ✅ DIM_Projet.csv")
        
        df_dim_vdn.to_csv(f'{output_dir}/DIM_VDN.csv', index=False, encoding='utf-8')
        logger.info("  ✅ DIM_VDN.csv")
        
        df_dim_agent.to_csv(f'{output_dir}/DIM_Agent.csv', index=False, encoding='utf-8')
        logger.info("  ✅ DIM_Agent.csv")
        
        df_fact.to_csv(f'{output_dir}/Fact_WebHelp.csv', index=False, encoding='utf-8')
        logger.info("  ✅ Fact_WebHelp.csv")
        
        logger.info("\n✨ Schéma en étoile créé avec succès!")
        logger.info(f"  Dossier: {os.path.abspath(output_dir)}")
        
        engine.dispose()
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("🚀 CRÉATION SCHÉMA EN ÉTOILE DEPUIS POSTGRESQL")
    logger.info("=" * 60)
    create_star_schema()