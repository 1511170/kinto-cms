import type { JourneyBuilderData } from '../journey-builder-types';

export const germanyData: JourneyBuilderData = {
  country: 'germany',
  countryName: 'Alemania',
  countryCode: 'de',
  currency: 'EUR',
  currencySymbol: '€',
  whatsappNumber: '61449159849',
  
  workPermit: {
    hoursPerWeek: 20,
    notes: '20 horas/semana o 120 días/año full-time durante vacaciones',
    includedInVisa: true,
    vacationFullTime: true
  },
  
  // 5 CIUDADES principales:
  cities: [
    {
      id: 'berlin',
      name: 'Berlín',
      tagline: 'Capital Creativa',
      image: '/images/cities/city-berlin.png',
      minWage: 12.00, // €/hora
      avgRentWeekly: { min: 180, max: 280 }, // EUR, habitación compartida
      jobMarket: 'alta',
      livingCostIndex: 1.0,
      description: 'Capital multicultural. Startup scene, historia, arte y vida alternativa.',
      highlights: ['Startup capital', 'Historia viva', 'Arte y cultura', 'Multicultural']
    },
    {
      id: 'munich',
      name: 'Múnich',
      tagline: 'Prosperidad Bávara',
      image: '/images/cities/city-munich.png',
      minWage: 12.00,
      avgRentWeekly: { min: 240, max: 360 },
      jobMarket: 'muy_alta',
      livingCostIndex: 1.3,
      description: 'Capital de Baviera. BMW, Siemens, alta calidad de vida pero caro.',
      highlights: ['BMW & Siemens', 'Oktoberfest', 'Calidad de vida', 'Empleo tech']
    },
    {
      id: 'hamburg',
      name: 'Hamburgo',
      tagline: 'Puerto & Música',
      image: '/images/cities/city-hamburg.png',
      minWage: 12.00,
      avgRentWeekly: { min: 180, max: 270 },
      jobMarket: 'alta',
      livingCostIndex: 1.05,
      description: 'Segunda ciudad. Puerto más grande, escena musical, verde.',
      highlights: ['Puerto gigante', 'Reeperbahn', 'Verde y canales', 'Media hub']
    },
    {
      id: 'frankfurt',
      name: 'Frankfurt',
      tagline: 'Finanzas de Europa',
      image: '/images/cities/city-frankfurt.png',
      minWage: 12.00,
      avgRentWeekly: { min: 200, max: 300 },
      jobMarket: 'muy_alta',
      livingCostIndex: 1.15,
      description: 'Centro financiero europeo. Rascacielos, bancos, aeropuerto hub.',
      highlights: ['BCE & bancos', 'Skyline única', 'Transporte hub', 'Banca']
    },
    {
      id: 'cologne',
      name: 'Colonia',
      tagline: 'Catedral & Fiesta',
      image: '/images/cities/city-cologne.png',
      minWage: 12.00,
      avgRentWeekly: { min: 160, max: 240 },
      jobMarket: 'alta',
      livingCostIndex: 0.95,
      description: 'Catedral UNESCO, ferias comerciales, universidad grande.',
      highlights: ['Catedral UNESCO', 'Feria comercios', 'Universidad', 'Carnaval']
    }
  ],
  
  courses: [
    {
      id: 'german-language',
      name: 'Alemán Intensivo',
      description: 'Aprende alemán en el país. Clave para integración y trabajo.',
      baseCostPerMonth: 400, // Barato
      minDuration: 3,
      maxDuration: 12
    },
    {
      id: 'engineering',
      name: 'Ingeniería & STEM',
      description: 'Educación técnica de élite. Carreras con alta demanda laboral.',
      baseCostPerMonth: 350, // Universidades públicas casi gratis
      minDuration: 24,
      maxDuration: 48,
      popular: true
    },
    {
      id: 'business-german',
      name: 'Business & Alemán',
      description: 'Combina idioma y negocios en el motor de Europa.',
      baseCostPerMonth: 500,
      minDuration: 6,
      maxDuration: 24
    },
    {
      id: 'vocational',
      name: 'Formación Profesional (Ausbildung)',
      description: 'Sistema dual alemán. Estudia y trabaja pagado.',
      baseCostPerMonth: 0, // Gratis y pagan
      minDuration: 24,
      maxDuration: 42
    }
  ],
  
  addons: [
    {
      id: 'work-permit',
      name: 'Permiso de Trabajo',
      description: 'Incluido - 20hrs/semana o 120 días/año full-time',
      icon: 'payments',
      cost: 0,
      included: true
    },
    {
      id: 'blocked-account',
      name: 'Blocked Account',
      description: 'Requisito visa - €11,208/año en cuenta bloqueada',
      icon: 'account_balance',
      cost: 150, // Fee de apertura
      included: false
    },
    {
      id: 'health-insurance',
      name: 'Seguro de Salud',
      description: 'Obligatorio para estudiantes',
      icon: 'medical_services',
      cost: (duration: number) => duration * 110, // ~110 EUR/mes
      included: false
    },
    {
      id: 'airport-pickup',
      name: 'Recogida Aeropuerto',
      description: 'Te recibimos en FRA/MUC/TXL',
      icon: 'flight_land',
      cost: 80,
      included: false
    }
  ],
  
  visaCosts: {
    base: 75, // Visa nacional
    medical: 0,
    insurance: 1320 // ~110 EUR/mes
  },
  
  visaFactors: {
    age: { '18-24': 25, '25-30': 20, '31-35': 15, '36-40': 10, '40+': 5 },
    englishLevel: { beginner: 10, intermediate: 20, advanced: 25, native: 30 },
    workExperience: { none: 5, 'less-than-1': 10, '1-3': 15, '3-5': 20, '5+': 25 },
    financialCapacity: { limited: 5, adequate: 15, comfortable: 25, excellent: 35 } // Muy estricto con dinero
  },
  
  usps: [
    'Educación universitaria casi gratuita',
    'Salarios más altos de Europa',
    'Demanda masiva de ingenieros',
    'Jobseeker visa 18 meses post-grado',
    'Motor económico de Europa'
  ],
  
  postStudyWork: {
    available: true,
    duration: '18 meses',
    description: 'Jobseeker visa de 18 meses para encontrar empleo relacionado con tus estudios.'
  }
};
