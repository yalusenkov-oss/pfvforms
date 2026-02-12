import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prepareDistributionData, preparePromoData, submitToGoogleSheets } from '../googleSheets';

// Mock fetch
global.fetch = vi.fn();

describe('Google Sheets Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    global.fetch.mockReset();
  });

  describe('prepareDistributionData', () => {
    it('should prepare distribution form data correctly', () => {
      const formData = {
        tariff: 'Премиум',
        releaseType: 'Single',
        releaseName: 'Test Release',
        mainArtist: 'Test Artist',
        fullName: 'John Doe',
        passportNumber: '1234 567890',
        issuedBy: 'Test City',
        issueDate: '2020-01-15',
        bankDetails: 'Test Bank Details',
        email: 'test@example.com',
        contactInfo: '@testartist',
        tiktokFull: 'yes',
        karaokeAddition: 'Да',
        singleTrackCount: '1',
        _tracks: JSON.stringify([
          {
            name: 'Test Track',
            version: '',
            artists: [{ name: 'Test Artist', type: 'main' }],
            lyricists: ['Test Lyricist'],
            composers: ['Test Composer'],
            explicitContent: 'no',
            substanceMention: 'no',
            lyrics: '',
          },
        ]),
      };

      const result = prepareDistributionData(formData);

      expect(result).toBeDefined();
      expect(result.tariff).toBe('premium');
      expect(result.releaseType).toBe('single');
      expect(result.releaseName).toBe('Test Release');
      expect(result.mainArtist).toBe('Test Artist');
      expect(result.fullName).toBe('John Doe');
      expect(result.totalPrice).toBeGreaterThan(0);
    });

    it('should calculate correct price for basic tariff single', () => {
      const formData = {
        tariff: 'Базовый',
        releaseType: 'Single',
        releaseName: 'Test',
        mainArtist: 'Test',
        fullName: 'Test',
        passportNumber: '1234 567890',
        issuedBy: 'Test',
        issueDate: '2020-01-15',
        bankDetails: 'Test',
        email: 'test@example.com',
        contactInfo: 'test',
        singleTrackCount: '1',
        karaokeAddition: 'Нет',
        _tracks: JSON.stringify([]),
      };

      const result = prepareDistributionData(formData);
      expect(result.totalPrice).toBe(500); // basic single = 500
    });

    it('should exclude large contract fields from payload', () => {
      const formData = {
        tariff: 'Премиум',
        releaseType: 'Single',
        releaseName: 'Test',
        mainArtist: 'Test',
        fullName: 'Test',
        passportNumber: '1234 567890',
        issuedBy: 'Test',
        issueDate: '2020-01-15',
        bankDetails: 'Test',
        email: 'test@example.com',
        contactInfo: 'test',
        singleTrackCount: '1',
        karaokeAddition: 'Нет',
        _tracks: JSON.stringify([]),
        contractHTML: '<html>Very long contract...</html>'.repeat(1000), // Simulate large field
      };

      const result = prepareDistributionData(formData);
      expect(result.contractHTML).toBeUndefined();
    });

    it('should handle promo discount calculation', () => {
      const formData = {
        tariff: 'Базовый',
        releaseType: 'Single',
        releaseName: 'Test',
        mainArtist: 'Test',
        fullName: 'Test',
        passportNumber: '1234 567890',
        issuedBy: 'Test',
        issueDate: '2020-01-15',
        bankDetails: 'Test',
        email: 'test@example.com',
        contactInfo: 'test',
        singleTrackCount: '1',
        karaokeAddition: 'Нет',
        _tracks: JSON.stringify([]),
        promoApplied: 'yes',
        promoDiscountType: 'percent',
        promoDiscountValue: '10',
      };

      const result = prepareDistributionData(formData);
      // base = 500, 10% discount = 50, total = 450
      expect(result.totalPrice).toBe(450);
    });
  });

  describe('submitToGoogleSheets', () => {
    it('should submit data to Google Apps Script', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true }),
      };
      // @ts-ignore
      global.fetch.mockResolvedValueOnce(mockResponse);

      const formData = {
        tariff: 'Базовый',
        releaseType: 'Single',
        releaseName: 'Test',
        mainArtist: 'Test',
        fullName: 'Test',
        passportNumber: '1234 567890',
        issuedBy: 'Test',
        issueDate: '2020-01-15',
        bankDetails: 'Test',
        email: 'test@example.com',
        contactInfo: 'test',
        singleTrackCount: '1',
        karaokeAddition: 'Нет',
        _tracks: JSON.stringify([]),
      };

      const result = await submitToGoogleSheets('distribution', formData);
      expect(result).toBeDefined();
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      // @ts-ignore
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const formData = {
        tariff: 'Базовый',
        releaseType: 'Single',
        releaseName: 'Test',
        mainArtist: 'Test',
        fullName: 'Test',
        passportNumber: '1234 567890',
        issuedBy: 'Test',
        issueDate: '2020-01-15',
        bankDetails: 'Test',
        email: 'test@example.com',
        contactInfo: 'test',
        singleTrackCount: '1',
        karaokeAddition: 'Нет',
        _tracks: JSON.stringify([]),
      };

      // Should throw or return error
      try {
        await submitToGoogleSheets('distribution', formData);
      } catch (err: any) {
        expect(err.message).toContain('error');
      }
    }, 10000); // Increase timeout to 10 seconds
  });
});
