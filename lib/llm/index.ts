import { LLMProvider, ProviderName } from './types';
import { createAnthropicProvider } from './providers/anthropic';
import { createOpenAIProvider } from './providers/openai';
import { createFallbackProvider } from './providers/fallback';

const PROVIDER_ENV_KEY = 'LLM_PROVIDER';
const VALID_PROVIDERS: ProviderName[] = ['anthropic', 'openai', 'fallback'];

function getProviderName(): ProviderName {
  const name = (process.env[PROVIDER_ENV_KEY] || 'fallback').toLowerCase() as ProviderName;
  if (VALID_PROVIDERS.includes(name)) {
    return name;
  }
  console.warn(`LLM_PROVIDER "${name}" inválido. Usando "fallback".`);
  return 'fallback';
}

let cachedProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const name = getProviderName();

  switch (name) {
    case 'anthropic': {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) {
        console.warn('ANTHROPIC_API_KEY não configurada. Usando fallback.');
        cachedProvider = createFallbackProvider();
      } else {
        cachedProvider = createAnthropicProvider(key);
      }
      break;
    }

    case 'openai': {
      const key = process.env.OPENAI_API_KEY;
      if (!key) {
        console.warn('OPENAI_API_KEY não configurada. Usando fallback.');
        cachedProvider = createFallbackProvider();
      } else {
        const baseURL = process.env.OPENAI_API_BASE_URL;
        cachedProvider = createOpenAIProvider(key, baseURL);
      }
      break;
    }

    default:
      cachedProvider = createFallbackProvider();
  }

  return cachedProvider;
}

export function resetProvider(): void {
  cachedProvider = null;
}

export type { LLMProvider, ProviderName };
