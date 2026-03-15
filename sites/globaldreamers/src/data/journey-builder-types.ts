// Types for Journey Builder - Shared across all destinations

export interface CityData {
  id: string;
  name: string;
  tagline: string;
  image: string;
  minWage: number;
  avgRentWeekly: { min: number; max: number };
  jobMarket: 'muy_alta' | 'alta' | 'media-alta' | 'media' | 'baja';
  livingCostIndex: number;
  description: string;
  highlights: string[];
}

export interface CourseType {
  id: string;
  name: string;
  description: string;
  baseCostPerMonth: number;
  minDuration: number;
  maxDuration: number;
  popular?: boolean;
  visaRequirements?: string;
  coOp?: boolean; // For work & study programs
}

export interface AddonOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number | ((duration: number) => number);
  included: boolean;
}

export interface VisaCosts {
  base: number;
  biometrics?: number;
  medical: number;
  insurance: number; // Annual or base
  insurancePerMonth?: number;
  ihs?: number; // UK specific - Immigration Health Surcharge
  sevis?: number; // USA specific
}

export interface WorkPermit {
  hoursPerWeek: number;
  notes: string;
  includedInVisa: boolean;
  vacationFullTime?: boolean;
}

export interface VisaFactors {
  age: Record<string, number>;
  englishLevel: Record<string, number>;
  workExperience: Record<string, number>;
  financialCapacity: Record<string, number>;
  tiesToHomeCountry?: Record<string, number>; // Canada specific
}

export interface SpecialFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface JourneyBuilderData {
  country: string;
  countryName: string;
  countryCode: string; // ISO code for flag
  currency: string;
  currencySymbol: string;
  whatsappNumber: string;
  
  // Work configuration
  workPermit: WorkPermit;
  
  // Cities
  cities: CityData[];
  
  // Courses
  courses: CourseType[];
  
  // Addons
  addons: AddonOption[];
  
  // Visa costs
  visaCosts: VisaCosts;
  
  // Probability factors
  visaFactors: VisaFactors;
  
  // Special features (optional)
  specialFeatures?: SpecialFeature[];
  
  // Unique selling points for this destination
  usps: string[];
  
  // Post-study options
  postStudyWork?: {
    available: boolean;
    duration: string;
    description: string;
  };
}

// State interface for the journey builder
export interface JourneyBuilderState {
  currentStep: number;
  selectedCity: string | null;
  duration: number;
  selectedCourse: string | null;
  selectedAddons: string[];
  profile: {
    age: string;
    englishLevel: string;
    workExperience: string;
    financialCapacity: string;
    tiesToHomeCountry?: string;
  };
}

// Result calculations
export interface JourneyCosts {
  course: number;
  visa: number;
  insurance: number;
  addons: number;
  flights: number;
  total: number;
  breakdown: Record<string, number>;
}

export interface SavingsPotential {
  grossIncome: number;
  estimatedExpenses: number;
  potentialSavings: number;
}
