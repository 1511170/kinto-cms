// Datos para el Australia Journey Builder - Calculadora interactiva

export interface CityData {
  id: string;
  name: string;
  image: string;
  tagline: string;
  minWage: number; // AUD por hora
  avgRentWeekly: { min: number; max: number };
  jobMarket: 'muy_alta' | 'alta' | 'media-alta' | 'media';
  livingCost: 'muy_alto' | 'alto' | 'medio-alto' | 'medio' | 'bajo';
  livingCostIndex: number; // Multiplicador de costos (1.0 = base)
  description: string;
  highlights: string[];
}

export interface CourseType {
  id: string;
  name: string;
  description: string;
  baseCostPerMonth: number; // AUD
  minDuration: number; // meses
  maxDuration: number;
  popular?: boolean;
  visaRequirements: string;
}

export interface AddonOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number | ((duration: number) => number);
  included: boolean;
}

export interface VisaProbabilityFactors {
  age: Record<string, number>;
  englishLevel: Record<string, number>;
  workExperience: Record<string, number>;
  financialCapacity: Record<string, number>;
}

// Ciudades de Australia con datos actualizados 2024
export const australiaCities: CityData[] = [
  {
    id: 'sydney',
    name: 'Sydney',
    image: '/images/cities/city-sydney.png',
    tagline: 'Vibrante & Oportunidades',
    minWage: 23.23,
    avgRentWeekly: { min: 300, max: 450 },
    jobMarket: 'muy_alta',
    livingCost: 'alto',
    livingCostIndex: 1.25,
    description: 'La ciudad más grande de Australia. Mercado laboral masivo, playas icónicas y la mayor comunidad latina.',
    highlights: ['Mercado laboral masivo', 'Playas icónicas', 'Mayor comunidad latina', 'Salarios más altos']
  },
  {
    id: 'melbourne',
    name: 'Melbourne',
    image: '/images/cities/city-melbourne.png',
    tagline: 'Cultura & Estilo de Vida',
    minWage: 23.23,
    avgRentWeekly: { min: 280, max: 400 },
    jobMarket: 'alta',
    livingCost: 'medio-alto',
    livingCostIndex: 1.15,
    description: 'Capital cultural de Australia. Café de clase mundial, arte, música y estilo europeo.',
    highlights: ['Capital cultural', 'Café de clase mundial', 'Arte y música', 'Estilo europeo']
  },
  {
    id: 'brisbane',
    name: 'Brisbane',
    image: '/images/cities/brisbane-australia.png',
    tagline: 'Sol & Tranquilidad',
    minWage: 23.23,
    avgRentWeekly: { min: 250, max: 350 },
    jobMarket: 'media-alta',
    livingCost: 'medio',
    livingCostIndex: 1.0,
    description: 'Clima subtropical todo el año. Más económica, en crecimiento y cerca de Gold Coast.',
    highlights: ['Clima subtropical', 'Más económica', 'Crecimiento rápido', 'Cerca de Gold Coast']
  },
  {
    id: 'goldcoast',
    name: 'Gold Coast',
    image: '/images/cities/goldcoast-australia.png',
    tagline: 'Playas & Surf',
    minWage: 23.23,
    avgRentWeekly: { min: 240, max: 320 },
    jobMarket: 'media',
    livingCost: 'medio',
    livingCostIndex: 0.95,
    description: 'Playas paradisíacas y ambiente surfer. Turismo fuerte y estilo de vida relajado.',
    highlights: ['Playas paradisíacas', 'Ambiente surfer', 'Turismo fuerte', 'Estilo relajado']
  },
  {
    id: 'perth',
    name: 'Perth',
    image: '/images/cities/city-perth.png',
    tagline: 'Oportunidades del Oeste',
    minWage: 23.23,
    avgRentWeekly: { min: 260, max: 380 },
    jobMarket: 'alta',
    livingCost: 'medio-alto',
    livingCostIndex: 1.1,
    description: 'Capital de Western Australia. Minería, buenos salarios y estilo de vida relajado.',
    highlights: ['Sector minero', 'Buenos salarios', 'Estilo relajado', 'Menos saturada']
  }
];

