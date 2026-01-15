/**
 * Tests for Validation Module
 * 
 * Tests for input validation and sanitization functions.
 * Critical for security - prevents XSS, SQL injection, etc.
 */

import {
  sanitizeText,
  sanitizeMultilineText,
  sanitizeDisplayName,
  sanitizeCity,
  uuidSchema,
  emailSchema,
  displayNameSchema,
  ageSchema,
  ageStringSchema,
  citySchema,
  bioSchema,
  messageContentSchema,
  validateOrThrow,
} from '../validation';

describe('Sanitization Functions', () => {
  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      // HTML tags are removed, text content remains (no space added between)
      expect(sanitizeText('<script>alert("xss")</script>Hello')).toBe('alert("xss")Hello');
      expect(sanitizeText('<b>Bold</b> text')).toBe('Bold text');
      expect(sanitizeText('<a href="evil">Link</a>')).toBe('Link');
    });

    it('should remove javascript: protocol', () => {
      expect(sanitizeText('javascript:alert(1)')).toBe('alert(1)');
      expect(sanitizeText('JAVASCRIPT:void(0)')).toBe('void(0)');
    });

    it('should remove event handlers', () => {
      expect(sanitizeText('text onclick=alert(1)')).toBe('text alert(1)');
      expect(sanitizeText('text onmouseover=bad()')).toBe('text bad()');
    });

    it('should remove null bytes', () => {
      expect(sanitizeText('hello\x00world')).toBe('helloworld');
    });

    it('should normalize whitespace', () => {
      expect(sanitizeText('  too   many   spaces  ')).toBe('too many spaces');
      expect(sanitizeText('\t\ntab and newline')).toBe('tab and newline');
    });

    it('should handle empty/null input', () => {
      expect(sanitizeText('')).toBe('');
      // @ts-expect-error - testing edge case
      expect(sanitizeText(null)).toBe('');
      // @ts-expect-error - testing edge case
      expect(sanitizeText(undefined)).toBe('');
    });

    it('should preserve normal text', () => {
      expect(sanitizeText('Hello, World!')).toBe('Hello, World!');
      expect(sanitizeText('User123')).toBe('User123');
    });
  });

  describe('sanitizeMultilineText', () => {
    it('should preserve single newlines', () => {
      expect(sanitizeMultilineText('Line 1\nLine 2')).toBe('Line 1\nLine 2');
    });

    it('should limit consecutive newlines to 2', () => {
      expect(sanitizeMultilineText('Line 1\n\n\n\nLine 2')).toBe('Line 1\n\nLine 2');
    });

    it('should trim each line', () => {
      expect(sanitizeMultilineText('  Line 1  \n  Line 2  ')).toBe('Line 1\nLine 2');
    });

    it('should still remove HTML/XSS', () => {
      const result = sanitizeMultilineText('<script>bad</script>\nGood text');
      expect(result).not.toContain('<script>');
      expect(result).toContain('Good text');
    });
  });

  describe('sanitizeDisplayName', () => {
    it('should allow basic names', () => {
      expect(sanitizeDisplayName('John')).toBe('John');
      expect(sanitizeDisplayName('Mary Jane')).toBe('Mary Jane');
      expect(sanitizeDisplayName("O'Brien")).toBe("O'Brien");
    });

    it('should remove special characters', () => {
      expect(sanitizeDisplayName('User@123')).toBe('User123');
      expect(sanitizeDisplayName('Test#User$')).toBe('TestUser');
    });

    it('should truncate to 30 characters', () => {
      const longName = 'A'.repeat(50);
      expect(sanitizeDisplayName(longName).length).toBe(30);
    });

    it('should allow ampersand and hyphen', () => {
      expect(sanitizeDisplayName('Jack & Jill')).toBe('Jack & Jill');
      expect(sanitizeDisplayName('Mary-Jane')).toBe('Mary-Jane');
    });
  });

  describe('sanitizeCity', () => {
    it('should allow normal city names', () => {
      expect(sanitizeCity('San Francisco')).toBe('San Francisco');
      expect(sanitizeCity('New York')).toBe('New York');
      expect(sanitizeCity('Los Angeles, CA')).toBe('Los Angeles, CA');
    });

    it('should truncate to 50 characters', () => {
      const longCity = 'A'.repeat(100);
      expect(sanitizeCity(longCity).length).toBe(50);
    });

    it('should remove special characters except common ones', () => {
      expect(sanitizeCity('City@123')).toBe('City123');
    });
  });
});

