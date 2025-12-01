// Niche-specific form questions for lead qualification
// Each niche has unique qualifying questions to generate high-quality leads

export interface FormQuestion {
  id: string;
  type: 'select' | 'radio' | 'checkbox' | 'number' | 'text';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[];
  helperText?: string;
  min?: number;
  max?: number;
}

export interface NicheFormConfig {
  nicheSlug: string;
  title: string;
  subtitle: string;
  steps: {
    title: string;
    description: string;
    questions: FormQuestion[];
  }[];
}

// ===================
// SOLAR FORM
// ===================
export const solarForm: NicheFormConfig = {
  nicheSlug: 'solar',
  title: 'Get Solar Panel Quotes',
  subtitle: 'Save up to 70% on your electricity bill',
  steps: [
    {
      title: 'Property Details',
      description: 'Tell us about your home',
      questions: [
        {
          id: 'propertyType',
          type: 'radio',
          label: 'Property type',
          required: true,
          options: [
            { value: 'single-family', label: 'Single Family Home' },
            { value: 'townhouse', label: 'Townhouse' },
            { value: 'multi-family', label: 'Multi-Family (2-4 units)' },
            { value: 'mobile-home', label: 'Mobile/Manufactured Home' },
            { value: 'commercial', label: 'Commercial Building' },
          ],
        },
        {
          id: 'homeOwnership',
          type: 'radio',
          label: 'Do you own this property?',
          required: true,
          options: [
            { value: 'own', label: 'Yes, I own it' },
            { value: 'rent', label: 'No, I rent' },
            { value: 'buying', label: 'Currently buying' },
          ],
        },
        {
          id: 'roofAge',
          type: 'select',
          label: 'How old is your roof?',
          required: true,
          options: [
            { value: '0-5', label: '0-5 years' },
            { value: '6-10', label: '6-10 years' },
            { value: '11-15', label: '11-15 years' },
            { value: '16-20', label: '16-20 years' },
            { value: '20+', label: 'More than 20 years' },
            { value: 'unknown', label: "I don't know" },
          ],
          helperText: 'Solar installation may require roof repair if over 15 years old',
        },
        {
          id: 'roofShading',
          type: 'radio',
          label: 'How much shade does your roof get?',
          required: true,
          options: [
            { value: 'none', label: 'No shade (full sun)' },
            { value: 'partial', label: 'Partial shade (some trees)' },
            { value: 'heavy', label: 'Heavy shade (many trees/buildings)' },
          ],
        },
      ],
    },
    {
      title: 'Energy Usage',
      description: 'Help us estimate your savings',
      questions: [
        {
          id: 'electricBill',
          type: 'select',
          label: 'Average monthly electric bill',
          required: true,
          options: [
            { value: 'under-100', label: 'Under $100' },
            { value: '100-150', label: '$100 - $150' },
            { value: '150-200', label: '$150 - $200' },
            { value: '200-300', label: '$200 - $300' },
            { value: '300-400', label: '$300 - $400' },
            { value: '400+', label: '$400+' },
          ],
        },
        {
          id: 'electricCompany',
          type: 'text',
          label: 'Electric utility company',
          placeholder: 'e.g., PG&E, Duke Energy',
          required: false,
          helperText: 'Helps us check available rebates',
        },
        {
          id: 'solarInterest',
          type: 'checkbox',
          label: 'What interests you about solar?',
          required: false,
          options: [
            { value: 'save-money', label: 'Lower electricity bills' },
            { value: 'environment', label: 'Environmental benefits' },
            { value: 'independence', label: 'Energy independence' },
            { value: 'home-value', label: 'Increase home value' },
            { value: 'tax-credits', label: 'Tax credits & incentives' },
          ],
        },
      ],
    },
    {
      title: 'Project Details',
      description: 'Timeline and preferences',
      questions: [
        {
          id: 'projectType',
          type: 'radio',
          label: 'What type of project?',
          required: true,
          options: [
            { value: 'new-install', label: 'New solar installation' },
            { value: 'add-panels', label: 'Add to existing system' },
            { value: 'battery', label: 'Battery storage only' },
            { value: 'full-system', label: 'Solar + Battery storage' },
          ],
        },
        {
          id: 'financing',
          type: 'radio',
          label: 'How do you plan to pay?',
          required: true,
          options: [
            { value: 'cash', label: 'Cash purchase' },
            { value: 'loan', label: 'Solar loan/financing' },
            { value: 'lease', label: 'Lease/PPA' },
            { value: 'undecided', label: 'Not sure yet' },
          ],
        },
        {
          id: 'timeline',
          type: 'radio',
          label: 'When do you want to install?',
          required: true,
          options: [
            { value: 'asap', label: 'As soon as possible' },
            { value: '1-3months', label: 'Within 1-3 months' },
            { value: '3-6months', label: 'Within 3-6 months' },
            { value: 'researching', label: 'Just researching' },
          ],
        },
      ],
    },
  ],
};

