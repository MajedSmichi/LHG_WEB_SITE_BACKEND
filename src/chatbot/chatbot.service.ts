
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { ConversationsService } from '../conversations/conversations.service.js';
import axios from 'axios';

@Injectable()
export class ChatbotService {
  private readonly OLLAMA_URL = 'http://localhost:11434/api/generate';
  private readonly MODEL = 'neural-chat';

  constructor(
    private prisma: PrismaService,
    private conversationsService: ConversationsService,
  ) {}

  /**
   * Pipeline complet: Question → LLM → SQL → Réponse + Save to DB
   */
  async askQuestion(
    question: string,
    userId: number,
    conversationId?: number,
  ): Promise<any> {
    try {
      console.log(`\n🤖 Question: ${question}`);

      // Create or get conversation
      let convId = conversationId;
      if (!convId) {
        const newConv = await this.conversationsService.create(userId, question);
        convId = newConv.id;
      }

      // Étape 1: LLM génère SQL
      const sql = await this.generateSQL(question);
      if (!sql) {
        return { error: 'Impossible de générer une requête' };
      }
      console.log(`📝 SQL: ${sql}`);

      // Étape 2: Valider la SQL
      if (!this.validateSQL(sql)) {
        return { error: 'SQL invalide ou dangereuse' };
      }

      // Étape 3: Exécuter la SQL
      const data = await this.executeSQL(sql);
      if (!data || data.length === 0) {
        return { error: 'Aucun résultat trouvé' };
      }
      console.log(`📊 Données: ${JSON.stringify(data)}`);

      // Étape 4: Reformater en français
      const response = await this.formatResponse(question, data);

      // Étape 5: Save to database
      await this.conversationsService.addMessage(
        convId,
        userId,
        'user',
        question,
        response,
        sql,
        data,
      );

      return {
        success: true,
        question,
        sql,
        data,
        response,
        conversationId: convId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Erreur: ${errorMessage}`);
      return { error: errorMessage };
    }
  }

  /**
   * Utilise Ollama pour générer une requête SQL
   */
  private async generateSQL(question: string): Promise<string | null> {
const schema = `TABLE reservations (hôtels/réservations):
  - brand: Marque (Campanile, Kyriad, Première Classe)
  - resort_name: Nom du resort
  - reservation_status: BOOKED ou NO SHOW
  - customer_country: Pays du client
  - duree_sejour: Nombre de nuits
  - resv_revenue_in_euro: Revenu NET (€)
  - resv_revenue_total_in_euro: Revenu TOTAL (€)
  - rooms_sold: Nombre de chambres
  - booking_date: Date de réservation

TABLE webhelp (call center - appels - MAIN TABLE):
  - nom_activite: Type d'activité
  - nom_vdn: VDN
  - libelle_code_appel: CALL STATUS (answered, abandoned, forced_disconnect, forced_busy)
  - duree_totale_appel: Durée en secondes
  - zone_geographique: Zone
  - date_de_debut_et_heure_en_paris_time: DateTime


TABLE colt_file (detailed call info - only use if question mentions "transfert" or "resultat" specifically):
  - type_dappel: Type (Entrant, Sortant, Transfert)
  - resultat: Résultat
  - duree_globale__secondes_: Durée (secondes)
  - abandon_dans_lattente: Abandon flag (0/1)
  - duree_dattente__secondes_: Attente (secondes)
  - mois: Month number (1-12) - use directly: WHERE mois = 8
  - jour: Day number (1-31) - use directly: WHERE jour = 15
  - heure: Hour number (0-23) - use directly: WHERE heure = 14
  `;
    const prompt = `Generate EXACTLY ONE valid PostgreSQL SELECT query. SINGLE TABLE ONLY. EVERY QUERY MUST HAVE FROM clause.

${schema}

VALID COLUMNS FOR EACH TABLE:
webhelp ONLY has: nom_activite, nom_vdn, libelle_code_appel, duree_totale_appel, zone_geographique, date_de_debut_et_heure_en_paris_time
colt_file ONLY has: type_dappel, resultat, duree_globale__secondes_, abandon_dans_lattente, duree_dattente__secondes_, heure, mois, jour
reservations ONLY has: brand, resort_name, reservation_status, customer_country, duree_sejour, resv_revenue_in_euro, resv_revenue_total_in_euro, rooms_sold, booking_date

🔴 COLUMNS THAT DO NOT EXIST (NEVER USE):
- resultat does NOT exist in webhelp (it only exists in colt_file)
- type_dappel does NOT exist in webhelp (use libelle_code_appel instead)
- abandon_dans_lattente does NOT exist in webhelp

EXAMPLES (must use exact format):
- "Combien de réservations": SELECT COUNT(*) as count FROM reservations
- "Top 5 brands": SELECT brand, COUNT(*) as total FROM reservations GROUP BY brand ORDER BY total DESC LIMIT 5
- "Réservations par statut": SELECT reservation_status, COUNT(*) as count FROM reservations GROUP BY reservation_status
- "Revenu total": SELECT SUM(resv_revenue_total_in_euro) as total_revenue FROM reservations
- "Revenu net": SELECT SUM(resv_revenue_in_euro) as net_revenue FROM reservations
- "Revenu moyen": SELECT AVG(resv_revenue_total_in_euro) as avg_revenue FROM reservations
- "Écart des revenus": SELECT SUM(resv_revenue_total_in_euro) - SUM(resv_revenue_in_euro) as revenue_diff FROM reservations
- "Revenu par hôtel": SELECT resort_name, SUM(resv_revenue_total_in_euro) as total_revenue FROM reservations GROUP BY resort_name
- "Revenu par marque": SELECT brand, SUM(resv_revenue_total_in_euro) as total_revenue FROM reservations GROUP BY brand
- "Revenu Campanile Biarritz": SELECT SUM(resv_revenue_total_in_euro) as total_revenue FROM reservations WHERE resort_name LIKE '%BIARRITZ%'
- "Revenu par nombre de chambres": SELECT rooms_sold, SUM(resv_revenue_total_in_euro) as total_revenue FROM reservations GROUP BY rooms_sold
- "Somme revenu Biarritz": SELECT SUM(resv_revenue_total_in_euro) as total_revenue FROM reservations WHERE resort_name LIKE '%BIARRITZ%'
- "nbre des appels repondus": SELECT COUNT(*) as count FROM webhelp WHERE libelle_code_appel = 'answered'
- "Appels répondus": SELECT COUNT(*) as count FROM webhelp WHERE libelle_code_appel = 'answered'
- "Appels abandonnés": SELECT COUNT(*) as count FROM webhelp WHERE libelle_code_appel = 'abandoned'
- "Appels déconnexion": SELECT COUNT(*) as count FROM webhelp WHERE libelle_code_appel = 'forced_disconnect'
- "Appels par activité": SELECT nom_activite, COUNT(*) as count FROM webhelp GROUP BY nom_activite LIMIT 10
- "Appels transfert": SELECT COUNT(*) as count FROM colt_file WHERE type_dappel LIKE '%Transfert%'
- "Appels colt_file par resultat": SELECT resultat, COUNT(*) as count FROM colt_file GROUP BY resultat
- "Appels colt_file par type": SELECT type_dappel, COUNT(*) as count FROM colt_file GROUP BY type_dappel
- "Appels par resultat août 2020": SELECT resultat, COUNT(*) as count FROM colt_file WHERE mois = 8 GROUP BY resultat

RULES:
1. ONLY SELECT - no INSERT, UPDATE, DELETE
2. SINGLE TABLE ONLY - NO JOINS
3. EVERY SELECT MUST HAVE FROM clause (specify table: reservations, webhelp, or colt_file)
4. Use exact lowercase table names: reservations, webhelp, colt_file
5. If ANY question mentions calls/appels/answered/abandoned/activity/zone → USE webhelp with libelle_code_appel
6. If question mentions transfert → USE colt_file with type_dappel
7. For resort/hotel names use LIKE (e.g., LIKE '%BIARRITZ%') to avoid case mismatch
8. ALIASES: Use simple names without spaces (e.g., AS total_revenue NOT AS 'Total Revenue')
9. Add LIMIT 100 if not present
10. NEVER use "resultat" with webhelp table

Question: "${question}"

Return ONLY SQL (no explanation, no backticks):`;


    try {
      const response = await axios.post(
        this.OLLAMA_URL,
        {
          model: this.MODEL,
          prompt,
          stream: false,
          temperature: 0,
          num_predict: 120,
          keep_alive: '30m',
        },
        { timeout: 300000 }
      );

      let sql = response.data.response.trim();

      // Extract from backticks
      const match = sql.match(/```[\w]*\n?([\s\S]*?)\n?```/);
      if (match) {
        sql = match[1].trim();
      }

      // Remove all backticks and semicolons
      sql = sql.replace(/```/g, '').replace(/;/g, '').trim();

      // Fix alias quotes: convert AS 'name' to AS name (remove problematic quotes)
      sql = sql.replace(/AS\s+'([^']+)'/g, 'AS $1');

      // Take first line only
      sql = sql.split('\n')[0].trim();

      // Clean up multiple spaces
      sql = sql.replace(/\s+/g, ' ').trim();

      if (!sql.toUpperCase().startsWith('SELECT')) {
        console.error(`⚠️ Invalid response from LLM: ${response.data.response}`);
        return null;
      }

      // Ensure LIMIT exists
      if (!sql.toUpperCase().includes('LIMIT')) {
        sql += ' LIMIT 100';
      }

      return sql;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Ollama error: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Valide que la SQL est sûre
   */
  private validateSQL(sql: string): boolean {
    const upperSQL = sql.toUpperCase();

    // Doit être un SELECT
    if (!upperSQL.trim().startsWith('SELECT')) {
      console.error('⚠️ Doit commencer par SELECT');
      return false;
    }

    // MUST have FROM clause
    if (!upperSQL.includes('FROM')) {
      console.error('⚠️ Missing FROM clause - SQL must specify a table');
      return false;
    }

    // Interdire opérations dangereuses
    const dangerous = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'INSERT', 'UPDATE'];
    for (const keyword of dangerous) {
      if (upperSQL.includes(keyword)) {
        console.error(`⚠️ Opération dangereuse détectée: ${keyword}`);
        return false;
      }
    }

    // ⚠️ Reject resultat ONLY when used with webhelp (doesn't exist there)
    if (upperSQL.includes('RESULTAT') && upperSQL.includes('FROM WEBHELP')) {
      console.error(`⚠️ Column "resultat" does not exist in webhelp - use libelle_code_appel instead`);
      return false;
    }

    return true;
  }

