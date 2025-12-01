import type { Niche } from './types';

export const niches: Niche[] = [
  {
    id: 'solar',
    slug: 'solar',
    name: 'Solar Panels',
    description: 'Get free quotes from top-rated solar installers in your area. Save up to 70% on electricity bills.',
    icon: 'sun',
    pricePerLead: 75,
    heroImage: '/images/niches/solar-hero.jpg',
    color: '#f59e0b',
  },
  {
    id: 'roofing',
    slug: 'roofing',
    name: 'Roofing',
    description: 'Connect with licensed roofing contractors for repairs, replacements, and inspections.',
    icon: 'home',
    pricePerLead: 65,
    heroImage: '/images/niches/roofing-hero.jpg',
    color: '#6366f1',
  },
  {
    id: 'hvac',
    slug: 'hvac',
    name: 'HVAC',
    description: 'Find trusted HVAC professionals for heating, cooling, and ventilation services.',
    icon: 'thermometer',
    pricePerLead: 55,
    heroImage: '/images/niches/hvac-hero.jpg',
    color: '#0ea5e9',
  },
  {
    id: 'windows',
    slug: 'windows',
    name: 'Windows & Doors',
    description: 'Get quotes for window and door replacement from certified installers.',
    icon: 'square',
    pricePerLead: 50,
    heroImage: '/images/niches/windows-hero.jpg',
    color: '#14b8a6',
  },
  {
    id: 'plumbing',
    slug: 'plumbing',
    name: 'Plumbing',
    description: 'Connect with licensed plumbers for repairs, installations, and emergencies.',
    icon: 'droplet',
    pricePerLead: 45,
    heroImage: '/images/niches/plumbing-hero.jpg',
    color: '#3b82f6',
  },
  {
    id: 'electrical',
    slug: 'electrical',
    name: 'Electrical',
    description: 'Find certified electricians for wiring, panel upgrades, and electrical repairs.',
    icon: 'zap',
    pricePerLead: 50,
    heroImage: '/images/niches/electrical-hero.jpg',
    color: '#eab308',
  },
  {
    id: 'masonry',
    slug: 'masonry',
    name: 'Masonry',
    description: 'Get quotes for brick, stone, and concrete work from skilled masons.',
    icon: 'layers',
    pricePerLead: 40,
    heroImage: '/images/niches/masonry-hero.jpg',
    color: '#78716c',
  },
  {
    id: 'siding',
    slug: 'siding',
    name: 'Siding',
    description: 'Connect with siding contractors for installation and repairs.',
    icon: 'layout',
    pricePerLead: 45,
    heroImage: '/images/niches/siding-hero.jpg',
    color: '#22c55e',
  },
  {
    id: 'insulation',
    slug: 'insulation',
    name: 'Insulation',
    description: 'Find insulation experts to improve your home energy efficiency.',
    icon: 'shield',
    pricePerLead: 40,
    heroImage: '/images/niches/insulation-hero.jpg',
    color: '#a855f7',
  },
  {
    id: 'gutters',
    slug: 'gutters',
    name: 'Gutters',
    description: 'Get quotes for gutter installation, repair, and cleaning services.',
    icon: 'cloud-rain',
    pricePerLead: 35,
    heroImage: '/images/niches/gutters-hero.jpg',
    color: '#64748b',
  },
];

export function getNicheBySlug(slug: string): Niche | undefined {
  return niches.find((n) => n.slug === slug);
}

export function getAllNicheSlugs(): string[] {
  return niches.map((n) => n.slug);
}

// Priority niches for initial focus
export const priorityNiches = ['solar', 'roofing'];