// ===================
// ROOFING FORM
// ===================
export const roofingForm: NicheFormConfig = {
  nicheSlug: 'roofing',
  title: 'Get Roofing Quotes',
  subtitle: 'Connect with licensed roofing contractors',
  steps: [
    {
      title: 'Project Type',
      description: 'What roofing work do you need?',
      questions: [
        {
          id: 'projectType',
          type: 'radio',
          label: 'What type of roofing project?',
          required: true,
          options: [
            { value: 'full-replacement', label: 'Full roof replacement' },
            { value: 'repair', label: 'Roof repair' },
            { value: 'inspection', label: 'Inspection only' },
            { value: 'new-construction', label: 'New construction' },
            { value: 'storm-damage', label: 'Storm/hail damage' },
            { value: 'leak', label: 'Leak repair' },
          ],
        },
        {
          id: 'urgency',
          type: 'radio',
          label: 'How urgent is this project?',
          required: true,
          options: [
            { value: 'emergency', label: 'Emergency - Active leak/damage' },
            { value: 'soon', label: 'Soon - Within 2 weeks' },
            { value: 'planning', label: 'Planning - Within 1-3 months' },
            { value: 'researching', label: 'Just getting quotes' },
          ],
        },
      ],
    },
    {
      title: 'Roof Details',
      description: 'Tell us about your current roof',
      questions: [
        {
          id: 'currentMaterial',
          type: 'select',
          label: 'Current roofing material',
          required: true,
          options: [
            { value: 'asphalt-shingle', label: 'Asphalt Shingles' },
            { value: 'metal', label: 'Metal' },
            { value: 'tile', label: 'Tile (Clay/Concrete)' },
            { value: 'slate', label: 'Slate' },
            { value: 'wood-shake', label: 'Wood Shake/Shingle' },
            { value: 'flat', label: 'Flat/Low-slope' },
            { value: 'other', label: 'Other' },
            { value: 'unknown', label: "Don't know" },
          ],
        },
        {
          id: 'desiredMaterial',
          type: 'select',
          label: 'Desired new material (if replacing)',
          required: false,
          options: [
            { value: 'same', label: 'Same as current' },
            { value: 'asphalt-shingle', label: 'Asphalt Shingles' },
            { value: 'architectural-shingle', label: 'Architectural Shingles' },
            { value: 'metal', label: 'Metal' },
            { value: 'tile', label: 'Tile' },
            { value: 'undecided', label: 'Need recommendation' },
          ],
        },
        {
          id: 'roofAge',
          type: 'select',
          label: 'Age of current roof',
          required: true,
          options: [
            { value: '0-10', label: '0-10 years' },
            { value: '10-15', label: '10-15 years' },
            { value: '15-20', label: '15-20 years' },
            { value: '20-25', label: '20-25 years' },
            { value: '25+', label: '25+ years' },
            { value: 'unknown', label: "Don't know" },
          ],
        },
        {
          id: 'stories',
          type: 'radio',
          label: 'Number of stories',
          required: true,
          options: [
            { value: '1', label: '1 story' },
            { value: '2', label: '2 stories' },
            { value: '3+', label: '3+ stories' },
          ],
        },
        {
          id: 'sqft',
          type: 'select',
          label: 'Approximate roof size',
          required: false,
          options: [
            { value: 'under-1000', label: 'Under 1,000 sq ft' },
            { value: '1000-1500', label: '1,000 - 1,500 sq ft' },
            { value: '1500-2000', label: '1,500 - 2,000 sq ft' },
            { value: '2000-2500', label: '2,000 - 2,500 sq ft' },
            { value: '2500-3000', label: '2,500 - 3,000 sq ft' },
            { value: '3000+', label: '3,000+ sq ft' },
            { value: 'unknown', label: "Don't know" },
          ],
        },
      ],
    },
    {
      title: 'Additional Details',
      description: 'Insurance and property info',
      questions: [
        {
          id: 'insuranceClaim',
          type: 'radio',
          label: 'Will this be an insurance claim?',
          required: true,
          options: [
            { value: 'yes', label: 'Yes, filing a claim' },
            { value: 'maybe', label: 'Maybe, need inspection first' },
            { value: 'no', label: 'No, paying out of pocket' },
          ],
        },
        {
          id: 'propertyType',
          type: 'radio',
          label: 'Property type',
          required: true,
          options: [
            { value: 'single-family', label: 'Single Family Home' },
            { value: 'townhouse', label: 'Townhouse/Condo' },
            { value: 'multi-family', label: 'Multi-Family' },
            { value: 'commercial', label: 'Commercial' },
          ],
        },
        {
          id: 'additionalWork',
          type: 'checkbox',
          label: 'Any additional work needed?',
          required: false,
          options: [
            { value: 'gutters', label: 'Gutters' },
            { value: 'skylights', label: 'Skylights' },
            { value: 'chimney', label: 'Chimney repair' },
            { value: 'ventilation', label: 'Ventilation' },
            { value: 'insulation', label: 'Insulation' },
          ],
        },
      ],
    },
  ],
};

