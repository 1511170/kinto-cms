import type { JourneyBuilderData } from '../journey-builder-types';

export const italyData: JourneyBuilderData = {
  country: 'italy',
  countryName: 'Italia',
  countryCode: 'it',
  currency: 'EUR',
  currencySymbol: '€',
  whatsappNumber: '61449159849',
  
  workPermit: {
    hoursPerWeek: 20,
    notes: '20 horas/semana durante el curso, full-time en vacaciones oficiales',
    includedInVisa: true,
    vacationFullTime: true
  },
  
  // 5 CIUDADES principales:
  cities: [
    {
      id: 'rome',
      name: 'Roma',
      tagline: 'Historia Eterna',
      image: '/images/cities/city-rome.png',
      minWage: 8.50, // €/hora aprox
      avgRentWeekly: { min: 180, max: 280 }, // EUR, habitación compartida
      jobMarket: 'alta',
      livingCostIndex: 1.1,
      description: 'La Ciudad Eterna. Coliseo, Vaticano, historia en cada esquina.',
      highlights: ['Coliseo', 'Vaticano', 'La Dolce Vita', 'Historia viva']
    },
    {
      id: 'milan',
      name: 'Milán',
      tagline: 'Moda & Negocios',
      image: '/images/cities/city-milan.png',
      minWage: 8.50,
      avgRentWeekly: { min: 220, max: 340 },
      jobMarket: 'muy_alta',
      livingCostIndex: 1.25,
      description: 'Capital de la moda y finanzas. Gucci, Prada, y el Duomo.',
      highlights: ['Capital moda', 'Finanzas', 'Duomo', 'Design week']
    },
    {
      id: 'florence',
      name: 'Florencia',
      tagline: 'Cuna del Renacimiento',
      image: '/images/cities/city-florence.png',
      minWage: 8.50,
      avgRentWeekly: { min: 140, max: 220 },
      jobMarket: 'media',
      livingCostIndex: 0.95,
      description: 'Arte renacentista. Uffizi, David de Miguel Ángel, Toscana.',
      highlights: ['Uffizi', 'David', 'Toscana', 'Arte renacentista']
    },
    {
      id: 'bologna',
      name: 'Bolonia',
      tagline: 'Sabrosa & Estudiantil',
      image: '/images/cities/city-bologna.png',
      minWage: 8.50,
      avgRentWeekly: { min: 120, max: 190 },
      jobMarket: 'media-alta',
      livingCostIndex: 0.85,
      description: 'Ciudad universitaria. La universidad más antigua de Europa.',
      highlights: ['Uni. más antigua', 'Comida famosa', 'Arcos', 'Vida estudiantil']
    },
    {
      id: 'turin',
      name: 'Turín',
      tagline: 'Industria & Chocolate',
      image: '/images/cities/city-turin.png',
      minWage: 8.50,
      avgRentWeekly: { min: 110, max: 170 },
      jobMarket: 'alta',
      livingCostIndex: 0.8,
      description: 'Fiat, chocolates, primer capital de Italia. Elegante y subestimada.',
      highlights: ['Fiat & autos', 'Chocolate', 'Museo Egipcio', 'Elegante']
    }
  ],
  
  courses: [
    {
      id: 'italian-language',
      name: 'Italiano Intensivo',
      description: 'Aprende la lengua del arte, moda y gastronomía.',
      baseCostPerMonth: 480,
      minDuration: 4,
      maxDuration: 24
    },
    {
      id: 'fashion-design',
      name: 'Moda & Diseño',
      description: 'Diseño de moda en la cuna del estilo italiano.',
      baseCostPerMonth: 1200,
      minDuration: 6,
      maxDuration: 24,
      popular: true
    },
    {
      id: 'culinary-arts',
      name: 'Artes Culinarias',
      description: 'Cocina italiana auténtica. Pasta, pizza, alta cocina.',
      baseCostPerMonth: 800,
      minDuration: 3,
      maxDuration: 12
    },
    {
      id: 'art-history',
      name: 'Historia del Arte',
      description: 'Estudia en el país con más patrimonio UNESCO.',
      baseCostPerMonth: 600,
      minDuration: 6,
      maxDuration: 24
    }
  ],
  
  addons: [
    {
      id: 'work-permit',
      name: 'Permiso de Trabajo',
      description: 'Incluido - 20hrs/semana',
      icon: 'payments',
      cost: 0,
      included: true
    },
    {
      id: 'codice-fiscale',
      name: 'Código Fiscal',
      description: 'Número de identificación fiscal italiano',
      icon: 'badge',
      cost: 0,
      included: true
    },
    {
      id: 'permit-stay',
      name: 'Permesso di Soggiorno',
      description: 'Permiso de estancia para no-EU',
      icon: 'description',
      cost: 40,
      included: false
    },
    {
      id: 'shared-apartment',
      name: 'Apartamento Compartido',
      description: 'Habitación en piso compartido',
      icon: 'apartment',
      cost: (duration) => duration * 4.33 * 300,
      included: false
    },
    {
      id: 'airport-pickup',
      name: 'Recogida Aeropuerto',
      description: 'Te recibimos en FCO/MXP',
      icon: 'flight_land',
      cost: 60,
      included: false
    }
  ],
  
  visaCosts: {
    base: 50, // Visa tipo D
    medical: 0,
    insurance: 400 // Anual
  },
  
  visaFactors: {
    age: { '18-24': 25, '25-30': 20, '31-35': 15, '36-40': 10, '40+': 5 },
    englishLevel: { beginner: 10, intermediate: 20, advanced: 25, native: 30 },
    workExperience: { none: 5, 'less-than-1': 10, '1-3': 15, '3-5': 20, '5+': 25 },
    financialCapacity: { limited: 10, adequate: 20, comfortable: 30, excellent: 35 }
  },
  
  usps: [
    '55 sitios patrimonio UNESCO (más del mundo)',
    'Capital mundial de la moda',
    'Gastronomía incomparable',
    'Arte y historia en cada ciudad',
    'Acceso Schengen a 26 países'
  ],
  
  postStudyWork: {
    available: true,
    duration: '1 año',
    description: 'Permiso de búsqueda de empleo post-grado por 12 meses.'
  }
};
