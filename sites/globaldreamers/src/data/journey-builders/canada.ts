// Canada Journey Builder Data
import type { JourneyBuilderData } from '../journey-builder-types';

export const canadaData: JourneyBuilderData = {
  country: 'canada',
  countryName: 'Canadá',
  countryCode: 'ca',
  currency: 'CAD',
  currencySymbol: '$',
  whatsappNumber: '61412345678',
  
  workPermit: {
    hoursPerWeek: 20,
    notes: '20 horas/semana durante clases, full-time en vacaciones oficiales',
    includedInVisa: true,
    vacationFullTime: true
  },
  
  cities: [
    {
      id: 'toronto',
      name: 'Toronto',
      tagline: 'Multicultural & Negocios',
      image: '/images/cities/city-toronto.png',
      minWage: 16.75,
      avgRentWeekly: { min: 200, max: 280 },
      jobMarket: 'muy_alta',
      livingCostIndex: 1.2,
      description: 'La ciudad más multicultural del mundo. Centro financiero de Canadá con infinitas oportunidades laborales.',
      highlights: ['Mayor comunidad latina', 'Mercado laboral masivo', 'Transporte público excelente', 'Diversidad cultural']
    },
    {
      id: 'vancouver',
      name: 'Vancouver',
      tagline: 'Naturaleza + Ciudad',
      image: '/images/cities/city-vancouver.png',
      minWage: 16.75,
      avgRentWeekly: { min: 220, max: 300 },
      jobMarket: 'alta',
      livingCostIndex: 1.3,
      description: 'Montañas y mar en una ciudad. Clima templado, tech hub y acceso a outdoor todo el año.',
      highlights: ['Montañas y océano', 'Tech hub creciente', 'Clima templado', 'Asiático-influenciado']
    },
    {
      id: 'montreal',
      name: 'Montreal',
      tagline: 'Cultura & Bilingüe',
      image: '/images/cities/city-montreal.png',
      minWage: 15.25,
      avgRentWeekly: { min: 150, max: 220 },
      jobMarket: 'media-alta',
      livingCostIndex: 0.9,
      description: 'La ciudad más europea de Canadá. Bilingüe francés-inglés, arte, festivales y vida nocturna.',
      highlights: ['Ciudad bilingüe', 'Más económica', 'Vida cultural intensa', 'AI hub mundial']
    },
    {
      id: 'calgary',
      name: 'Calgary',
      tagline: 'Petróleo & Aventura',
      image: '/images/cities/city-calgary.png',
      minWage: 15.00,
      avgRentWeekly: { min: 140, max: 200 },
      jobMarket: 'alta',
      livingCostIndex: 0.85,
      description: 'Puerta a las Rocosas. Sector petrolero, bajo costo de vida y cerca de Banff.',
      highlights: ['Cerca de las Rocosas', 'Bajo costo de vida', 'Sector energético', 'Impuestos bajos']
    }
  ],
  
  courses: [
    {
      id: 'english-french',
      name: 'Inglés o Francés',
      description: 'Aprende inglés o francés en un país bilingüe oficialmente.',
      baseCostPerMonth: 650,
      minDuration: 4,
      maxDuration: 24
    },
    {
      id: 'college-co-op',
      name: 'College Co-op (Work & Study)',
      description: 'Programas con pasantías pagadas. La mejor opción para ganar experiencia canadiense.',
      baseCostPerMonth: 1200,
      minDuration: 12,
      maxDuration: 36,
      popular: true,
      coOp: true
    },
    {
      id: 'university',
      name: 'Universidad',
      description: 'Grados y Masters reconocidos mundialmente. Acceso a PGWP.',
      baseCostPerMonth: 2000,
      minDuration: 24,
      maxDuration: 48
    }
  ],
  
  addons: [
    {
      id: 'work-permit',
      name: 'Permiso de Trabajo',
      description: 'Incluido en Study Permit',
      icon: 'payments',
      cost: 0,
      included: true
    },
    {
      id: 'pgwp',
      name: 'PGWP (Post-Graduation Work Permit)',
      description: 'Trabaja hasta 3 años post-graduación',
      icon: 'badge',
      cost: 0,
      included: false
    },
    {
      id: 'homestay',
      name: 'Alojamiento Familiar',
      description: 'Vive con familia canadiense',
      icon: 'home',
      cost: (duration) => duration * 4.33 * 280,
      included: false
    },
    {
      id: 'airport-pickup',
      name: 'Recogida Aeropuerto',
      description: 'Te recibimos en YYZ/YVR/etc',
      icon: 'flight_land',
      cost: 100,
      included: false
    }
  ],
  
  visaCosts: {
    base: 150,
    biometrics: 85,
    medical: 150,
    insurance: 600 // UHIP or provincial wait period
  },
  
  visaFactors: {
    age: { '18-24': 25, '25-30': 20, '31-35': 15, '36-40': 10, '40+': 5 },
    englishLevel: { beginner: 5, intermediate: 15, advanced: 25, native: 30 },
    workExperience: { none: 5, 'less-than-1': 10, '1-3': 15, '3-5': 20, '5+': 25 },
    financialCapacity: { limited: 10, adequate: 20, comfortable: 30, excellent: 35 },
    tiesToHomeCountry: { weak: 0, moderate: 10, strong: 15 }
  },
  
  usps: [
    'PGWP: Trabaja hasta 3 años post-graduación',
    'Camino directo a Residencia Permanente',
    'Salario mínimo alto ($16.75+ CAD/hr)',
    'Gratis educación básica para hijos',
    'Comunidad latina enorme y creciente'
  ],
  
  postStudyWork: {
    available: true,
    duration: '1-3 años',
    description: 'PGWP permite trabajar para cualquier empleador. Duración iguala duración del programa.'
  }
};