// ===================
// HVAC FORM
// ===================
export const hvacForm: NicheFormConfig = {
  nicheSlug: 'hvac',
  title: 'Get HVAC Quotes',
  subtitle: 'Heating, cooling & ventilation experts',
  steps: [
    {
      title: 'Service Type',
      description: 'What HVAC service do you need?',
      questions: [
        {
          id: 'serviceType',
          type: 'radio',
          label: 'What do you need?',
          required: true,
          options: [
            { value: 'ac-install', label: 'New AC installation' },
            { value: 'ac-repair', label: 'AC repair' },
            { value: 'heating-install', label: 'New heating system' },
            { value: 'heating-repair', label: 'Heating repair' },
            { value: 'full-system', label: 'Full HVAC system' },
            { value: 'maintenance', label: 'Maintenance/tune-up' },
            { value: 'ductwork', label: 'Ductwork' },
          ],
        },
        {
          id: 'urgency',
          type: 'radio',
          label: 'How urgent?',
          required: true,
          options: [
            { value: 'emergency', label: 'Emergency - No heat/AC now' },
            { value: 'soon', label: 'Soon - Within a week' },
            { value: 'planning', label: 'Planning ahead' },
            { value: 'researching', label: 'Just getting quotes' },
          ],
        },
      ],
    },
    {
      title: 'Current System',
      description: 'Tell us about your existing setup',
      questions: [
        {
          id: 'currentSystem',
          type: 'select',
          label: 'Current heating type',
          required: true,
          options: [
            { value: 'central-gas', label: 'Central gas furnace' },
            { value: 'central-electric', label: 'Central electric' },
            { value: 'heat-pump', label: 'Heat pump' },
            { value: 'boiler', label: 'Boiler (radiators)' },
            { value: 'space-heaters', label: 'Space heaters only' },
            { value: 'none', label: 'No heating system' },
            { value: 'unknown', label: "Don't know" },
          ],
        },
        {
          id: 'currentCooling',
          type: 'select',
          label: 'Current cooling type',
          required: true,
          options: [
            { value: 'central-ac', label: 'Central AC' },
            { value: 'heat-pump', label: 'Heat pump' },
            { value: 'window-units', label: 'Window units' },
            { value: 'mini-split', label: 'Mini-split/ductless' },
            { value: 'evaporative', label: 'Evaporative cooler' },
            { value: 'none', label: 'No cooling system' },
          ],
        },
        {
          id: 'systemAge',
          type: 'select',
          label: 'System age',
          required: true,
          options: [
            { value: '0-5', label: '0-5 years' },
            { value: '6-10', label: '6-10 years' },
            { value: '11-15', label: '11-15 years' },
            { value: '16-20', label: '16-20 years' },
            { value: '20+', label: '20+ years' },
            { value: 'unknown', label: "Don't know" },
          ],
        },
        {
          id: 'homeSqft',
          type: 'select',
          label: 'Home square footage',
          required: true,
          options: [
            { value: 'under-1000', label: 'Under 1,000 sq ft' },
            { value: '1000-1500', label: '1,000 - 1,500 sq ft' },
            { value: '1500-2000', label: '1,500 - 2,000 sq ft' },
            { value: '2000-2500', label: '2,000 - 2,500 sq ft' },
            { value: '2500-3000', label: '2,500 - 3,000 sq ft' },
            { value: '3000+', label: '3,000+ sq ft' },
          ],
        },
      ],
    },
    {
      title: 'Preferences',
      description: 'Budget and preferences',
      questions: [
        {
          id: 'preferredBrand',
          type: 'select',
          label: 'Brand preference',
          required: false,
          options: [
            { value: 'no-preference', label: 'No preference' },
            { value: 'carrier', label: 'Carrier' },
            { value: 'trane', label: 'Trane' },
            { value: 'lennox', label: 'Lennox' },
            { value: 'rheem', label: 'Rheem' },
            { value: 'goodman', label: 'Goodman' },
            { value: 'other', label: 'Other' },
          ],
        },
        {
          id: 'efficiency',
          type: 'radio',
          label: 'Efficiency priority',
          required: true,
          options: [
            { value: 'standard', label: 'Standard efficiency (lower cost)' },
            { value: 'high', label: 'High efficiency (save on bills)' },
            { value: 'best', label: 'Best available (max savings)' },
            { value: 'unsure', label: 'Need recommendation' },
          ],
        },
        {
          id: 'financing',
          type: 'radio',
          label: 'Financing interest',
          required: true,
          options: [
            { value: 'cash', label: 'Paying cash' },
            { value: 'financing', label: 'Interested in financing' },
            { value: 'undecided', label: 'Depends on price' },
          ],
        },
      ],
    },
  ],
};

