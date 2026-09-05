import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

// Matches MarketTrendAnalysis in the frontend's types.ts.
export interface MarketTrendAnalysisDto {
  cryptoSymbol: string;
  explanation: string;
  generatedAt: string;
}

// Was previously called directly from the browser with the API key baked
// into the client bundle (via vite.config.ts's `define`) — moved server-side
// so the key never reaches the client. See services/apiService.ts on the
// frontend for the caller.
const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly ai: GoogleGenAI | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('gemini.apiKey');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set. Market analysis feature will be disabled.');
    }
    this.ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  async getTrendExplanation(cryptoSymbol: string): Promise<MarketTrendAnalysisDto> {
    if (!this.ai) {
      throw new ServiceUnavailableException('Market analysis is not configured on this server.');
    }

    const prompt = `Explain the recent (last 7 days) market trends and key news for ${cryptoSymbol} in a concise paragraph (around 50-70 words) suitable for a mobile crypto app user. Focus on factual price movements and significant events if any. Avoid financial advice.`;

    try {
      const response = await this.ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: prompt,
        config: { temperature: 0.5 },
      });

      return {
        cryptoSymbol,
        explanation: response.text ?? '',
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Gemini request failed for ${cryptoSymbol}`, error as Error);
      throw new ServiceUnavailableException('Could not fetch market analysis. Please try again later.');
    }
  }
}
