// Input Validation and Sanitization
// Uses Zod for schema validation and custom sanitization functions

import { z } from 'zod';

// ============================================================================
// SANITIZATION HELPERS
// ============================================================================

/**
 * Removes potentially dangerous HTML/script content
 */
export function sanitizeText(input: string): string {
  if (!input) return '';

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script injection attempts
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    // Remove null bytes
    .replace(/\x00/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitizes text while preserving some formatting (newlines)
 */
export function sanitizeMultilineText(input: string): string {
  if (!input) return '';

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script injection attempts
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    // Remove null bytes
    .replace(/\x00/g, '')
    // Normalize multiple newlines to max 2
    .replace(/\n{3,}/g, '\n\n')
    // Trim each line
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
}

/**
 * Validates and sanitizes a display name
 */
export function sanitizeDisplayName(input: string): string {
  return sanitizeText(input)
    // Remove special characters except basic punctuation
    .replace(/[^\w\s&'-]/g, '')
    .slice(0, 30);
}

/**
 * Validates and sanitizes a city name
 */
export function sanitizeCity(input: string): string {
  return sanitizeText(input)
    // Allow letters, spaces, and common city punctuation
    .replace(/[^\w\s,.-]/g, '')
    .slice(0, 50);
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email too long')
  .transform((email) => email.toLowerCase().trim());

/**
 * Phone validation schema (basic international format)
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format')
  .transform((phone) => phone.replace(/\s/g, ''));

/**
 * Display name validation
 */
export const displayNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(30, 'Name must be at most 30 characters')
  .transform(sanitizeDisplayName);

/**
 * Age validation (18+)
 */
export const ageSchema = z
  .number()
  .int('Age must be a whole number')
  .min(18, 'Must be 18 or older')
  .max(120, 'Invalid age');

/**
 * Age from string (for form inputs)
 */
export const ageStringSchema = z
  .string()
  .regex(/^\d{1,3}$/, 'Age must be a number')
  .transform((val) => parseInt(val, 10))
  .pipe(ageSchema);

/**
 * City validation
 */
export const citySchema = z
  .string()
  .min(1, 'City is required')
  .max(50, 'City name too long')
  .transform(sanitizeCity);

/**
 * Bio validation
 */
export const bioSchema = z
  .string()
  .max(500, 'Bio must be at most 500 characters')
  .transform(sanitizeMultilineText)
  .optional()
  .default('');

/**
 * Message content validation
 */
export const messageContentSchema = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(2000, 'Message too long (max 2000 characters)')
  .transform(sanitizeMultilineText);

/**
 * Pind message validation
 */
export const pindMessageSchema = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(500, 'Message too long (max 500 characters)')
  .transform(sanitizeMultilineText);

/**
 * Prompt response validation
 */
export const promptResponseSchema = z
  .string()
  .min(1, 'Response cannot be empty')
  .max(500, 'Response too long (max 500 characters)')
  .transform(sanitizeMultilineText);

/**
 * Report reason validation
 */
export const reportReasonSchema = z
  .string()
  .min(1, 'Reason is required')
  .max(100, 'Reason too long')
  .transform(sanitizeText);

/**
 * Report details validation
 */
export const reportDetailsSchema = z
  .string()
  .max(1000, 'Details too long')
  .transform(sanitizeMultilineText)
  .optional();

/**
 * Group name validation
 */
export const groupNameSchema = z
  .string()
  .min(1, 'Group name is required')
  .max(50, 'Group name too long')
  .transform(sanitizeText);

/**
 * Pace preference validation
 */
export const pacePreferenceSchema = z.enum(['slow', 'medium', 'fast']);

/**
 * Response style validation
 */
export const responseStyleSchema = z.enum(['quick', 'relaxed']);

/**
 * Message type validation
 */
export const messageTypeSchema = z.enum([
  'text',
  'voice',
  'system',
  'image',
  'video',
  'video_call',
]);

/**
 * Match status validation
 */
export const matchStatusSchema = z.enum(['pending', 'active', 'archived']);

// ============================================================================
// COMPOSITE SCHEMAS
// ============================================================================

/**
 * Profile creation/update schema
 */
export const profileSchema = z.object({
  display_name: displayNameSchema,
  age: ageSchema,
  city: citySchema,
  bio: bioSchema,
  pace_preference: pacePreferenceSchema.optional().default('medium'),
  no_photos: z.boolean().optional().default(false),
  open_to_meet: z.boolean().optional().default(true),
  virtual_only: z.boolean().optional().default(false),
  response_style: responseStyleSchema.optional().default('relaxed'),
});

/**
 * Profile update schema (all fields optional)
 */
export const profileUpdateSchema = profileSchema.partial();

/**
 * Message creation schema
 */
export const createMessageSchema = z.object({
  thread_id: uuidSchema,
  content: messageContentSchema,
  message_type: messageTypeSchema.optional().default('text'),
  is_first_message: z.boolean().optional().default(false),
});

/**
 * Pind creation schema
 */
export const createPindSchema = z.object({
  to_user_id: uuidSchema,
  message: pindMessageSchema,
});

/**
 * Report creation schema
 */
export const createReportSchema = z.object({
  reported_user_id: uuidSchema,
  reason: reportReasonSchema,
  details: reportDetailsSchema,
});

/**
 * Block user schema
 */
export const blockUserSchema = z.object({
  blocked_id: uuidSchema,
  reason: z.string().max(500).transform(sanitizeText).optional(),
});

/**
 * Linked partner schema
 */
export const linkedPartnerSchema = z.object({
  name: displayNameSchema,
  age: ageSchema,
});

// ============================================================================
// EVENT SCHEMAS
// ============================================================================

/**
 * Event category validation
 */
export const eventCategorySchema = z.enum([
  'social',
  'dating',
  'education',
  'party',
  'outdoor',
  'wellness',
  'meetup',
  'virtual',
  'private',
  'community',
]);

/**
 * Event visibility validation
 */
export const eventVisibilitySchema = z.enum(['public', 'friends_only', 'invite_only']);

/**
 * RSVP status validation
 */
export const rsvpStatusSchema = z.enum(['going', 'maybe', 'waitlist', 'pending', 'declined']);

/**
 * Event title validation
 */
export const eventTitleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(100, 'Title must be 100 characters or less')
  .transform(sanitizeText);

/**
 * Event description validation
 */
export const eventDescriptionSchema = z
  .string()
  .max(2000, 'Description must be 2000 characters or less')
  .transform(sanitizeMultilineText)
  .optional();

/**
 * Event location validation
 */
export const eventLocationSchema = z
  .string()
  .max(200, 'Location must be 200 characters or less')
  .transform(sanitizeText)
  .optional();

/**
 * Event meeting link validation
 */
export const eventMeetingLinkSchema = z
  .string()
  .url('Must be a valid URL')
  .max(500, 'Link must be 500 characters or less')
  .optional();

/**
 * Event timezone validation
 */
export const eventTimezoneSchema = z.string().default('UTC');

/**
 * Event tags validation
 */
export const eventTagsSchema = z
  .array(z.string().max(50).transform(sanitizeText))
  .max(10, 'Maximum 10 tags allowed')
  .optional()
  .default([]);

/**
 * Event creation schema
 */
export const createEventSchema = z.object({
  title: eventTitleSchema,
  description: eventDescriptionSchema,
  category: eventCategorySchema,
  cover_photo_url: z.string().url().optional(),
  location: eventLocationSchema,
  meeting_link: eventMeetingLinkSchema,
  start_time: z.string().datetime('Invalid start time format'),
  end_time: z.string().datetime('Invalid end time format'),
  timezone: eventTimezoneSchema,
  max_attendees: z.number().int().positive().nullable().optional(),
  visibility: eventVisibilitySchema.optional().default('public'),
  requires_approval: z.boolean().optional().default(false),
  tags: eventTagsSchema,
}).refine((data) => new Date(data.end_time) > new Date(data.start_time), {
  message: 'End time must be after start time',
  path: ['end_time'],
});

/**
 * Event update schema (all fields optional except validation)
 */
export const updateEventSchema = createEventSchema.partial().refine(
  (data) => {
    if (data.start_time && data.end_time) {
      return new Date(data.end_time) > new Date(data.start_time);
    }
    return true;
  },
  {
    message: 'End time must be after start time',
    path: ['end_time'],
  }
);

/**
 * RSVP creation schema
 */
export const createRsvpSchema = z.object({
  event_id: uuidSchema,
  status: rsvpStatusSchema,
});

/**
 * RSVP update schema
 */
export const updateRsvpSchema = z.object({
  status: rsvpStatusSchema.optional(),
  checked_in: z.boolean().optional(),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates data and returns result with errors
 */
export function validateInput<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });

  return { success: false, errors };
}

/**
 * Validates data and throws on error
 */
export function validateOrThrow<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  const result = validateInput(schema, data);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.errors.join(', ')}`);
  }
  return result.data;
}

/**
 * Checks if a string contains potential SQL injection patterns
 */
export function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(--|\#|\/\*|\*\/)/,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
    /'.*(\bOR\b|\bAND\b).*'/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Checks if a string contains potential XSS patterns
 */
export function containsXss(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b/gi,
    /<embed\b/gi,
    /<object\b/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Complete input security check
 */
export function isSecureInput(input: string): {
  secure: boolean;
  reason?: string;
} {
  if (containsSqlInjection(input)) {
    return { secure: false, reason: 'Potential SQL injection detected' };
  }
  if (containsXss(input)) {
    return { secure: false, reason: 'Potential XSS attack detected' };
  }
  return { secure: true };
}