// ===================
// WINDOWS FORM
// ===================
export const windowsForm: NicheFormConfig = {
  nicheSlug: 'windows',
  title: 'Get Window & Door Quotes',
  subtitle: 'Replacement windows and doors',
  steps: [
    {
      title: 'Project Scope',
      description: 'What needs replacing?',
      questions: [
        {
          id: 'projectType',
          type: 'checkbox',
          label: 'What do you need?',
          required: true,
          options: [
            { value: 'windows', label: 'Windows' },
            { value: 'entry-door', label: 'Entry door(s)' },
            { value: 'patio-door', label: 'Patio/sliding door' },
            { value: 'storm-door', label: 'Storm door' },
            { value: 'garage-door', label: 'Garage door' },
          ],
        },
        {
          id: 'windowCount',
          type: 'select',
          label: 'How many windows?',
          required: false,
          options: [
            { value: '1-3', label: '1-3 windows' },
            { value: '4-6', label: '4-6 windows' },
            { value: '7-10', label: '7-10 windows' },
            { value: '11-15', label: '11-15 windows' },
            { value: '16+', label: '16+ windows (whole house)' },
          ],
        },
        {
          id: 'reason',
          type: 'checkbox',
          label: 'Why replacing?',
          required: true,
          options: [
            { value: 'energy', label: 'Energy efficiency' },
            { value: 'damaged', label: 'Damaged/broken' },
            { value: 'drafty', label: 'Drafty/leaking' },
            { value: 'appearance', label: 'Update appearance' },
            { value: 'noise', label: 'Noise reduction' },
            { value: 'selling', label: 'Preparing to sell' },
          ],
        },
      ],
    },
    {
      title: 'Specifications',
      description: 'Window preferences',
      questions: [
        {
          id: 'frameType',
          type: 'select',
          label: 'Preferred frame material',
          required: false,
          options: [
            { value: 'vinyl', label: 'Vinyl' },
            { value: 'wood', label: 'Wood' },
            { value: 'fiberglass', label: 'Fiberglass' },
            { value: 'aluminum', label: 'Aluminum' },
            { value: 'composite', label: 'Composite' },
            { value: 'undecided', label: 'Need recommendation' },
          ],
        },
        {
          id: 'glassType',
          type: 'select',
          label: 'Glass type',
          required: false,
          options: [
            { value: 'double', label: 'Double-pane' },
            { value: 'triple', label: 'Triple-pane' },
            { value: 'low-e', label: 'Low-E coating' },
            { value: 'unsure', label: 'Not sure' },
          ],
        },
        {
          id: 'brand',
          type: 'select',
          label: 'Brand preference',
          required: false,
          options: [
            { value: 'no-preference', label: 'No preference' },
            { value: 'andersen', label: 'Andersen' },
            { value: 'pella', label: 'Pella' },
            { value: 'marvin', label: 'Marvin' },
            { value: 'milgard', label: 'Milgard' },
            { value: 'other', label: 'Other' },
          ],
        },
      ],
    },
    {
      title: 'Timeline & Budget',
      description: 'When and how',
      questions: [
        {
          id: 'timeline',
          type: 'radio',
          label: 'When do you want to start?',
          required: true,
          options: [
            { value: 'asap', label: 'As soon as possible' },
            { value: '1-3months', label: 'Within 1-3 months' },
            { value: '3-6months', label: 'Within 3-6 months' },
            { value: 'researching', label: 'Just getting prices' },
          ],
        },
        {
          id: 'propertyType',
          type: 'radio',
          label: 'Property type',
          required: true,
          options: [
            { value: 'single-family', label: 'Single family home' },
            { value: 'condo', label: 'Condo/Townhouse' },
            { value: 'multi-family', label: 'Multi-family' },
            { value: 'commercial', label: 'Commercial' },
          ],
        },
      ],
    },
  ],
};

