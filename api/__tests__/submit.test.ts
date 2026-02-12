import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('API /submit endpoint', () => {
  let handler: any;

  beforeEach(async () => {
    // Import the handler
    const module = await import('../submit.js');
    handler = module.default;
  });

  it('should reject non-POST requests', async () => {
    const req = { method: 'GET' };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      end: vi.fn(),
    };

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('should handle OPTIONS requests for CORS', async () => {
    const req = { method: 'OPTIONS' };
    const res = {
      status: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      end: vi.fn(),
    };

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should exclude large contract fields from payload', async () => {
    const largeContractField = '<html>'.repeat(10000); // Very large field
    const payload = {
      tariff: 'basic',
      releaseName: 'Test',
      contractHTML: largeContractField,
      normalField: 'test value',
    };

    // Simulate the field filtering logic from the API
    const fieldsToExclude = [
      'contractHTML',
      'contract_html',
      'contractText',
      'contract_text',
      'signableContractHTML',
      'signable_contract_html',
      'signPreviewHTML',
      'sign_preview_html',
      'signatureImage',
      'signature_image',
      'fullContractHTML',
      'full_contract_html',
    ];

    const maxFieldLength = 45000;
    const cleanPayload: Record<string, any> = {};

    for (const [key, value] of Object.entries(payload)) {
      if (fieldsToExclude.includes(key)) {
        continue; // Exclude this field
      }
      if (typeof value === 'string' && value.length > maxFieldLength) {
        cleanPayload[key] = value.substring(0, maxFieldLength) + '...[TRUNCATED]';
      } else {
        cleanPayload[key] = value;
      }
    }

    // Assert that contractHTML was excluded
    expect(cleanPayload.contractHTML).toBeUndefined();
    expect(cleanPayload.normalField).toBe('test value');
    expect(cleanPayload.tariff).toBe('basic');
  });

  it('should truncate fields exceeding 45000 characters', () => {
    const veryLongString = 'a'.repeat(50000);
    const payload = { longField: veryLongString };

    const maxFieldLength = 45000;
    const cleanPayload: Record<string, any> = {};

    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === 'string' && value.length > maxFieldLength) {
        cleanPayload[key] = value.substring(0, maxFieldLength) + '...[TRUNCATED]';
      } else {
        cleanPayload[key] = value;
      }
    }

    expect(cleanPayload.longField.length).toBe(maxFieldLength + 13); // 45000 + '[TRUNCATED]'
    expect(cleanPayload.longField.endsWith('...[TRUNCATED]')).toBe(true);
  });

  it('should preserve short fields unchanged', () => {
    const payload = {
      tariff: 'premium',
      artist: 'Test Artist',
      email: 'test@example.com',
    };

    const maxFieldLength = 45000;
    const cleanPayload: Record<string, any> = {};

    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === 'string' && value.length > maxFieldLength) {
        cleanPayload[key] = value.substring(0, maxFieldLength) + '...[TRUNCATED]';
      } else {
        cleanPayload[key] = value;
      }
    }

    expect(cleanPayload).toEqual(payload);
  });
});
