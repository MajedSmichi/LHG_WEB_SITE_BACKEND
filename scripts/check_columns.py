import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://projet_lhg_user:123456@localhost:5432/projet_lhg_db?schema=public')
engine = create_engine(DATABASE_URL)

df = pd.read_sql("SELECT * FROM webhelp LIMIT 1", engine)
print("Colonnes dans PostgreSQL:")
for col in df.columns:
    print(f"  '{col}'")