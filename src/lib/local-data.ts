/**
 * Local data for SEO-unique content
 * This data makes each city page unique and valuable
 */

// Solar incentives by state
export const solarIncentives: Record<string, {
  stateTaxCredit: string;
  netMetering: boolean;
  rebates: string;
  avgSavings: string;
}> = {
  CA: {
    stateTaxCredit: 'None (federal only)',
    netMetering: true,
    rebates: 'SGIP Battery Incentive up to $1,000/kWh',
    avgSavings: '$1,500/year',
  },
  TX: {
    stateTaxCredit: 'None (federal only)',
    netMetering: false,
    rebates: 'Austin Energy: $2,500 rebate; CPS Energy: $1,500',
    avgSavings: '$1,200/year',
  },
  FL: {
    stateTaxCredit: 'Property tax exemption for solar',
    netMetering: true,
    rebates: 'Limited utility rebates',
    avgSavings: '$1,400/year',
  },
  NY: {
    stateTaxCredit: '25% state tax credit (up to $5,000)',
    netMetering: true,
    rebates: 'NY-Sun Incentive: $0.20-$0.40/watt',
    avgSavings: '$1,100/year',
  },
  AZ: {
    stateTaxCredit: '25% state tax credit (up to $1,000)',
    netMetering: true,
    rebates: 'APS: $0.10/kWh for 10 years',
    avgSavings: '$1,600/year',
  },
  NJ: {
    stateTaxCredit: 'Sales tax exemption',
    netMetering: true,
    rebates: 'SREC-II: ~$90/MWh',
    avgSavings: '$1,300/year',
  },
  MA: {
    stateTaxCredit: '15% state tax credit (up to $1,000)',
    netMetering: true,
    rebates: 'SMART Program incentives',
    avgSavings: '$1,200/year',
  },
  CO: {
    stateTaxCredit: 'None',
    netMetering: true,
    rebates: 'Xcel Energy rebates available',
    avgSavings: '$1,100/year',
  },
  NC: {
    stateTaxCredit: 'None (expired)',
    netMetering: true,
    rebates: 'Duke Energy rebates',
    avgSavings: '$1,000/year',
  },
  GA: {
    stateTaxCredit: 'None',
    netMetering: false,
    rebates: 'Limited',
    avgSavings: '$900/year',
  },
  PA: {
    stateTaxCredit: 'None',
    netMetering: true,
    rebates: 'SREC market',
    avgSavings: '$1,000/year',
  },
  IL: {
    stateTaxCredit: 'None',
    netMetering: true,
    rebates: 'Illinois Shines: $80-$90/REC',
    avgSavings: '$1,100/year',
  },
  OH: {
    stateTaxCredit: 'None',
    netMetering: true,
    rebates: 'Limited utility rebates',
    avgSavings: '$900/year',
  },
  WA: {
    stateTaxCredit: 'Sales tax exemption',
    netMetering: true,
    rebates: 'Limited',
    avgSavings: '$800/year',
  },
  VA: {
    stateTaxCredit: 'None',
    netMetering: true,
    rebates: 'Dominion Energy pilots',
    avgSavings: '$1,000/year',
  },
};

// Average costs by niche and state
export const avgCostsByState: Record<string, Record<string, string>> = {
  solar: {
    CA: '$12,000 - $25,000',
    TX: '$10,000 - $22,000',
    FL: '$11,000 - $23,000',
    NY: '$14,000 - $28,000',
    AZ: '$9,000 - $20,000',
    DEFAULT: '$10,000 - $25,000',
  },
  roofing: {
    CA: '$8,000 - $20,000',
    TX: '$6,000 - $15,000',
    FL: '$7,000 - $18,000',
    NY: '$9,000 - $22,000',
    DEFAULT: '$7,000 - $18,000',
  },
  hvac: {
    CA: '$4,000 - $12,000',
    TX: '$3,500 - $10,000',
    FL: '$4,000 - $11,000',
    NY: '$5,000 - $14,000',
    DEFAULT: '$4,000 - $12,000',
  },
  windows: {
    DEFAULT: '$400 - $1,500 per window',
  },
  plumbing: {
    DEFAULT: '$150 - $500 per repair',
  },
  electrical: {
    DEFAULT: '$150 - $500 per project',
  },
};