// Tipos de cursos disponibles
export const courseTypes: CourseType[] = [
  {
    id: 'english-general',
    name: 'Inglés General',
    description: 'Perfecciona tu nivel desde principiante hasta avanzado con profesores nativos.',
    baseCostPerMonth: 800,
    minDuration: 3,
    maxDuration: 24,
    popular: false,
    visaRequirements: 'Visa de Estudiante (Subclase 500)'
  },
  {
    id: 'vet-technical',
    name: 'Cursos VET (Técnicos)',
    description: 'Especialízate mientras trabajas. Programas prácticos con alta empleabilidad.',
    baseCostPerMonth: 1200,
    minDuration: 6,
    maxDuration: 24,
    popular: true,
    visaRequirements: 'Visa de Estudiante (Subclase 500)'
  },
  {
    id: 'university',
    name: 'Universidad',
    description: 'Grados y Masters con alta proyección migratoria y laboral.',
    baseCostPerMonth: 2500,
    minDuration: 12,
    maxDuration: 48,
    popular: false,
    visaRequirements: 'Visa de Estudiante (Subclase 500) + Confirmación de matrícula'
  }
];

// Complementos y extras
export const addonOptions: AddonOption[] = [
  {
    id: 'work-permit',
    name: 'Permiso de Trabajo',
    description: 'Incluido en Visa de Estudiante (48h/quincena)',
    icon: 'payments',
    cost: 0,
    included: true
  },
  {
    id: 'premium-insurance',
    name: 'Seguro Médico Premium',
    description: 'Mejor cobertura hospitalaria y dental',
    icon: 'medical_services',
    cost: (duration) => duration * 80, // $80 AUD por mes
    included: false
  },
  {
    id: 'homestay',
    name: 'Alojamiento Homestay',
    description: 'Vive con familia australiana, incluye media pensión',
    icon: 'home',
    cost: (duration) => duration * 4.33 * 350, // ~$350/semana
    included: false
  },
  {
    id: 'airport-pickup',
    name: 'Recogida Aeropuerto',
    description: 'Te recibimos en el aeropuerto y te llevamos a tu alojamiento',
    icon: 'flight_land',
    cost: 150,
    included: false
  }
];

// Factores para calcular probabilidad de visa
export const visaProbabilityFactors: VisaProbabilityFactors = {
  age: {
    '18-24': 25,
    '25-30': 20,
    '31-35': 15,
    '36-40': 10,
    '40+': 5
  },
  englishLevel: {
    'beginner': 5,
    'intermediate': 15,
    'advanced': 25,
    'native': 30
  },
  workExperience: {
    'none': 5,
    'less-than-1': 10,
    '1-3': 15,
    '3-5': 20,
    '5+': 25
  },
  financialCapacity: {
    'limited': 10,
    'adequate': 20,
    'comfortable': 30,
    'excellent': 35
  }
};

// Costos fijos de visa
export const visaCosts = {
  baseVisaFee: 710, // AUD
  biometrics: 0, // Incluido ahora
  medicalExam: 150, // Aproximado
  oshcBase: 340, // Por 6 meses base
  oshcPerMonth: 57 // Costo adicional por mes
};

// Función para calcular probabilidad de visa
export function calculateVisaProbability(
  age: string,
  englishLevel: string,
  workExperience: string,
  financialCapacity: string,
  hasGenuineTemporaryEntrant: boolean = true
): number {
  let probability = 0;
  
  probability += visaProbabilityFactors.age[age] || 0;
  probability += visaProbabilityFactors.englishLevel[englishLevel] || 0;
  probability += visaProbabilityFactors.workExperience[workExperience] || 0;
  probability += visaProbabilityFactors.financialCapacity[financialCapacity] || 0;
  
  // Bonus por Genuine Temporary Entrant (GTE)
  if (hasGenuineTemporaryEntrant) {
    probability += 15;
  }
  
  // Cap entre 0 y 99
  return Math.min(99, Math.max(0, probability));
}

