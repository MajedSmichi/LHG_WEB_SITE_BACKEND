"""
Script pour générer automatiquement le Prisma schema 
basé sur la structure réelle des tables PostgreSQL
"""

import os
import sys
from sqlalchemy import create_engine, inspect, String, Integer, Float, DateTime, Boolean
from dotenv import load_dotenv

# Charger variables d'environnement
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("❌ DATABASE_URL non trouvée dans .env")
    sys.exit(1)

def get_prisma_type(column_type):
    """Convertir type SQLAlchemy en type Prisma"""
    type_str = str(column_type)
    
    if 'INTEGER' in type_str or 'BIGINT' in type_str:
        return 'Int'
    elif 'REAL' in type_str or 'DOUBLE' in type_str or 'NUMERIC' in type_str:
        return 'Float'
    elif 'BOOLEAN' in type_str:
        return 'Boolean'
    elif 'TIMESTAMP' in type_str or 'DATE' in type_str:
        return 'DateTime'
    elif 'TEXT' in type_str or 'VARCHAR' in type_str:
        return 'String'
    else:
        return 'String'  # Par défaut

def generate_prisma_schema():
    """Générer le Prisma schema à partir des tables PostgreSQL"""
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    # Récupérer les noms des tables
    tables = inspector.get_table_names()
    tables = [t for t in tables if t in ['webhelp', 'reservations', 'colt_file']]
    
    if not tables:
        print("❌ Aucune table trouvée!")
        sys.exit(1)
    
    print(f"✅ Tables trouvées: {tables}")
    
    schema_content = """// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int     @id @default(autoincrement())
  email        String  @unique
  passwordHash String
  role         String  @default("user")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

"""
    
    # Générer les modèles pour chaque table
    for table_name in tables:
        columns = inspector.get_columns(table_name)
        
        print(f"\n📊 Colonnes de {table_name}:")
        
        model_name = table_name.capitalize()
        model_content = f"model {model_name} {{\n"
        
        # Ajouter une clé primaire automatique si elle n'existe pas
        primary_keys = inspector.get_pk_constraint(table_name)
        has_id = any(col['name'] == 'id' for col in columns)
        
        if not has_id:
            model_content += "  id           Int     @id @default(autoincrement())\n"
        
        for col in columns:
            col_name = col['name']
            col_type = col['type']
            nullable = col['nullable']
            
            prisma_type = get_prisma_type(col_type)
            optional_marker = "?" if nullable else ""
            
            print(f"  - {col_name}: {col_type} → {prisma_type}{optional_marker}")
            
            # Formater le nom de la colonne pour Prisma (snake_case → camelCase)
            prisma_col_name = col_name
            model_content += f"  {prisma_col_name}  {prisma_type}{optional_marker}\n"
        
        model_content += "}\n\n"
        schema_content += model_content
    
    # Écrire le fichier Prisma schema
    schema_path = os.path.join(os.path.dirname(__file__), '..', 'prisma', 'schema.prisma')
    os.makedirs(os.path.dirname(schema_path), exist_ok=True)
    
    with open(schema_path, 'w', encoding='utf-8') as f:
        f.write(schema_content)
    
    print(f"\n✅ Prisma schema généré: {schema_path}")
    print(f"📄 Contenu:\n{schema_content}")

if __name__ == '__main__':
    generate_prisma_schema()
