import { findAnswer } from './knowledge-base';

export function getFallbackResponse(message: string): string | null {
  return findAnswer(message);
}