  /**
   * Exécute la requête SQL
   */
  private async executeSQL(sql: string): Promise<any[] | null> {
    try {
      // Ajouter LIMIT si absent
      let finalSql = sql;
      if (!finalSql.toUpperCase().includes('LIMIT')) {
        finalSql += ' LIMIT 100';
      }

      const result = await (this.prisma as any).$queryRawUnsafe(finalSql);

      // Convertir BigInt en Number pour la sérialisation JSON
      return this.convertBigIntToNumber(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Erreur SQL: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Convertit les BigInt et Decimal en Number pour JSON
   */
  private convertBigIntToNumber(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'bigint') {
      return Number(obj);
    }

    // Convertir les Decimals Prisma (structure: {s, e, d})
    if (typeof obj === 'object' && !Array.isArray(obj) && obj.s !== undefined && obj.e !== undefined && obj.d !== undefined) {
      return parseFloat(obj.toString());
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.convertBigIntToNumber(item));
    }

    if (typeof obj === 'object') {
      const converted: any = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = this.convertBigIntToNumber(value);
      }
      return converted;
    }

    return obj;
  }

  /**
   * Reformate les résultats en français sans LLM (garanti exact)
   */
  private async formatResponse(question: string, data: any[]): Promise<string> {
    if (!data || data.length === 0) {
      return 'Aucun résultat trouvé.';
    }

    // Une seule ligne = résultat simple
    if (data.length === 1) {
      const row = data[0];
      const keys = Object.keys(row);

      // Cas COUNT/SUM/AVG (un seul nombre)
      if (keys.length === 1) {
        const key = keys[0];
        let value = row[key];

        // Arrondir si nombre décimal
        if (typeof value === 'number' && !Number.isInteger(value)) {
          value = Math.round(value * 100) / 100;
        }

        if (key.toLowerCase().includes('count')) {
          return `Il y a ${value} résultat(s).`;
        } else if (key.toLowerCase().includes('total') || key.toLowerCase().includes('sum') || key.toLowerCase().includes('net')) {
          return `Le total est ${value}.`;
        } else if (key.toLowerCase().includes('avg')) {
          return `La moyenne est ${value}.`;
        } else if (key.toLowerCase().includes('percentage') || key.toLowerCase().includes('taux')) {
          return `Le taux est ${value}%.`;
        }
        return `La valeur est ${value}.`;
      }

      // Cas avec plusieurs colonnes
      return Object.entries(row)
        .map(([k, v]) => {
          let formatted = v;
          if (typeof v === 'number' && !Number.isInteger(v)) {
            formatted = Math.round(v * 100) / 100;
          }
          return `${k}: ${formatted}`;
        })
        .join(', ');
    }

    // Plusieurs lignes = liste
    const firstRow = data[0];
    const keys = Object.keys(firstRow);

    // Cas TOP (2 colonnes: nom et count)
// Cas TOP (2 colonnes: nom et count)
if (keys.length === 2) {
  // Détection robuste: chercher la clé de compte/total
  let countKey = keys.find(k => {
    const lk = k.toLowerCase();
    return lk === 'count' || lk === 'total' || lk.includes('count') || lk.includes('total') || lk.includes('sum') || lk.includes('avg');
  });

  if (!countKey) {
    countKey = keys[1]; // fallback: deuxième clé
  }

  const nameKey = keys.find(k => k !== countKey) || keys[0];

  const items = data
    .map(row => {
      let count = row[countKey];
      if (typeof count === 'number' && !Number.isInteger(count)) {
        count = Math.round(count * 100) / 100;
      }
      return `${row[nameKey]} (${count})`;
    })
    .join(', ');

  return `Les principaux résultats sont: ${items}.`;
}

    // Format générique: afficher les colonnes principales
    const items = data
      .slice(0, 10)
      .map(row => {
        const values = keys.map(k => {
          let v = row[k];
          if (typeof v === 'number' && !Number.isInteger(v)) {
            v = Math.round(v * 100) / 100;
          }
          return `${k}=${v}`;
        }).join(', ');
        return values;
      })
      .join('; ');

    return `Résultats: ${items}${data.length > 10 ? ` (et ${data.length - 10} autres)` : ''}.`;
  }
}
