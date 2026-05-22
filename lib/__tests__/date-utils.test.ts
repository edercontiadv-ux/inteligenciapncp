import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { getPNCPDateRange } from '@/lib/date-utils';

describe('getPNCPDateRange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return dataInicial and dataFinal in YYYYMMDD format', () => {
    vi.setSystemTime(new Date('2024-06-15T10:00:00'));
    const result = getPNCPDateRange();

    expect(result.dataInicial).toBe('20230615');
    expect(result.dataFinal).toBe('20240615');
    expect(result.dataInicial).toMatch(/^\d{8}$/);
    expect(result.dataFinal).toMatch(/^\d{8}$/);
  });

  it('should have dataInicial exactly 1 year before dataFinal', () => {
    vi.setSystemTime(new Date('2024-01-01T00:00:00'));
    const result = getPNCPDateRange();

    const inicioYear = parseInt(result.dataInicial.slice(0, 4));
    const inicioMonth = parseInt(result.dataInicial.slice(4, 6));
    const inicioDay = parseInt(result.dataInicial.slice(6, 8));

    const fimYear = parseInt(result.dataFinal.slice(0, 4));
    const fimMonth = parseInt(result.dataFinal.slice(4, 6));
    const fimDay = parseInt(result.dataFinal.slice(6, 8));

    expect(fimYear - inicioYear).toBe(1);
    expect(fimMonth).toBe(inicioMonth);
    expect(fimDay).toBe(inicioDay);
  });

  it('should handle leap year correctly', () => {
    vi.setSystemTime(new Date('2024-03-01T00:00:00'));
    const result = getPNCPDateRange();
    expect(result.dataInicial).toBe('20230301');
    expect(result.dataFinal).toBe('20240301');
  });

  it('should pad single-digit months and days with zero', () => {
    vi.setSystemTime(new Date('2024-01-05T00:00:00'));
    const result = getPNCPDateRange();
    expect(result.dataInicial).toBe('20230105');
    expect(result.dataFinal).toBe('20240105');
  });
});
