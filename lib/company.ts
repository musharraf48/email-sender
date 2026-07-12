const MAIL_PREFIXES = new Set([
  'hr',
  'careers',
  'jobs',
  'recruiting',
  'recruitment',
  'talent',
  'hiring',
  'apply',
  'noreply',
  'no-reply',
  'mail',
  'info',
  'contact',
  'support',
  'admin',
  'team',
  'people',
  'workday',
]);

export const extractDomain = (email: string): string => {
  const parts = email.trim().toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : '';
};

const titleCase = (value: string): string => {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const companyNameFromEmail = (email: string): string => {
  const domain = extractDomain(email);
  if (!domain) return 'Unknown';

  const segments = domain.split('.').filter(Boolean);
  if (segments.length === 0) return 'Unknown';

  let companySegment = segments[0];

  if (MAIL_PREFIXES.has(companySegment) && segments.length > 1) {
    companySegment = segments[1];
  }

  const cleaned = companySegment
    .replace(/[-_]+/g, ' ')
    .replace(/\d+/g, ' ')
    .trim();

  return titleCase(cleaned) || 'Unknown';
};
