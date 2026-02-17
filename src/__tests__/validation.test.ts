import { describe, it, expect } from 'vitest';

describe('Form Validation', () => {
  describe('Distribution form validation', () => {
    const validateStep2 = (data: Record<string, string>) => {
      const errors: string[] = [];
      if (!data.fullName?.trim()) errors.push('Укажите ФИО');
      if (!data.passportNumber?.trim()) errors.push('Укажите серию и номер паспорта');
      if (!data.issuedBy?.trim()) errors.push('Укажите кем выдан паспорт');
      if (!data.issueDate) errors.push('Укажите дату выдачи паспорта');
      if (!data.email?.trim()) errors.push('Укажите электронную почту');
      return { valid: errors.length === 0, errors };
    };

    it('should pass with all required fields filled', () => {
      const data = {
        fullName: 'John Doe',
        passportNumber: '1234 567890',
        issuedBy: 'Test City',
        issueDate: '2020-01-15',
        email: 'test@example.com',
      };

      const result = validateStep2(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail if fullName is missing', () => {
      const data = {
        fullName: '',
        passportNumber: '1234 567890',
        issuedBy: 'Test City',
        issueDate: '2020-01-15',
        bankDetails: 'Test Bank',
        email: 'test@example.com',
      };

      const result = validateStep2(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Укажите ФИО');
    });

    it('should fail if passportNumber is missing', () => {
      const data = {
        fullName: 'John Doe',
        passportNumber: '',
        issuedBy: 'Test City',
        issueDate: '2020-01-15',
        bankDetails: 'Test Bank',
        email: 'test@example.com',
      };

      const result = validateStep2(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Укажите серию и номер паспорта');
    });

    it('should fail if email is missing', () => {
      const data = {
        fullName: 'John Doe',
        passportNumber: '1234 567890',
        issuedBy: 'Test City',
        issueDate: '2020-01-15',
        email: '',
      };

      const result = validateStep2(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Укажите электронную почту');
    });

    it('should collect all validation errors', () => {
      const data = {
        fullName: '',
        passportNumber: '',
        issuedBy: '',
        issueDate: '',
        email: '',
      };

      const result = validateStep2(data);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(5);
    });
  });

  describe('Step 3 consent validation', () => {
    const validateStep3 = (agreed: boolean) => {
      if (!agreed) {
        return { valid: false, errors: ['Необходимо согласие на обработку персональных данных'] };
      }
      return { valid: true, errors: [] };
    };

    it('should pass when consent is given', () => {
      const result = validateStep3(true);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when consent is not given', () => {
      const result = validateStep3(false);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Необходимо согласие на обработку персональных данных');
    });
  });

  describe('Step 4 contacts validation', () => {
    const validateStep4 = (data: Record<string, string>) => {
      const errors: string[] = [];
      if (!data.contactInfo?.trim()) errors.push('Укажите контакты для связи');
      return { valid: errors.length === 0, errors };
    };

    it('should pass with contactInfo', () => {
      const data = { contactInfo: '@artist' };
      const result = validateStep4(data);
      expect(result.valid).toBe(true);
    });

    it('should fail without contactInfo', () => {
      const data = { contactInfo: '' };
      const result = validateStep4(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Укажите контакты для связи');
    });
  });

  describe('Promo form validation', () => {
    const validatePromo = (data: Record<string, string>) => {
      const errors: string[] = [];
      const promoType = data.promoType;

      if (!promoType) {
        errors.push('Выберите тип промо');
        return { valid: false, errors };
      }

      if (promoType === 'detailed') {
        if (!data.promoReleaseLink?.trim()) errors.push('Укажите ссылку на релиз');
        if (!data.promoUPC?.trim()) errors.push('Укажите UPC или название релиза');
        if (!data.promoReleaseDate) errors.push('Укажите дату релиза');
        if (!data.promoGenre?.trim()) errors.push('Укажите жанр релиза');
        if (!data.promoArtistTitle?.trim()) errors.push('Укажите исполнителя и название');
        if (!data.promoDescription?.trim()) errors.push('Укажите описание релиза');
        if (!data.promoArtistInfo?.trim()) errors.push('Укажите информацию об артисте');
      }

      return { valid: errors.length === 0, errors };
    };

    it('should fail if no promo type selected', () => {
      const result = validatePromo({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Выберите тип промо');
    });

    it('should pass detailed promo with all required fields', () => {
      const data = {
        promoType: 'detailed',
        promoReleaseLink: 'https://example.com/release',
        promoUPC: 'test-upc',
        promoReleaseDate: '2025-02-15',
        promoGenre: 'Electronic',
        promoArtistTitle: 'Artist - Track',
        promoDescription: 'Description',
        promoArtistInfo: 'Artist info',
      };

      const result = validatePromo(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail detailed promo if required fields are missing', () => {
      const data = {
        promoType: 'detailed',
        promoReleaseLink: '',
        promoUPC: '',
      };

      const result = validatePromo(data);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
