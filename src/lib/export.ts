import type { Business } from '@/types';

export interface PlusvibeExportRow {
  FirstName: string;
  LastName: string;
  Email: string;
  CompanyName: string;
  City: string;
  Phone: string;
  MediaReviews: number;
  NegativeReviews: number;
  PricingTier: string;
  ProjectValue: string;
  PersonalizedMessage: string;
}

/**
 * Escapes a CSV value according to RFC 4180
 * - Wrap in quotes if contains: comma, quote, newline, or carriage return
 * - Double all quotes inside quoted values
 */
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Formats currency with US locale ($X,XXX.XX format)
 */
function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Parses a full name into first and last name components
 * - First word becomes firstName
 * - Remaining words become lastName
 * - Falls back to business_name if no contact_name
 */
function parseName(contactName: string | null, businessName: string): { firstName: string; lastName: string } {
  const nameToUse = contactName || businessName;
  const nameParts = nameToUse.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  return { firstName, lastName };
}

/**
 * Converts Business[] to Plusvibe.ai CSV format
 * Columns: FirstName, LastName, Email, CompanyName, City, Phone,
 *          MediaReviews, NegativeReviews, PricingTier, ProjectValue, PersonalizedMessage
 */
export function exportToPlusvibe(businesses: Business[], campaignName: string): string {
  const headers = [
    'FirstName',
    'LastName',
    'Email',
    'CompanyName',
    'City',
    'Phone',
    'MediaReviews',
    'NegativeReviews',
    'PricingTier',
    'ProjectValue',
    'PersonalizedMessage'
  ];

  const rows = businesses.map(business => {
    const { firstName, lastName } = parseName(business.contact_name, business.business_name);
    const projectValue = formatCurrency(business.total_project_value);

    const row: PlusvibeExportRow = {
      FirstName: firstName,
      LastName: lastName,
      Email: business.email || '',
      CompanyName: business.business_name,
      City: business.city || '',
      Phone: business.phone || '',
      MediaReviews: business.total_media_reviews,
      NegativeReviews: business.one_star_reviews + business.two_star_reviews,
      PricingTier: business.pricing_tier || 'standard',
      ProjectValue: projectValue,
      PersonalizedMessage: business.personalized_message || ''
    };

    return row;
  });

  // Build CSV content
  const csvRows = [headers.join(',')];

  rows.forEach(row => {
    const values = headers.map(header => {
      const value = String(row[header as keyof PlusvibeExportRow] ?? '');
      return escapeCSVValue(value);
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Triggers browser download with UTF-8 BOM for Excel compatibility
 */
export function downloadCSV(content: string, filename: string): void {
  // UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up object URL after a brief delay
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Generates standardized filename: plusvibe-export-{campaign}-{YYYY-MM-DD}-{HHmm}.csv
 */
export function generateExportFilename(campaignName: string): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const time = now.toTimeString().slice(0, 5).replace(':', ''); // HHmm

  // Sanitize campaign name: lowercase, replace non-alphanumeric with hyphens, trim hyphens
  const sanitized = campaignName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `plusvibe-export-${sanitized || 'export'}-${date}-${time}.csv`;
}