describe('Zod Schemas', () => {
  describe('uuidSchema', () => {
    it('should accept valid UUIDs', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(uuidSchema.safeParse(validUuid).success).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
      expect(uuidSchema.safeParse('123').success).toBe(false);
      expect(uuidSchema.safeParse('').success).toBe(false);
    });
  });

  describe('emailSchema', () => {
    it('should accept valid emails', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true);
      expect(emailSchema.safeParse('user.name@domain.org').success).toBe(true);
    });

    it('should transform to lowercase', () => {
      const result = emailSchema.safeParse('Test@EXAMPLE.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should reject invalid emails', () => {
      expect(emailSchema.safeParse('not-an-email').success).toBe(false);
      expect(emailSchema.safeParse('@missing.com').success).toBe(false);
      expect(emailSchema.safeParse('missing@').success).toBe(false);
    });
  });

  describe('displayNameSchema', () => {
    it('should accept valid names', () => {
      expect(displayNameSchema.safeParse('John').success).toBe(true);
      expect(displayNameSchema.safeParse('Mary Jane').success).toBe(true);
    });

    it('should reject too short names', () => {
      expect(displayNameSchema.safeParse('A').success).toBe(false);
      expect(displayNameSchema.safeParse('').success).toBe(false);
    });

    it('should handle long names (truncated by sanitizer)', () => {
      const longName = 'A'.repeat(50);
      // The schema first validates length (max 30), then transforms
      // So a 50 char input will fail the max(30) check before transformation
      const result = displayNameSchema.safeParse(longName);
      // Schema validates length BEFORE transform, so this fails
      expect(result.success).toBe(false);
    });
  });

  describe('ageSchema', () => {
    it('should accept valid ages', () => {
      expect(ageSchema.safeParse(18).success).toBe(true);
      expect(ageSchema.safeParse(25).success).toBe(true);
      expect(ageSchema.safeParse(99).success).toBe(true);
    });

    it('should reject ages under 18', () => {
      expect(ageSchema.safeParse(17).success).toBe(false);
      expect(ageSchema.safeParse(0).success).toBe(false);
      expect(ageSchema.safeParse(-1).success).toBe(false);
    });

    it('should reject ages over 120', () => {
      expect(ageSchema.safeParse(121).success).toBe(false);
      expect(ageSchema.safeParse(200).success).toBe(false);
    });

    it('should reject non-integers', () => {
      expect(ageSchema.safeParse(25.5).success).toBe(false);
    });
  });

  describe('ageStringSchema', () => {
    it('should parse string ages to numbers', () => {
      const result = ageStringSchema.safeParse('25');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(25);
      }
    });

    it('should reject non-numeric strings', () => {
      expect(ageStringSchema.safeParse('twenty').success).toBe(false);
      expect(ageStringSchema.safeParse('25.5').success).toBe(false);
    });
  });

  describe('citySchema', () => {
    it('should accept valid city names', () => {
      expect(citySchema.safeParse('San Francisco').success).toBe(true);
      expect(citySchema.safeParse('NYC').success).toBe(true);
    });

    it('should reject empty strings', () => {
      expect(citySchema.safeParse('').success).toBe(false);
    });
  });

  describe('bioSchema', () => {
    it('should accept valid bios', () => {
      expect(bioSchema.safeParse('This is my bio.').success).toBe(true);
      expect(bioSchema.safeParse('').success).toBe(true);
    });

    it('should reject too long bios', () => {
      const longBio = 'A'.repeat(600);
      expect(bioSchema.safeParse(longBio).success).toBe(false);
    });

    it('should default undefined to empty string', () => {
      const result = bioSchema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('');
      }
    });
  });

  describe('messageContentSchema', () => {
    it('should accept valid messages', () => {
      expect(messageContentSchema.safeParse('Hello!').success).toBe(true);
      expect(messageContentSchema.safeParse('A longer message with\nmultiple lines.').success).toBe(true);
    });

    it('should reject empty messages', () => {
      expect(messageContentSchema.safeParse('').success).toBe(false);
    });

    it('should reject too long messages', () => {
      const longMessage = 'A'.repeat(2500);
      expect(messageContentSchema.safeParse(longMessage).success).toBe(false);
    });

    it('should sanitize HTML', () => {
      const result = messageContentSchema.safeParse('<script>bad</script>Hello');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toContain('<script>');
      }
    });
  });
});

describe('validateOrThrow', () => {
  it('should return validated data on success', () => {
    const result = validateOrThrow(ageSchema, 25);
    expect(result).toBe(25);
  });

  it('should throw on validation failure', () => {
    expect(() => validateOrThrow(ageSchema, 15)).toThrow();
  });

  it('should transform data through schema', () => {
    const result = validateOrThrow(emailSchema, 'TEST@EXAMPLE.COM');
    expect(result).toBe('test@example.com');
  });
});