// ===================
// PLUMBING FORM
// ===================
export const plumbingForm: NicheFormConfig = {
  nicheSlug: 'plumbing',
  title: 'Get Plumbing Quotes',
  subtitle: 'Licensed plumbing professionals',
  steps: [
    {
      title: 'Service Needed',
      description: 'What plumbing issue do you have?',
      questions: [
        {
          id: 'serviceType',
          type: 'radio',
          label: 'Type of service',
          required: true,
          options: [
            { value: 'repair', label: 'Repair (leak, clog, etc.)' },
            { value: 'installation', label: 'New installation' },
            { value: 'replacement', label: 'Replacement/upgrade' },
            { value: 'emergency', label: 'Emergency service' },
            { value: 'inspection', label: 'Inspection' },
            { value: 'maintenance', label: 'Maintenance' },
          ],
        },
        {
          id: 'issueType',
          type: 'checkbox',
          label: 'What needs work?',
          required: true,
          options: [
            { value: 'drain-clog', label: 'Drain/clog' },
            { value: 'leak', label: 'Leak' },
            { value: 'water-heater', label: 'Water heater' },
            { value: 'toilet', label: 'Toilet' },
            { value: 'faucet-sink', label: 'Faucet/sink' },
            { value: 'garbage-disposal', label: 'Garbage disposal' },
            { value: 'sewer-line', label: 'Sewer/main line' },
            { value: 'water-line', label: 'Water line' },
            { value: 'shower-tub', label: 'Shower/tub' },
            { value: 'other', label: 'Other' },
          ],
        },
      ],
    },
    {
      title: 'Urgency',
      description: 'How soon do you need help?',
      questions: [
        {
          id: 'urgency',
          type: 'radio',
          label: 'How urgent is this?',
          required: true,
          options: [
            { value: 'emergency', label: 'Emergency - Need help NOW' },
            { value: 'today', label: 'Today if possible' },
            { value: 'this-week', label: 'This week' },
            { value: 'flexible', label: 'Flexible timing' },
          ],
        },
        {
          id: 'waterOff',
          type: 'radio',
          label: 'Is your water turned off?',
          required: true,
          options: [
            { value: 'yes', label: 'Yes, no water' },
            { value: 'partial', label: 'Partially (some fixtures)' },
            { value: 'no', label: 'No, water is on' },
          ],
        },
        {
          id: 'activeLeak',
          type: 'radio',
          label: 'Is there an active leak?',
          required: true,
          options: [
            { value: 'yes-major', label: 'Yes, major leak' },
            { value: 'yes-minor', label: 'Yes, minor leak' },
            { value: 'no', label: 'No active leak' },
          ],
        },
      ],
    },
    {
      title: 'Property Info',
      description: 'About your property',
      questions: [
        {
          id: 'propertyType',
          type: 'radio',
          label: 'Property type',
          required: true,
          options: [
            { value: 'single-family', label: 'Single family home' },
            { value: 'condo', label: 'Condo/Apartment' },
            { value: 'townhouse', label: 'Townhouse' },
            { value: 'commercial', label: 'Commercial' },
          ],
        },
        {
          id: 'homeAge',
          type: 'select',
          label: 'Home age',
          required: false,
          options: [
            { value: 'new', label: 'New construction' },
            { value: '1-10', label: '1-10 years' },
            { value: '11-25', label: '11-25 years' },
            { value: '26-50', label: '26-50 years' },
            { value: '50+', label: '50+ years' },
          ],
        },
      ],
    },
  ],
};