// Climate considerations by state
export const climateData: Record<string, {
  type: string;
  considerations: string[];
}> = {
  CA: {
    type: 'Mediterranean/Desert',
    considerations: [
      'High solar potential (300+ sunny days)',
      'Wildfire-resistant materials recommended',
      'Drought-tolerant landscaping considerations',
    ],
  },
  TX: {
    type: 'Humid subtropical/Semi-arid',
    considerations: [
      'Extreme heat requires efficient HVAC',
      'Hail damage common - impact-resistant roofing',
      'High solar potential in most regions',
    ],
  },
  FL: {
    type: 'Tropical/Humid subtropical',
    considerations: [
      'Hurricane-rated materials essential',
      'High humidity affects HVAC needs',
      'Good solar potential despite afternoon storms',
    ],
  },
  NY: {
    type: 'Humid continental',
    considerations: [
      'Heavy snow loads affect roofing',
      'Cold winters require efficient heating',
      'Moderate solar potential',
    ],
  },
  AZ: {
    type: 'Desert',
    considerations: [
      'Excellent solar potential (299 sunny days)',
      'Extreme heat requires robust HVAC',
      'UV-resistant materials recommended',
    ],
  },
  CO: {
    type: 'Semi-arid/Alpine',
    considerations: [
      'High altitude increases UV exposure',
      'Snow loads vary by elevation',
      'Good solar potential',
    ],
  },
  DEFAULT: {
    type: 'Varied',
    considerations: [
      'Local weather patterns affect material choices',
      'Consult local contractors for specific recommendations',
    ],
  },
};

// City-specific data (population, metro area)
export const cityData: Record<string, {
  population: string;
  metro: string;
  nickname?: string;
}> = {
  'houston-tx': { population: '2.3M', metro: '7.1M', nickname: 'Space City' },
  'san-antonio-tx': { population: '1.5M', metro: '2.5M', nickname: 'Alamo City' },
  'dallas-tx': { population: '1.3M', metro: '7.6M', nickname: 'Big D' },
  'austin-tx': { population: '1.0M', metro: '2.2M', nickname: 'Live Music Capital' },
  'los-angeles-ca': { population: '3.9M', metro: '13.2M', nickname: 'City of Angels' },
  'san-diego-ca': { population: '1.4M', metro: '3.3M', nickname: "America's Finest City" },
  'san-jose-ca': { population: '1.0M', metro: '2.0M', nickname: 'Capital of Silicon Valley' },
  'san-francisco-ca': { population: '874K', metro: '4.7M', nickname: 'The City by the Bay' },
  'phoenix-az': { population: '1.6M', metro: '4.9M', nickname: 'Valley of the Sun' },
  'miami-fl': { population: '449K', metro: '6.1M', nickname: 'Magic City' },
  'tampa-fl': { population: '393K', metro: '3.2M', nickname: 'Cigar City' },
  'orlando-fl': { population: '309K', metro: '2.6M', nickname: 'The City Beautiful' },
  'new-york-ny': { population: '8.3M', metro: '19.2M', nickname: 'The Big Apple' },
  'chicago-il': { population: '2.7M', metro: '9.5M', nickname: 'Windy City' },
  'denver-co': { population: '727K', metro: '2.9M', nickname: 'Mile High City' },
  'seattle-wa': { population: '749K', metro: '4.0M', nickname: 'Emerald City' },
  'atlanta-ga': { population: '499K', metro: '6.1M', nickname: 'The ATL' },
};

// Helper functions
export function getSolarIncentives(state: string) {
  return solarIncentives[state] || null;
}

export function getAvgCost(niche: string, state: string): string {
  const nicheCosts = avgCostsByState[niche];
  if (!nicheCosts) return '$3,500 - $15,000';
  return nicheCosts[state] || nicheCosts['DEFAULT'] || '$3,500 - $15,000';
}

export function getClimateData(state: string) {
  return climateData[state] || climateData['DEFAULT'];
}

export function getCityData(city: string, state: string) {
  const key = `${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}`;
  return cityData[key] || null;
}
