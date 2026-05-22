import { describe, it, expect } from 'vitest';
import { sanitizarInput, gerarId } from '@/lib/pncp-api';

describe('sanitizarInput', () => {
  it('should remove angle brackets and quotes (HTML injection)', () => {
    expect(sanitizarInput('<script>alert("xss")</script>cadeira')).toBe('scriptalert(xss)/scriptcadeira');
  });

  it('should remove control characters', () => {
    expect(sanitizarInput('cadeira\x00ergonômica')).toBe('cadeiraergonômica');
  });

  it('should trim whitespace', () => {
    expect(sanitizarInput('  cadeira ergonômica  ')).toBe('cadeira ergonômica');
  });

  it('should limit to 200 characters', () => {
    const long = 'a'.repeat(300);
    expect(sanitizarInput(long).length).toBe(200);
  });

  it('should keep valid text unchanged', () => {
    expect(sanitizarInput('cadeira ergonômica')).toBe('cadeira ergonômica');
  });

  it('should handle empty string', () => {
    expect(sanitizarInput('')).toBe('');
  });
});

describe('gerarId', () => {
  it('should generate id for contrato with index', () => {
    const item: any = {
      tipo: 'CONTRATO',
      numeroContrato: '123',
      anoContrato: 2024,
    };
    expect(gerarId(item, 0)).toBe('c-123-2024-0');
  });

  it('should generate id for ata with index', () => {
    const item: any = {
      tipo: 'ATA',
      numeroAtaRegistroPreco: '456',
      anoAta: 2024,
    };
    expect(gerarId(item, 5)).toBe('a-456-2024-5');
  });
});