// ===================
// ELECTRICAL FORM
// ===================
export const electricalForm: NicheFormConfig = {
  nicheSlug: 'electrical',
  title: 'Get Electrical Quotes',
  subtitle: 'Licensed electricians near you',
  steps: [
    {
      title: 'Service Type',
      description: 'What electrical work do you need?',
      questions: [
        {
          id: 'serviceType',
          type: 'checkbox',
          label: 'Select all that apply',
          required: true,
          options: [
            { value: 'panel-upgrade', label: 'Panel upgrade/replacement' },
            { value: 'wiring', label: 'Wiring (new or rewire)' },
            { value: 'outlets', label: 'Outlets/switches' },
            { value: 'lighting', label: 'Lighting installation' },
            { value: 'ceiling-fan', label: 'Ceiling fan' },
            { value: 'ev-charger', label: 'EV charger installation' },
            { value: 'generator', label: 'Generator' },
            { value: 'repair', label: 'Repair/troubleshooting' },
            { value: 'inspection', label: 'Safety inspection' },
          ],
        },
        {
          id: 'urgency',
          type: 'radio',
          label: 'How urgent?',
          required: true,
          options: [
            { value: 'emergency', label: 'Emergency (no power, sparking)' },
            { value: 'soon', label: 'Soon (within a week)' },
            { value: 'planning', label: 'Planning a project' },
            { value: 'quotes', label: 'Just getting quotes' },
          ],
        },
      ],
    },
    {
      title: 'Project Details',
      description: 'More about your needs',
      questions: [
        {
          id: 'panelAmps',
          type: 'select',
          label: 'Current panel size (if known)',
          required: false,
          options: [
            { value: '60', label: '60 amps' },
            { value: '100', label: '100 amps' },
            { value: '150', label: '150 amps' },
            { value: '200', label: '200 amps' },
            { value: '400', label: '400 amps' },
            { value: 'unknown', label: "Don't know" },
          ],
        },
        {
          id: 'permitRequired',
          type: 'radio',
          label: 'Does this need a permit?',
          required: false,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'unknown', label: "Not sure (contractor will advise)" },
          ],
        },
        {
          id: 'homeAge',
          type: 'select',
          label: 'Home age',
          required: true,
          options: [
            { value: 'new', label: 'New construction' },
            { value: '1-20', label: '1-20 years' },
            { value: '21-40', label: '21-40 years' },
            { value: '41-60', label: '41-60 years' },
            { value: '60+', label: '60+ years' },
          ],
          helperText: 'Older homes may need wiring updates',
        },
      ],
    },
    {
      title: 'Property',
      description: 'Property information',
      questions: [
        {
          id: 'propertyType',
          type: 'radio',
          label: 'Property type',
          required: true,
          options: [
            { value: 'single-family', label: 'Single family home' },
            { value: 'condo', label: 'Condo/Townhouse' },
            { value: 'multi-family', label: 'Multi-family' },
            { value: 'commercial', label: 'Commercial' },
          ],
        },
        {
          id: 'timeline',
          type: 'radio',
          label: 'Project timeline',
          required: true,
          options: [
            { value: 'asap', label: 'As soon as possible' },
            { value: '1-2weeks', label: '1-2 weeks' },
            { value: '1month', label: 'Within a month' },
            { value: 'flexible', label: 'Flexible' },
          ],
        },
      ],
    },
  ],
};

// Export all forms in a map
export const nicheForms: Record<string, NicheFormConfig> = {
  solar: solarForm,
  roofing: roofingForm,
  hvac: hvacForm,
  windows: windowsForm,
  plumbing: plumbingForm,
  electrical: electricalForm,
  // Add more niches as needed - for now these use a generic form
};

// Get form config for a niche
export function getNicheForm(nicheSlug: string): NicheFormConfig | null {
  return nicheForms[nicheSlug] || null;
}

// Check if niche has custom form
export function hasCustomForm(nicheSlug: string): boolean {
  return nicheSlug in nicheForms;
}
