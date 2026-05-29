import pandas as pd
import os

# Chemins
input_csv = 'backend/scripts/data/WH_FILE_Nettoye.csv'
output_csv = 'backend/scripts/data/WH_FILE_Deduplicated.csv'

print('📂 Chargement du CSV...')
df = pd.read_csv(input_csv)

print(f'📊 Nombre de lignes avant: {len(df)}')
print(f'📊 Nombre de timestamps uniques: {df["Date de début et Heure en Paris Time"].nunique()}')

# Dédupliquer: garder la première occurrence par timestamp
print('\n🔄 Déduplication...')
df_dedup = df.drop_duplicates(subset=['Date de début et Heure en Paris Time'], keep='first')

print(f'📊 Nombre de lignes après: {len(df_dedup)}')
print(f'📊 Lignes supprimées: {len(df) - len(df_dedup)}')

# Sauvegarder
print(f'\n💾 Sauvegarde dans {output_csv}...')
df_dedup.to_csv(output_csv, index=False)

print('✅ Terminé!')
print(f'\nCommande pour réimporter:')
print(f'TRUNCATE TABLE webhelp;')
print(f'\\copy webhelp FROM \'{os.path.abspath(output_csv)}\' WITH (FORMAT csv, HEADER true, DELIMITER \',\');')
print(f'SELECT COUNT(*) FROM webhelp;')