import type { JourneyBuilderData } from '../journey-builder-types';

export const dubaiData: JourneyBuilderData = {
  country: 'dubai',
  countryName: 'Dubai',
  countryCode: 'ae',
  currency: 'AED',
  currencySymbol: 'AED',
  whatsappNumber: '61449159849',
  
  workPermit: {
    hoursPerWeek: 0, // Limitado, principalmente internships
    notes: 'Trabajo limitado durante estudios. Internships disponibles mediante universidad.',
    includedInVisa: false,
    vacationFullTime: false
  },
  
  // 3 EMIRATOS/CIUDADES principales:
  cities: [
    {
      id: 'dubai',
      name: 'Dubai',
      tagline: 'Ciudad del Futuro',
      image: '/images/cities/city-dubai.png',
      minWage: 0, // No hay salario mínimo oficial, los internships varían
      avgRentWeekly: { min: 400, max: 700 }, // AED, habitación compartida
      jobMarket: 'muy_alta',
      livingCostIndex: 1.3,
      description: 'La ciudad más innovadora del mundo. Hub de negocios global y arquitectura futurista.',
      highlights: ['0% impuestos', 'Burj Khalifa', 'Hub de negocios', 'Seguridad total']
    },
    {
      id: 'abu-dhabi',
      name: 'Abu Dhabi',
      tagline: 'Capital Cultural',
      image: '/images/cities/city-abudhabi.png',
      minWage: 0,
      avgRentWeekly: { min: 350, max: 600 },
      jobMarket: 'alta',
      livingCostIndex: 1.2,
      description: 'Capital de EAU. Más conservadora que Dubai, con fuerte sector petrolero y cultural.',
      highlights: ['Capital de EAU', 'Louvre Abu Dhabi', 'Sector energético', 'Playas tranquilas']
    },
    {
      id: 'sharjah',
      name: 'Sharjah',
      tagline: 'Cultura & Tradición',
      image: '/images/cities/city-sharjah.png',
      minWage: 0,
      avgRentWeekly: { min: 200, max: 350 },
      jobMarket: 'media',
      livingCostIndex: 0.75,
      description: 'Emirato cultural. Mucho más económico, ideal para presupuestos ajustados.',
      highlights: ['50% más barato', 'Capital cultural', 'Cercano a Dubai', 'Universidades']
    }
  ],
  
  courses: [
    {
      id: 'business-management',
      name: 'Business & Management',
      description: 'MBA y programas de negocios en el hub empresarial de Oriente Medio.',
      baseCostPerMonth: 2500, // AED
      minDuration: 12,
      maxDuration: 24
    },
    {
      id: 'hospitality',
      name: 'Hospitality & Tourism',
      description: 'Hotelería en la capital mundial del turismo de lujo.',
      baseCostPerMonth: 2000,
      minDuration: 6,
      maxDuration: 24,
      popular: true
    },
    {
      id: 'aviation',
      name: 'Aviation',
      description: 'Pilotos, cabin crew y gestión aérea. Home de Emirates.',
      baseCostPerMonth: 3000,
      minDuration: 6,
      maxDuration: 18
    }
  ],
  
  addons: [
    {
      id: 'visa-sponsorship',
      name: 'Sponsorship de Visa',
      description: 'Incluido - La escuela patrocina tu visa de estudiante',
      icon: 'badge',
      cost: 0,
      included: true
    },
    {
      id: 'emirates-id',
      name: 'Emirates ID',
      description: 'Documento de identidad requerido',
      icon: 'badge',
      cost: 370,
      included: false
    },
    {
      id: 'medical-insurance',
      name: 'Seguro Médico Obligatorio',
      description: 'Cobertura médica requerida por ley',
      icon: 'medical_services',
      cost: (duration) => duration * 200,
      included: false
    },
    {
      id: 'airport-pickup',
      name: 'Recogida Aeropuerto DXB',
      description: 'Lujo desde el aeropuerto',
      icon: 'flight_land',
      cost: 150,
      included: false
    }
  ],
  
  visaCosts: {
    base: 1200, // Visa de estudiante
    medical: 300, // Examen médico
    insurance: 2400, // Seguro básico anual
    insurancePerMonth: 200
  },
  
  visaFactors: {
    age: { '18-24': 25, '25-30': 20, '31-35': 15, '36-40': 10, '40+': 5 },
    englishLevel: { beginner: 10, intermediate: 20, advanced: 25, native: 30 },
    workExperience: { none: 5, 'less-than-1': 10, '1-3': 15, '3-5': 20, '5+': 25 },
    financialCapacity: { limited: 5, adequate: 15, comfortable: 25, excellent: 35 }
  },
  
  usps: [
    '0% impuestos sobre la renta',
    'Ciudad más segura del mundo',
    'Hub de negocios global',
    'Conexiones aéreas a todo el mundo',
    'Arquitectura y lujo incomparables'
  ],
  
  postStudyWork: {
    available: true,
    duration: '2-5 años',
    description: 'Golden Visa disponible para graduados. Sponsorship por empleador posible.'
  }
};