// Función para calcular costo total
export function calculateTotalCost(
  city: CityData,
  course: CourseType,
  duration: number,
  addons: string[],
  includeFlights: boolean = true
): { 
  courseCost: number;
  visaCost: number;
  oshcCost: number;
  addonsCost: number;
  flightsCost: number;
  total: number;
  breakdown: Record<string, number>;
} {
  const courseCost = course.baseCostPerMonth * duration * city.livingCostIndex;
  const visaCost = visaCosts.baseVisaFee + visaCosts.medicalExam;
  const oshcCost = visaCosts.oshcBase + (Math.max(0, duration - 6) * visaCosts.oshcPerMonth);
  
  let addonsCost = 0;
  addonOptions.forEach(addon => {
    if (addons.includes(addon.id)) {
      if (typeof addon.cost === 'function') {
        addonsCost += addon.cost(duration);
      } else {
        addonsCost += addon.cost;
      }
    }
  });
  
  const flightsCost = includeFlights ? 1850 : 0; // Promedio vuelos ida y vuelta
  
  const total = courseCost + visaCost + oshcCost + addonsCost + flightsCost;
  
  return {
    courseCost: Math.round(courseCost),
    visaCost,
    oshcCost: Math.round(oshcCost),
    addonsCost: Math.round(addonsCost),
    flightsCost,
    total: Math.round(total),
    breakdown: {
      'Curso': Math.round(courseCost),
      'Visa y Exámenes': visaCost,
      'Seguro Médico (OSHC)': Math.round(oshcCost),
      'Complementos': Math.round(addonsCost),
      'Vuelos': flightsCost
    }
  };
}

// Función para calcular potencial de ahorro
export function calculateSavingsPotential(
  city: CityData,
  duration: number,
  workHoursPerWeek: number = 20 // 48hrs/quincena = 24hrs/semana promedio
): {
  grossIncome: number;
  estimatedExpenses: number;
  potentialSavings: number;
} {
  const weeks = duration * 4.33; // Promedio semanas por mes
  const grossIncome = weeks * workHoursPerWeek * city.minWage;
  
  // Gastos estimados: alquiler + comida + transporte + misc
  const weeklyRent = (city.avgRentWeekly.min + city.avgRentWeekly.max) / 2;
  const weeklyExpenses = weeklyRent + 150 + 50 + 100; // comida + transporte + misc
  const estimatedExpenses = weeks * weeklyExpenses;
  
  const potentialSavings = grossIncome - estimatedExpenses;
  
  return {
    grossIncome: Math.round(grossIncome),
    estimatedExpenses: Math.round(estimatedExpenses),
    potentialSavings: Math.round(potentialSavings)
  };
}

// Generar mensaje para WhatsApp
export function generateWhatsAppMessage(
  city: CityData,
  course: CourseType,
  duration: number,
  addons: string[],
  costs: ReturnType<typeof calculateTotalCost>,
  visaProb: number,
  savings: ReturnType<typeof calculateSavingsPotential>
): string {
  const addonNames = addons.map(id => 
    addonOptions.find(a => a.id === id)?.name
  ).filter(Boolean);
  
  return `🎯 *Mi Plan para Australia - Global Dreamers*

📍 *CIUDAD:* ${city.name}
⏱️ *DURACIÓN:* ${duration} meses
📚 *CURSO:* ${course.name}
💼 *TRABAJO:* Sí (48hrs/quincena)
${addonNames.length > 0 ? `✨ *COMPLEMENTOS:* ${addonNames.join(', ')}\n` : ''}
💰 *INVERSIÓN TOTAL:* $${costs.total.toLocaleString()} AUD
   • Curso: $${costs.courseCost.toLocaleString()}
   • Visa: $${costs.visaCost.toLocaleString()}
   • OSHC: $${costs.oshcCost.toLocaleString()}
   • Vuelos: $${costs.flightsCost.toLocaleString()}

📊 *PROBABILIDAD VISA:* ${visaProb}%

💵 *AHORRO ESTIMADO:* $${savings.potentialSavings.toLocaleString()} AUD en ${duration} meses

Quiero agendar mi asesoría gratuita para revisar este plan.`;
}
