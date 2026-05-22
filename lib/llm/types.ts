export interface LLMProvider {
  name: string;
  depurarTermos(descricao: string): Promise<string[]>;
}

export type ProviderName = 'anthropic' | 'openai' | 'fallback';
