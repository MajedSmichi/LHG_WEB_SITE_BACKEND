import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SentimentService {
  private pythonUrl = process.env.SENTIMENT_URL ?? 'http://localhost:8000/predict';

  async analyze(text: string) {
    const resp = await axios.post(this.pythonUrl, { text }, { timeout: 10000 });
    return resp.data;
  }
}