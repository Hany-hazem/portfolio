import { supabase } from './supabase';

export interface PortfolioCustomization {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  contactEmail: string;
  contactPhone: string;
  githubUsername: string;
  skills: Array<{
    name: string;
    level: number;
    category: string;
  }>;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    technologies: string[];
    period: string;
    status: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    period: string;
  }>;
  experience: Array<{
    title: string;
    company: string;
    period: string;
    description: string;
  }>;
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
}

/**
 * Convert database snake_case to frontend camelCase
 */
function dbToClient(data: any): PortfolioCustomization {
  return {
    heroTitle: data.hero_title || '',
    heroSubtitle: data.hero_subtitle || '',
    aboutText: data.about_text || '',
    contactEmail: data.contact_email || '',
    contactPhone: data.contact_phone || '',
    githubUsername: data.github_username || '',
    skills: data.skills || [],
    projects: data.projects || [],
    education: data.education || [],
    experience: data.experience || [],
    socialLinks: data.social_links || {},
  };
}

/**
 * Get portfolio customization from database
 */
export async function getPortfolioCustomization(): Promise<PortfolioCustomization | null> {
  try {
    const { data, error } = await supabase
      .from('portfolio_customization')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching portfolio customization:', error);
      return null;
    }

    return data ? dbToClient(data) : null;
  } catch (err) {
    console.error('Exception fetching portfolio customization:', err);
    return null;
  }
}

/**
 * Save portfolio customization (admin only)
 */
export async function savePortfolioCustomization(
  customization: PortfolioCustomization,
  adminToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/portfolio/customization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify(customization),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to save' };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
