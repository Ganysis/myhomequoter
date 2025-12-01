// Niche types
export interface Niche {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  pricePerLead: number;
  heroImage: string;
  color: string;
}

// Lead types
export interface Lead {
  id: string;
  nicheId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  state: string;
  zipCode: string;
  projectType: ProjectType;
  timeline: Timeline;
  budgetRange?: string;
  propertyType: PropertyType;
  additionalInfo?: string;
  sourceUrl: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  status: LeadStatus;
  qualityScore: number;
  createdAt: Date;
}

export type ProjectType = 'installation' | 'repair' | 'consultation' | 'replacement';
export type Timeline = 'asap' | '1-3months' | '3-6months' | 'planning';
export type PropertyType = 'residential' | 'commercial';
export type LeadStatus = 'available' | 'claimed' | 'sold' | 'invalid';

// Buyer types
export interface Buyer {
  id: string;
  userId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  stripeCustomerId?: string;
  targetNiches: string[];
  targetStates: string[];
  targetCities?: string[];
  maxLeadsPerDay?: number;
  status: BuyerStatus;
  createdAt: Date;
}

export type BuyerStatus = 'pending' | 'active' | 'paused' | 'suspended';

// US Location types
export interface USCity {
  city: string;
  state: string;
  stateCode: string;
  population: number;
  latitude: number;
  longitude: number;
}

export interface USState {
  name: string;
  code: string;
  cities: USCity[];
}

// Form step types
export interface FormStep {
  id: number;
  title: string;
  description: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
