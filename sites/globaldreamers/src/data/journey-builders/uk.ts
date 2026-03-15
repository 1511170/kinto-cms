// UK Journey Builder Data
import type { JourneyBuilderData } from '../journey-builder-types';

export const ukData: JourneyBuilderData = {
  country: 'uk',
  countryName: 'Reino Unido',
  countryCode: 'gb',
  currency: 'GBP',
  currencySymbol: '£',
  whatsappNumber: '61412345678',
  
  workPermit: {
    hoursPerWeek: 20,
    notes: '20 horas/semana durante término, full-time en vacaciones',
    includedInVisa: true,
    vacationFullTime: true
  },
  
  cities: [
    {
      id: 'london',
      name: 'Londres',
      tagline: 'Capital Global',
      image: '/images/cities/city-london.png',
      minWage: 11.44,
      avgRentWeekly: { min: 180, max: 250 },
      jobMarket: 'muy_alta',
      livingCostIndex: 1.4,
      description: 'Una de las capitales más importantes del mundo. Oportunidades infinitas pero costo de vida alto.',
      highlights: ['Capital financiera mundial', 'Diversidad extrema', 'Transporte 24h', 'Cultura sin igual']
    },
    {
      id: 'manchester',
      name: 'Manchester',
      tagline: 'Norte Industrial & Cultural',
      image: '/images/cities/city-manchester.png',
      minWage: 11.44,
      avgRentWeekly: { min: 100, max: 150 },
      jobMarket: 'alta',
      livingCostIndex: 0.8,
      description: 'La segunda ciudad más grande. Más barata que Londres, gran vida nocturna y crecimiento tech.',
      highlights: ['Más económico', 'Vida estudiantil intensa', 'Tech hub emergente', 'Fútbol y música']
    },
    {
      id: 'birmingham',
      name: 'Birmingham',
      tagline: 'Joven & Diverso',
      image: '/images/cities/city-birmingham.png',
      minWage: 11.44,
      avgRentWeekly: { min: 90, max: 140 },
      jobMarket: 'media-alta',
      livingCostIndex: 0.75,
      description: 'Segunda ciudad más grande del UK. Joven, diversa y mucho más accesible que Londres.',
      highlights: ['Segunda ciudad UK', 'Muy multicultural', 'Costo accesible', 'Negocios y finanzas']
    },
    {
      id: 'edinburgh',
      name: 'Edimburgo',
      tagline: 'Historia & Educación',
      image: '/images/cities/edinburgh-scotland.png',
      minWage: 11.44,
      avgRentWeekly: { min: 120, max: 180 },
      jobMarket: 'media',
      livingCostIndex: 0.85,
      description: 'Capital de Escocia. Ciudad medieval, festival de Fringe y universidad de elite.',
      highlights: ['Capital escocesa', 'Universidad de elite', 'Festival Fringe', 'Escocés gratis']
    }
  ],
  
  courses: [
    {
      id: 'english',
      name: 'Inglés General/Académico',
      description: 'El inglés más prestigioso del mundo. Ideal para preparar IELTS.',
      baseCostPerMonth: 600,
      minDuration: 4,
      maxDuration: 24
    },
    {
      id: 'pathway',
      name: 'Pathway / Foundation',
      description: 'Preparación para entrada a universidad británica.',
      baseCostPerMonth: 1200,
      minDuration: 6,
      maxDuration: 12,
      popular: true
    },
    {
      id: 'masters',
      name: 'Master\'s Degree',
      description: 'Masters de 1 año. Graduate Route visa disponible.',
      baseCostPerMonth: 1800,
      minDuration: 12,
      maxDuration: 12
    }
  ],
  
  addons: [
    {
      id: 'work-permit',
      name: 'Permiso de Trabajo',
      description: 'Incluido en Student Visa',
      icon: 'payments',
      cost: 0,
      included: true
    },
    {
      id: 'ihs',
      name: 'IHS (Health Surcharge)',
      description: 'Acceso NHS - requerido por cada año',
      icon: 'medical_services',
      cost: 776,
      included: false
    },
    {
      id: 'homestay',
      name: 'Alojamiento',
      description: 'Habitación en shared house',
      icon: 'home',
      cost: (duration) => duration * 4.33 * 200,
      included: false
    },
    {
      id: 'airport-pickup',
      name: 'Recogida Aeropuerto',
      description: 'LHR/LGW/MAN/etc',
      icon: 'flight_land',
      cost: 80,
      included: false
    }
  ],
  
  visaCosts: {
    base: 363,
    medical: 0, // Covered by IHS
    insurance: 776, // IHS per year
    ihs: 776
  },
  
  visaFactors: {
    age: { '18-24': 25, '25-30': 20, '31-35': 15, '36-40': 10, '40+': 5 },
    englishLevel: { beginner: 5, intermediate: 15, advanced: 25, native: 30 },
    workExperience: { none: 5, 'less-than-1': 10, '1-3': 15, '3-5': 20, '5+': 25 },
    financialCapacity: { limited: 10, adequate: 20, comfortable: 30, excellent: 35 }
  },
  
  usps: [
    'Graduate Route: 2 años para buscar trabajo post-Master',
    'Masters de solo 1 año',
    'Inglés académico de prestigio mundial',
    'NHS: Sistema de salud incluido con IHS',
    'Acceso a mercado laboral europeo ( cercano )'
  ],
  
  postStudyWork: {
    available: true,
    duration: '2-3 años',
    description: 'Graduate Route permite trabajar sin patrocinador. 2 años (Bachelor/Master), 3 años (PhD).'
  }
};
