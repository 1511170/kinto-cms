import type { JourneyBuilderData } from '../journey-builder-types';

export const usaData: JourneyBuilderData = {
  country: 'usa',
  countryName: 'Estados Unidos',
  countryCode: 'us',
  currency: 'USD',
  currencySymbol: '$',
  whatsappNumber: '61449159849',
  
  workPermit: {
    hoursPerWeek: 20,
    notes: '20 horas/semana SOLO en campus el primer año. CPT/OPT disponibles después.',
    includedInVisa: false, // F-1 restrictions
    vacationFullTime: false
  },
  
  // 5 CIUDADES principales:
  cities: [
    {
      id: 'newyork',
      name: 'Nueva York',
      tagline: 'La Ciudad que Nunca Duerme',
      image: '/images/cities/city-newyork.png',
      minWage: 15.00, // Varies by state, NYC is higher
      avgRentWeekly: { min: 350, max: 550 }, // USD, habitación compartida
      jobMarket: 'muy_alta',
      livingCostIndex: 1.5,
      description: 'Capital mundial. Wall Street, Broadway, diversidad infinita.',
      highlights: ['Wall Street', 'Broadway', 'Universidades Ivy', 'Diversidad']
    },
    {
      id: 'losangeles',
      name: 'Los Ángeles',
      tagline: 'Hollywood & SoCal',
      image: '/images/cities/city-losangeles.png',
      minWage: 15.50,
      avgRentWeekly: { min: 300, max: 480 },
      jobMarket: 'alta',
      livingCostIndex: 1.35,
      description: 'Hollywood, playas, industria del entretenimiento y startups.',
      highlights: ['Hollywood', 'UCLA/USC', 'Playas', 'Entretenimiento']
    },
    {
      id: 'miami',
      name: 'Miami',
      tagline: 'Sol Latino',
      image: '/images/cities/city-miami.png',
      minWage: 11.00,
      avgRentWeekly: { min: 280, max: 420 },
      jobMarket: 'alta',
      livingCostIndex: 1.2,
      description: 'Puerta de Latinoamérica. Español bienvenido, playas, negocios.',
      highlights: ['70% habla español', 'Hub latino', 'Playas', 'Negocios']
    },
    {
      id: 'boston',
      name: 'Boston',
      tagline: 'Ivy League Hub',
      image: '/images/cities/city-boston.png',
      minWage: 15.00,
      avgRentWeekly: { min: 320, max: 480 },
      jobMarket: 'muy_alta',
      livingCostIndex: 1.4,
      description: 'Harvard, MIT, historia americana. Ciudad universitaria por excelencia.',
      highlights: ['Harvard', 'MIT', 'Educación elite', 'Biotech hub']
    },
    {
      id: 'chicago',
      name: 'Chicago',
      tagline: 'La Segunda Ciudad',
      image: '/images/cities/city-chicago.png',
      minWage: 15.00,
      avgRentWeekly: { min: 220, max: 350 },
      jobMarket: 'alta',
      livingCostIndex: 1.1,
      description: 'Arquitectura, negocios, más económico que NY/LA.',
      highlights: ['Arquitectura', 'Booth/Kellogg', 'Más económico', 'Finanzas']
    }
  ],
  
  courses: [
    {
      id: 'english-intensive',
      name: 'Inglés Intensivo',
      description: 'Inmersión total en inglés americano.',
      baseCostPerMonth: 1200,
      minDuration: 1,
      maxDuration: 12
    },
    {
      id: 'stem-degree',
      name: 'STEM Degree (STEM OPT)',
      description: 'Ciencia, Tech, Ingeniería, Matemáticas. OPT extendido a 3 años.',
      baseCostPerMonth: 2500,
      minDuration: 24,
      maxDuration: 48,
      popular: true
    },
    {
      id: 'mba-business',
      name: 'MBA / Business',
      description: 'Negocios en el país del capitalismo.',
      baseCostPerMonth: 3000,
      minDuration: 12,
      maxDuration: 24
    },
    {
      id: 'associate-degree',
      name: 'Associate Degree (Community College)',
      description: '2 años más económico, transfer a universidad.',
      baseCostPerMonth: 800,
      minDuration: 24,
      maxDuration: 24
    }
  ],
  
  addons: [
    {
      id: 'campus-work',
      name: 'Campus Work Permit',
      description: 'Solo en campus primer año. Incluido con F-1.',
      icon: 'school',
      cost: 0,
      included: true
    },
    {
      id: 'sevis-fee',
      name: 'SEVIS Fee',
      description: 'Fee obligatorio de registro estudiantil',
      icon: 'payments',
      cost: 350,
      included: false
    },
    {
      id: 'medical-insurance',
      name: 'Seguro Médico Universitario',
      description: 'Obligatorio y caro en USA',
      icon: 'medical_services',
      cost: (duration: number) => duration * 400, // Muy caro
      included: false
    },
    {
      id: 'books-materials',
      name: 'Libros y Materiales',
      description: 'Libros universitarios son caros',
      icon: 'menu_book',
      cost: 500, // Por semestre aprox
      included: false
    },
    {
      id: 'airport-pickup',
      name: 'Recogida Aeropuerto',
      description: 'Servicio en JFK/LAX/etc',
      icon: 'flight_land',
      cost: 120,
      included: false
    }
  ],
  
  visaCosts: {
    base: 160, // F-1 visa fee
    sevis: 350, // SEVIS fee
    medical: 0,
    insurance: 4800 // Muy caro, ~400/mes
  },
  
  visaFactors: {
    age: { '18-24': 25, '25-30': 20, '31-35': 15, '36-40': 10, '40+': 5 },
    englishLevel: { beginner: 5, intermediate: 15, advanced: 25, native: 30 },
    workExperience: { none: 5, 'less-than-1': 10, '1-3': 15, '3-5': 20, '5+': 25 },
    financialCapacity: { limited: 5, adequate: 15, comfortable: 25, excellent: 35 } // Muy estrictos
  },
  
  usps: [
    'Top universidades del mundo (Ivy League)',
    'STEM OPT: 3 años trabajo post-grado',
    'Miami: 70% habla español',
    'Networking global incomparable',
    'Oportunidades laborales máximas'
  ],
  
  postStudyWork: {
    available: true,
    duration: '1-3 años',
    description: 'OPT de 12 meses, extensible a 36 meses para graduados STEM.'
  }
};
