import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PowerbiService {
  private tenantId = process.env.TENANT_ID;
  private clientId = process.env.CLIENT_ID;
  private clientSecret = process.env.CLIENT_SECRET;

  private groupId = process.env.PBI_GROUP_ID;
  private reportId = process.env.PBI_REPORT_ID;

  // 🔥 CACHE TOKEN
  private cachedToken: string | null = null;
  private tokenExpiration: number = 0;

  // =========================
  // GET AZURE ACCESS TOKEN
  // =========================
  async getAccessToken(): Promise<string> {
    // ✅ réutilise le token s'il est encore valide
    if (this.cachedToken && Date.now() < this.tokenExpiration) {
      return this.cachedToken;
    }

    try {
      const url = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;

      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);
      params.append('scope', 'https://analysis.windows.net/powerbi/api/.default');

      const res = await axios.post(url, params);

      this.cachedToken = res.data.access_token;

      // expire dans ~55 min (safe buffer)
      this.tokenExpiration = Date.now() + (res.data.expires_in - 300) * 1000;

      return this.cachedToken;

    } catch (error) {
      console.error('Azure token error:', error.response?.data || error.message);
      throw new InternalServerErrorException('Erreur Azure token');
    }
  }

  // =========================
  // GET EMBED CONFIG
  // =========================
  async getEmbedToken() {
    try {
      const token = await this.getAccessToken();
      console.log("GROUP_ID:", this.groupId);
console.log("REPORT_ID:", this.reportId);
console.log("URL:", `https://api.powerbi.com/v1.0/myorg/groups/${this.groupId}/reports/${this.reportId}`);
      // 🔥 1. récupérer infos report
      const reportRes = await axios.get(
        `https://api.powerbi.com/v1.0/myorg/groups/${this.groupId}/reports/${this.reportId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // 🔥 2. générer embed token
      const embedRes = await axios.post(
        `https://api.powerbi.com/v1.0/myorg/groups/${this.groupId}/reports/${this.reportId}/GenerateToken`,
        {
          accessLevel: 'View'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        embedUrl: reportRes.data.embedUrl, // ✅ mieux que hardcoded
        reportId: this.reportId,
        embedToken: embedRes.data.token
      };

    } catch (error) {
      console.error('Power BI error:', error.response?.data || error.message);
      throw new InternalServerErrorException('Erreur Power BI');
    }
  }
}
