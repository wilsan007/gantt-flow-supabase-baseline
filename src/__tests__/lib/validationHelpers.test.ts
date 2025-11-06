import { describe, it, expect } from 'vitest';

// Tests pour les helpers de validation
describe('Validation Helpers', () => {
  describe('Email Validation', () => {
    it('should validate correct email format', () => {
      const isValidEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
      };
      
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@company.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
    });

    it('should validate email length', () => {
      const isValidEmailLength = (email: string) => {
        return email.length >= 5 && email.length <= 255;
      };
      
      expect(isValidEmailLength('a@b.c')).toBe(true);
      expect(isValidEmailLength('ab')).toBe(false);
      expect(isValidEmailLength('a'.repeat(256))).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should validate password length', () => {
      const isValidPasswordLength = (password: string) => {
        return password.length >= 8 && password.length <= 128;
      };
      
      expect(isValidPasswordLength('Password123!')).toBe(true);
      expect(isValidPasswordLength('Short1!')).toBe(false);
      expect(isValidPasswordLength('a'.repeat(129))).toBe(false);
    });

    it('should validate password complexity', () => {
      const isStrongPassword = (password: string) => {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
      };
      
      expect(isStrongPassword('Password123!')).toBe(true);
      expect(isStrongPassword('password123')).toBe(false); // No uppercase
      expect(isStrongPassword('PASSWORD123')).toBe(false); // No lowercase
      expect(isStrongPassword('Password')).toBe(false); // No number
      expect(isStrongPassword('Password123')).toBe(false); // No special char
    });

    it('should check if password matches confirmation', () => {
      const passwordsMatch = (password: string, confirmation: string) => {
        return password === confirmation;
      };
      
      expect(passwordsMatch('Password123!', 'Password123!')).toBe(true);
      expect(passwordsMatch('Password123!', 'Different123!')).toBe(false);
    });
  });

  describe('Phone Number Validation', () => {
    it('should validate phone number format', () => {
      const isValidPhoneNumber = (phone: string) => {
        const cleaned = phone.replace(/[\s\-\(\)]/g, '');
        const regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        return regex.test(cleaned) && cleaned.length >= 10;
      };
      
      expect(isValidPhoneNumber('+33612345678')).toBe(true);
      expect(isValidPhoneNumber('0612345678')).toBe(true);
      expect(isValidPhoneNumber('invalid')).toBe(false);
    });

    it('should validate international phone format', () => {
      const isInternationalPhone = (phone: string) => {
        return phone.startsWith('+');
      };
      
      expect(isInternationalPhone('+33612345678')).toBe(true);
      expect(isInternationalPhone('0612345678')).toBe(false);
    });
  });

  describe('URL Validation', () => {
    it('should validate URL format', () => {
      const isValidURL = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };
      
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://localhost:3000')).toBe(true);
      expect(isValidURL('not-a-url')).toBe(false);
    });

    it('should validate HTTPS URLs only', () => {
      const isHTTPS = (url: string) => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === 'https:';
        } catch {
          return false;
        }
      };
      
      expect(isHTTPS('https://example.com')).toBe(true);
      expect(isHTTPS('http://example.com')).toBe(false);
    });
  });

  describe('String Validation', () => {
    it('should validate alphanumeric strings', () => {
      const isAlphanumeric = (str: string) => {
        return /^[a-zA-Z0-9]+$/.test(str);
      };
      
      expect(isAlphanumeric('abc123')).toBe(true);
      expect(isAlphanumeric('ABC123')).toBe(true);
      expect(isAlphanumeric('abc-123')).toBe(false);
      expect(isAlphanumeric('abc 123')).toBe(false);
    });

    it('should validate non-empty strings', () => {
      const isNonEmpty = (str: string | undefined | null) => {
        return Boolean(str && str.trim().length > 0);
      };
      
      expect(isNonEmpty('test')).toBe(true);
      expect(isNonEmpty('   ')).toBe(false);
      expect(isNonEmpty('')).toBe(false);
      expect(isNonEmpty(null)).toBe(false);
      expect(isNonEmpty(undefined)).toBe(false);
    });

    it('should validate string length range', () => {
      const isValidLength = (str: string, min: number, max: number) => {
        const length = str.trim().length;
        return length >= min && length <= max;
      };
      
      expect(isValidLength('test', 2, 10)).toBe(true);
      expect(isValidLength('a', 2, 10)).toBe(false);
      expect(isValidLength('too long string', 2, 10)).toBe(false);
    });

    it('should validate no special characters', () => {
      const hasNoSpecialChars = (str: string) => {
        return /^[a-zA-Z0-9\s]+$/.test(str);
      };
      
      expect(hasNoSpecialChars('Hello World 123')).toBe(true);
      expect(hasNoSpecialChars('Hello@World')).toBe(false);
    });
  });

  describe('Number Validation', () => {
    it('should validate positive numbers', () => {
      const isPositive = (num: number) => {
        return num > 0;
      };
      
      expect(isPositive(5)).toBe(true);
      expect(isPositive(0)).toBe(false);
      expect(isPositive(-5)).toBe(false);
    });

    it('should validate number range', () => {
      const isInRange = (num: number, min: number, max: number) => {
        return num >= min && num <= max;
      };
      
      expect(isInRange(50, 0, 100)).toBe(true);
      expect(isInRange(0, 0, 100)).toBe(true);
      expect(isInRange(100, 0, 100)).toBe(true);
      expect(isInRange(150, 0, 100)).toBe(false);
    });

    it('should validate integer values', () => {
      const isInteger = (num: number) => {
        return Number.isInteger(num);
      };
      
      expect(isInteger(5)).toBe(true);
      expect(isInteger(5.5)).toBe(false);
    });

    it('should validate percentage values', () => {
      const isValidPercentage = (num: number) => {
        return num >= 0 && num <= 100;
      };
      
      expect(isValidPercentage(50)).toBe(true);
      expect(isValidPercentage(0)).toBe(true);
      expect(isValidPercentage(100)).toBe(true);
      expect(isValidPercentage(150)).toBe(false);
      expect(isValidPercentage(-10)).toBe(false);
    });
  });

  describe('File Validation', () => {
    it('should validate file size', () => {
      const isValidFileSize = (sizeInBytes: number, maxSizeMB: number) => {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return sizeInBytes <= maxSizeBytes;
      };
      
      expect(isValidFileSize(1024 * 1024, 5)).toBe(true); // 1MB < 5MB
      expect(isValidFileSize(10 * 1024 * 1024, 5)).toBe(false); // 10MB > 5MB
    });

    it('should validate file extension', () => {
      const isValidFileExtension = (filename: string, allowedExtensions: string[]) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        return ext ? allowedExtensions.includes(ext) : false;
      };
      
      expect(isValidFileExtension('document.pdf', ['pdf', 'doc'])).toBe(true);
      expect(isValidFileExtension('image.jpg', ['pdf', 'doc'])).toBe(false);
    });

    it('should validate image file types', () => {
      const isImageFile = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        return ext ? imageExtensions.includes(ext) : false;
      };
      
      expect(isImageFile('photo.jpg')).toBe(true);
      expect(isImageFile('photo.png')).toBe(true);
      expect(isImageFile('document.pdf')).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      const validateRequiredFields = (data: Record<string, any>, requiredFields: string[]) => {
        const missing: string[] = [];
        
        requiredFields.forEach(field => {
          if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
            missing.push(field);
          }
        });
        
        return { isValid: missing.length === 0, missing };
      };
      
      const data = { name: 'John', email: 'john@example.com' };
      const result1 = validateRequiredFields(data, ['name', 'email']);
      const result2 = validateRequiredFields(data, ['name', 'email', 'phone']);
      
      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(false);
      expect(result2.missing).toContain('phone');
    });

    it('should validate email in form', () => {
      const validateEmailField = (email: string) => {
        if (!email) return { valid: false, error: 'Email requis' };
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return { valid: false, error: 'Format email invalide' };
        }
        
        return { valid: true, error: null };
      };
      
      expect(validateEmailField('test@example.com').valid).toBe(true);
      expect(validateEmailField('invalid').valid).toBe(false);
      expect(validateEmailField('').valid).toBe(false);
    });
  });

  describe('Business Rules Validation', () => {
    it('should validate minimum age requirement', () => {
      const meetsMinimumAge = (birthdate: Date, minimumAge: number) => {
        const today = new Date();
        let age = today.getFullYear() - birthdate.getFullYear();
        const monthDiff = today.getMonth() - birthdate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
          age--;
        }
        
        return age >= minimumAge;
      };
      
      const eighteenYearsAgo = new Date();
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
      
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      
      expect(meetsMinimumAge(eighteenYearsAgo, 18)).toBe(true);
      expect(meetsMinimumAge(tenYearsAgo, 18)).toBe(false);
    });

    it('should validate unique username', () => {
      const existingUsernames = ['user1', 'user2', 'admin'];
      
      const isUsernameAvailable = (username: string) => {
        return !existingUsernames.includes(username.toLowerCase());
      };
      
      expect(isUsernameAvailable('newuser')).toBe(true);
      expect(isUsernameAvailable('user1')).toBe(false);
      expect(isUsernameAvailable('USER1')).toBe(false);
    });

    it('should validate working hours', () => {
      const isValidWorkingHours = (hours: number) => {
        return hours >= 0 && hours <= 24 && hours % 0.5 === 0;
      };
      
      expect(isValidWorkingHours(8)).toBe(true);
      expect(isValidWorkingHours(7.5)).toBe(true);
      expect(isValidWorkingHours(7.3)).toBe(false);
      expect(isValidWorkingHours(25)).toBe(false);
    });
  });
});
