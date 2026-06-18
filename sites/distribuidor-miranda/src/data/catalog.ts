export type Category = { id: string; label: string; count: number; blurb: string; code: string };
export type Application = { make: string; model: string; years: string };
export type Product = {
  id: string; catId: string; catLabel: string; name: string; code: string; sku: string;
  brand: string; price: number; oldPrice: number | null; side: string; stock: number;
  rating: number; reviews: number; applications: Application[]; accent: 'warm'|'cool'|'olive'|'steel';
};

export const CATEGORIES: Category[] = [
  { id: 'carroceria', label: 'Carrocería', count: 1248, code: 'PCH', blurb: 'Parachoques, guardafangos, capós y paneles listos para pintar.' },
  { id: 'iluminacion', label: 'Iluminación', count: 982, code: 'FRO', blurb: 'Faros, neblineros, stops, direccionales y bombillos.' },
  { id: 'refrigeracion', label: 'Refrigeración', count: 614, code: 'RAD', blurb: 'Radiadores, condensadores, electroventiladores e intercoolers.' },
  { id: 'espejos', label: 'Espejos', count: 327, code: 'RTV', blurb: 'Retrovisores eléctricos, manuales, cristales y cubiertas.' },
  { id: 'parrillas', label: 'Parrillas', count: 281, code: 'PRR', blurb: 'Mascarillas, parrillas, molduras y emblemas frontales.' },
  { id: 'accesorios', label: 'Accesorios', count: 196, code: 'ACC', blurb: 'Manijas, soportes, emblemas, tapas y misceláneos.' },
];

export const VEHICLE_MAKES = ['Chevrolet','Toyota','Hyundai','Kia','Nissan','Mazda','Ford','Volkswagen','Renault','Suzuki','Peugeot','Citroën','Great Wall','Chery','JAC','Mitsubishi'];
export const POPULAR_MODELS: Record<string, string[]> = {
  Chevrolet: ['Aveo','Sail','Spark','Onix','Cruze','D-Max','Captiva','Grand Vitara'],
  Toyota: ['Hilux','Corolla','Fortuner','4Runner','Yaris','Prado','RAV4','Hiace'],
  Hyundai: ['Tucson','Accent','Creta','i10','Elantra','Santa Fe','H1','Grand i10'],
  Kia: ['Sportage','Rio','Cerato','Picanto','Sorento','Soul','Stonic'],
  Nissan: ['Frontier','Sentra','Versa','Navara','March','Kicks','Qashqai'],
  Mazda: ['BT-50','CX-3','CX-5','3','6','CX-30'],
  Ford: ['Ranger','Explorer','Escape','EcoSport','F-150','Edge'],
  Volkswagen: ['Gol','Polo','Amarok','Jetta','Tiguan','Saveiro'],
};
export const PARTNER_BRANDS = [
  { name: 'TYG · Tong Yang', tag: 'Carrocería' },
  { name: 'DEPO Autolamp', tag: 'Iluminación' },
  { name: 'KOYO Cooling', tag: 'Refrigeración' },
  { name: 'NIPPARTS', tag: 'Mecánica' },
  { name: 'SAKURA Filtros', tag: 'Filtración' },
  { name: 'OSRAM', tag: 'Bombillos' },
];
const PARTS_BY_CAT: Record<string, [string,string][]> = {
  carroceria: [['Parachoques Delantero','PCH'], ['Parachoques Posterior','PCH'], ['Guardafango Izq.','GUA'], ['Guardafango Der.','GUA'], ['Capó','CAP'], ['Compuerta Trasera','CMP'], ['Panel de Puerta Del. Izq.','PPL'], ['Tapa de Cajón','TPC']],
  iluminacion: [['Faro Delantero Izq.','FRO'], ['Faro Delantero Der.','FRO'], ['Stop Posterior Izq.','STP'], ['Stop Posterior Der.','STP'], ['Neblinero Delantero','NEB'], ['Direccional Lateral','DIR'], ['Luz de Placa','LPL'], ['Tercera Luz de Stop','3LS']],
  refrigeracion: [['Radiador Motor','RAD'], ['Condensador A/C','CND'], ['Electroventilador Doble','EVT'], ['Intercooler','INT'], ['Depósito de Refrigerante','DRF'], ['Tapa de Radiador','TPR']],
  espejos: [['Retrovisor Eléctrico Izq.','RTV'], ['Retrovisor Manual Der.','RTV'], ['Espejo Interior','ESP'], ['Cristal de Retrovisor','CRT']],
  parrillas: [['Parrilla Frontal','PRR'], ['Mascarilla Cromada','MSC'], ['Moldura de Parrilla','MLD'], ['Emblema Frontal','EMB']],
  accesorios: [['Manija Exterior','MNJ'], ['Soporte de Parachoques','SOP'], ['Emblema Lateral','EMB'], ['Tapa de Combustible','TPC']],
};
const genSKU = (catId: string, idx: number) => `${catId.slice(0,3).toUpperCase()}-${String(2400 + idx * 17).padStart(5,'0')}`;
const priceFor = (catId: string, idx: number) => Math.max(8, ({ carroceria:145, iluminacion:89, refrigeracion:175, espejos:62, parrillas:110, accesorios:24 } as Record<string, number>)[catId] + (((idx * 37) % 41) - 20));
export const PRODUCTS: Product[] = (() => {
  const list: Product[] = []; let id = 1;
  Object.entries(PARTS_BY_CAT).forEach(([catId, items]) => items.forEach(([name, code], i) => {
    const cat = CATEGORIES.find(c => c.id === catId)!;
    const applications: Application[] = [];
    const makes = ['Chevrolet','Toyota','Hyundai','Kia','Nissan','Mazda','Ford','Volkswagen'];
    for (let k=0;k<4;k++) { const make=makes[(i*3+k)%makes.length]; const model=POPULAR_MODELS[make][(i+k)%POPULAR_MODELS[make].length]; const start=2014+((i+k)%6); applications.push({ make, model, years: `${start}–${start+4}` }); }
    const brand = ['TYG','DEPO','KOYO','NIPPARTS','SAKURA'][i % 5]; const price=priceFor(catId, i+id); const onSale=id%7===0;
    list.push({ id:`p${id}`, catId, catLabel:cat.label, name, code, sku:genSKU(catId,id), brand, price, oldPrice:onSale?Math.round(price*1.22):null, side:name.includes('Izq.')?'Izquierdo':name.includes('Der.')?'Derecho':'Único', stock:4+((id*11)%30), rating:4.2+((id*13)%8)/10, reviews:6+((id*7)%80), applications, accent:(['warm','cool','olive','steel'] as const)[id%4] }); id++;
  }));
  return list;
})();
export const getCategory = (id: string) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];
export const getProduct = (id: string) => PRODUCTS.find(p => p.id === id) || PRODUCTS[0];
export const getProductsByCategory = (id: string) => PRODUCTS.filter(p => p.catId === id);
export const formatPrice = (value: number) => `$${value.toFixed(2)}`;
