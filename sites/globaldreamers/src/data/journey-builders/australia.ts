// Australia Journey Builder Data
import type { JourneyBuilderData } from '../journey-builder-types';

export const australiaData: JourneyBuilderData = {
  country: 'australia',
  countryName: 'Australia',
  countryCode: 'au',
  currency: 'AUD',
  currencySymbol: '$',
  whatsappNumber: '61412345678',
  
  workPermit: {
    hoursPerWeek: 24,
    notes: '48 horas por quincena durante el curso, tiempo completo en vacaciones',
    includedInVisa: true,
    vacationFullTime: true
  },
  
  cities: [
    {
      id: 'sydney',
      name: 'Sydney',
      tagline: 'Vibrante & Oportunidades',
      image: '/images/cities/city-sydney.png',
      minWage: 23.23,
      avgRentWeekly: { min: 210, max: 280 },
      jobMarket: 'muy_alta',
      livingCostIndex: 1.25,
      description: 'La ciudad más grande de Australia. Mercado laboral masivo, playas icónicas y la mayor comunidad latina.',
      highlights: ['Mercado laboral masivo', 'Playas icónicas', 'Mayor comunidad latina', 'Salarios más altos']
    },
    {
      id: 'melbourne',
      name: 'Melbourne',
      tagline: 'Cultura & Estilo de Vida',
      image: '/images/cities/city-melbourne.png',
      minWage: 23.23,
      avgRentWeekly: { min: 200, max: 250 },
      jobMarket: 'alta',
      livingCostIndex: 1.15,
      description: 'Capital cultural de Australia. Café de clase mundial, arte, música y estilo europeo.',
      highlights: ['Capital cultural', 'Café de clase mundial', 'Arte y música', 'Estilo europeo']
    },
    {
      id: 'brisbane',
      name: 'Brisbane',
      tagline: 'Sol & Tranquilidad',
      image: '/images/cities/brisbane-australia.png',
      minWage: 23.23,
      avgRentWeekly: { min: 180, max: 230 },
      jobMarket: 'media-alta',
      livingCostIndex: 1.0,
      description: 'Clima subtropical todo el año. Más económica, en crecimiento y cerca de Gold Coast.',
      highlights: ['Clima subtropical', 'Más económica', 'Crecimiento rápido', 'Cerca de Gold Coast']
    },
    {
      id: 'goldcoast',
      name: 'Gold Coast',
      tagline: 'Playas & Surf',
      image: '/images/cities/goldcoast-australia.png',
      minWage: 23.23,
      avgRentWeekly: { min: 170, max: 210 },
      jobMarket: 'media',
      livingCostIndex: 0.95,
      description: 'Playas paradisíacas y ambiente surfer. Turismo fuerte y estilo de vida relajado.',
      highlights: ['Playas paradisíacas', 'Ambiente surfer', 'Turismo fuerte', 'Estilo relajado']
    },
    {
      id: 'perth',
      name: 'Perth',
      tagline: 'Oportunidades del Oeste',
      image: '/images/cities/city-perth.png',
      minWage: 23.23,
      avgRentWeekly: { min: 190, max: 240 },
      jobMarket: 'alta',
      livingCostIndex: 1.1,
      description: 'Capital de Western Australia. Minería, buenos salarios y estilo de vida relajado.',
      highlights: ['Sector minero', 'Buenos salarios', 'Estilo relajado', 'Menos saturada']
    }
  ],
  
  courses: [
    {
      id: 'english-general',
      name: 'Inglés General',
      description: 'Perfecciona tu nivel desde principiante hasta avanzado con profesores nativos.',
      baseCostPerMonth: 800,
      minDuration: 3,
      maxDuration: 24,
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
      visaRequirements: 'Visa de Estudiante (Subclase 500) + Confirmación de matrícula'
    }
  ],
  
  addons: [
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
      cost: (duration) => duration * 80,
      included: false
    },
    {
      id: 'homestay',
      name: 'Alojamiento Homestay',
      description: 'Vive con familia australiana, incluye media pensión',
      icon: 'home',
      cost: (duration) => duration * 4.33 * 350,
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
  ],
  
  visaCosts: {
    base: 710,
    medical: 150,
    insurance: 340,
    insurancePerMonth: 57
  },
  
  visaFactors: {
    age: { '18-24': 25, '25-30': 20, '31-35': 15, '36-40': 10, '40+': 5 },
    englishLevel: { beginner: 5, intermediate: 15, advanced: 25, native: 30 },
    workExperience: { none: 5, 'less-than-1': 10, '1-3': 15, '3-5': 20, '5+': 25 },
    financialCapacity: { limited: 10, adequate: 20, comfortable: 30, excellent: 35 }
  },
  
  usps: [
    'Salario mínimo más alto del mundo ($23.23 AUD/hr)',
    '48 horas/quincena permitidas',
    'Post-Study Work Visa hasta 4 años',
    'Calidad de vida top mundial',
    'Comunidad latina grande y acogedora'
  ],
  
  postStudyWork: {
    available: true,
    duration: '2-4 años',
    description: 'Visa 485 permite trabajar full-time post-graduación'
  }
};
