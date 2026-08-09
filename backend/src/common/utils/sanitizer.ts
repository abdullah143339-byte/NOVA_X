export class Sanitizer {
  private static readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^>]*>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
  ];

  private static readonly SQL_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FETCH|DECLARE|TRUNCATE)\b)/gi,
    /(--|;|\/\*|\*\/|xp_|sp_)/gi,
    /('\s*(OR|AND)\s*'.*'=)/gi,
  ];

  static sanitizeHtml(input: string): string {
    if (!input) return '';
    let cleaned = input;
    for (const pattern of this.XSS_PATTERNS) {
      cleaned = cleaned.replace(pattern, '');
    }
    cleaned = cleaned
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    return cleaned;
  }

  static stripHtml(input: string): string {
    if (!input) return '';
    return input.replace(/<[^>]*>/g, '').trim();
  }

  static detectSqlInjection(input: string): boolean {
    if (!input) return false;
    return this.SQL_PATTERNS.some((pattern) => pattern.test(input));
  }

  static validateInput(input: string, maxLength = 10000): { valid: boolean; error?: string } {
    if (!input) return { valid: true };
    if (input.length > maxLength) return { valid: false, error: `Input exceeds ${maxLength} characters` };
    if (this.detectSqlInjection(input)) return { valid: false, error: 'Invalid characters detected' };
    return { valid: true };
  }

  static sanitizeForSearch(input: string): string {
    if (!input) return '';
    return input
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);
  }
}
