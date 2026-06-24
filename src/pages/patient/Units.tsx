import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Heart, Activity, RefreshCw, Search, MapPin, Compass, AlertCircle } from 'lucide-react';

interface Unit {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  types: ('Prevenção' | 'Tratamento' | 'Reabilitação')[];
  address: string;
  phone: string;
  hours: string;
  specialties: string[];
}

const UNITS_DATA: Unit[] = [
  {
    id: 'unit-barretos',
    name: 'Hospital de Amor Barretos',
    city: 'Barretos',
    state: 'SP',
    lat: -20.5570,
    lng: -48.5678,
    types: ['Prevenção', 'Tratamento', 'Reabilitação'],
    address: 'Rua Antenor Duarte Villela, 1331 - Dr. Paulo Prata',
    phone: '(17) 3321-6600',
    hours: 'Segunda a Sexta, 07:00 às 17:00',
    specialties: ['Oncologia', 'Mastologia', 'Radiologia', 'Ginecologia']
  },
  {
    id: 'unit-lagarto',
    name: 'Hospital de Amor Lagarto',
    city: 'Lagarto',
    state: 'SE',
    lat: -10.9161,
    lng: -37.6534,
    types: ['Prevenção', 'Tratamento'],
    address: 'Rodovia Lourival Baptista, s/n - Centro',
    phone: '(79) 3631-9300',
    hours: 'Segunda a Sexta, 07:00 às 17:00',
    specialties: ['Mastologia', 'Ginecologia']
  },
  {
    id: 'unit-portovelho',
    name: 'Hospital de Amor Amazônia',
    city: 'Porto Velho',
    state: 'RO',
    lat: -8.7612,
    lng: -63.9039,
    types: ['Prevenção', 'Tratamento', 'Reabilitação'],
    address: 'BR-364, Km 17 - Rural',
    phone: '(69) 3219-4900',
    hours: 'Segunda a Sexta, 07:00 às 17:00',
    specialties: ['Oncologia', 'Radiologia', 'Ginecologia']
  },
  {
    id: 'unit-jales',
    name: 'Hospital de Amor Jales',
    city: 'Jales',
    state: 'SP',
    lat: -20.2689,
    lng: -50.5458,
    types: ['Tratamento'],
    address: 'Avenida Francisco Jalles, 3737 - Jardim Estados Unidos',
    phone: '(17) 3624-3900',
    hours: 'Segunda a Sexta, 07:00 às 17:00',
    specialties: ['Oncologia', 'Mastologia']
  },
  {
    id: 'unit-fernandopolis',
    name: 'Hospital de Amor Fernandópolis',
    city: 'Fernandópolis',
    state: 'SP',
    lat: -20.2831,
    lng: -50.2475,
    types: ['Prevenção'],
    address: 'Avenida Litério Greco, 300 - Vila Neves',
    phone: '(17) 3465-4300',
    hours: 'Segunda a Sexta, 07:00 às 17:00',
    specialties: ['Mastologia', 'Ginecologia']
  },
  {
    id: 'unit-palmas',
    name: 'Hospital de Amor Palmas',
    city: 'Palmas',
    state: 'TO',
    lat: -10.2128,
    lng: -48.3603,
    types: ['Prevenção', 'Tratamento'],
    address: 'Quadra Arso 111, Alameda 19, s/n - Plano Diretor Sul',
    phone: '(63) 3218-4900',
    hours: 'Segunda a Sexta, 07:00 às 17:00',
    specialties: ['Oncologia', 'Ginecologia']
  },
  {
    id: 'unit-goiania',
    name: 'Hospital de Amor Goiânia',
    city: 'Goiânia',
    state: 'GO',
    lat: -16.6869,
    lng: -49.2648,
    types: ['Tratamento'],
    address: 'Avenida Leste-Oeste, 3212 - Setor Marechal Rondon',
    phone: '(62) 3416-2600',
    hours: 'Segunda a Sexta, 07:00 às 17:00',
    specialties: ['Oncologia', 'Radiologia']
  },
  {
    id: 'unit-campogrande',
    name: 'Hospital de Amor Campo Grande',
    city: 'Campo Grande',
    state: 'MS',
    lat: -20.4697,
    lng: -54.6201,
    types: ['Prevenção'],
    address: 'Avenida Aero Clube, 140 - Vila Sobrinho',
    phone: '(67) 3304-6600',
    hours: 'Segunda a Sexta, 07:00 às 17:00',
    specialties: ['Mastologia', 'Radiologia']
  },
  {
    id: 'unit-juazeiro',
    name: 'Hospital de Amor Juazeiro',
    city: 'Juazeiro',
    state: 'BA',
    lat: -9.4116,
    lng: -40.5034,
    types: ['Prevenção'],
    address: 'Rodovia Lomanto Júnior, s/n - João XXIII',
    phone: '(74) 3614-9100',
    hours: 'Segunda a Sexta, 07:00 às 17:00',
    specialties: ['Ginecologia']
  },
  {
    id: 'unit-campinagrande',
    name: 'Hospital de Amor Campina Grande',
    city: 'Campina Grande',
    state: 'PB',
    lat: -7.2306,
    lng: -35.8811,
    types: ['Prevenção'],
    address: 'Rua Pedro I, 550 - Centro',
    phone: '(83) 3310-4400',
    hours: 'Segunda a Sexta, 07:00 às 17:00',
    specialties: ['Mastologia', 'Ginecologia']
  },
  {
    id: 'unit-macapa',
    name: 'Hospital de Amor Macapá',
    city: 'Macapá',
    state: 'AP',
    lat: 0.0389,
    lng: -51.0664,
    types: ['Prevenção'],
    address: 'Rodovia Duca Serra, Km 4 - Cabralzinho',
    phone: '(96) 3131-2900',
    hours: 'Segunda a Sexta, 07:00 às 17:00',
    specialties: ['Mastologia']
  },
  {
    id: 'unit-boavista',
    name: 'Hospital de Amor Boa Vista',
    city: 'Boa Vista',
    state: 'RR',
    lat: 2.8235,
    lng: -60.6758,
    types: ['Prevenção'],
    address: 'Avenida Via das Flores, 2035 - Pricumã',
    phone: '(95) 3621-1500',
    hours: 'Segunda a Sexta, 07:00 às 17:00',
    specialties: ['Ginecologia']
  },
  {
    id: 'unit-riobranco',
    name: 'Hospital de Amor Rio Branco',
    city: 'Rio Branco',
    state: 'AC',
    lat: -9.9749,
    lng: -67.8076,
    types: ['Prevenção'],
    address: 'Via Verde, 120 - Distrito Industrial',
    phone: '(68) 3215-4600',
    hours: 'Segunda a Sexta, 07:00 às 17:00',
    specialties: ['Mastologia', 'Radiologia']
  },
  {
    id: 'unit-araguaina',
    name: 'Hospital de Amor Araguaína',
    city: 'Araguaína',
    state: 'TO',
    lat: -7.1895,
    lng: -48.2078,
    types: ['Prevenção', 'Reabilitação'],
    address: 'Avenida Filadélfia, s/n - Setor Oeste',
    phone: '(63) 3411-8900',
    hours: 'Segunda a Sexta, 07:00 às 17:00',
    specialties: ['Oncologia', 'Mastologia']
  },
  {
    id: 'unit-unai',
    name: 'Hospital de Amor Unaí',
    city: 'Unaí',
    state: 'MG',
    lat: -16.3575,
    lng: -46.9064,
    types: ['Prevenção'],
    address: 'Rua Prefeito João Costa, 450 - Centro',
    phone: '(38) 3677-7400',
    hours: 'Segunda a Sexta, 07:00 às 17:00',
    specialties: ['Ginecologia']
  },
  {
    id: 'unit-patrocinio',
    name: 'Hospital de Amor Patrocínio',
    city: 'Patrocínio',
    state: 'MG',
    lat: -18.9431,
    lng: -46.9995,
    types: ['Prevenção'],
    address: 'Avenida João Alves do Nascimento, 1000 - Centro',
    phone: '(34) 3831-2900',
    hours: 'Segunda a Sexta, 07:00 às 17:00',
    specialties: ['Mastologia', 'Ginecologia']
  }
];

interface UnitsProps {
  onNavigate: (page: string) => void;
}

export default function Units({ onNavigate }: UnitsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('Todos');
  const [filterCity, setFilterCity] = useState<string>('Todas');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('Todas');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'prompting' | 'granted' | 'denied' | 'error'>('idle');

  const cities = Array.from(new Set(UNITS_DATA.map(u => u.city))).sort();
  const specialties = ['Oncologia', 'Mastologia', 'Radiologia', 'Ginecologia'];

  useEffect(() => {
    if ('geolocation' in navigator) {
      setGeoStatus('prompting');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGeoStatus('granted');
        },
        (error) => {
          console.error(error);
          setGeoStatus(error.code === 1 ? 'denied' : 'error');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGeoStatus('error');
    }
  }, []);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getProcessedUnits = () => {
    let list = [...UNITS_DATA];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((u) => 
        u.name.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q) ||
        u.state.toLowerCase().includes(q) ||
        u.address.toLowerCase().includes(q)
      );
    }

    if (filterType !== 'Todos') {
      list = list.filter((u) => u.types.includes(filterType as any));
    }

    if (filterCity !== 'Todas') {
      list = list.filter((u) => u.city === filterCity);
    }

    if (filterSpecialty !== 'Todas') {
      list = list.filter((u) => u.specialties.includes(filterSpecialty));
    }

    if (userCoords) {
      const listWithDistance = list.map((u) => ({
        ...u,
        distance: getDistance(userCoords.lat, userCoords.lng, u.lat, u.lng)
      }));
      return listWithDistance.sort((a, b) => a.distance - b.distance);
    }

    return list.sort((a, b) => {
      if (a.state !== b.state) return a.state.localeCompare(b.state);
      return a.name.localeCompare(b.name);
    });
  };

  const processedUnits = getProcessedUnits();

  const getBadgeStyle = (type: 'Prevenção' | 'Tratamento' | 'Reabilitação') => {
    const styles = {
      'Prevenção': 'bg-pink-100 text-pink-850 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400',
      'Tratamento': 'bg-blue-100 text-blue-850 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400',
      'Reabilitação': 'bg-emerald-100 text-emerald-850 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400'
    };
    return styles[type];
  };

  const getTypeIcon = (type: 'Prevenção' | 'Tratamento' | 'Reabilitação') => {
    if (type === 'Prevenção') return <Heart className="w-3 h-3 mr-1 shrink-0" />;
    if (type === 'Tratamento') return <Activity className="w-3 h-3 mr-1 shrink-0" />;
    return <RefreshCw className="w-3 h-3 mr-1 shrink-0 animate-spin-slow" />;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-6 text-left">
      <div>
        <Button variant="link" onClick={() => onNavigate('dashboard')} className="text-primary p-0 h-auto font-semibold mb-2">
          ← Voltar ao Início
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">Nossas Unidades</h1>
        <p className="text-zinc-500 mt-1">Localize filiais de Prevenção, Tratamento e Reabilitação do Hospital de Amor em todo o Brasil.</p>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 rounded-full text-primary shrink-0 shadow-sm">
            <Compass className={`w-6 h-6 ${geoStatus === 'prompting' ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Sugestão de Geolocalização</h4>
            <p className="text-[11px] text-zinc-500 leading-normal max-w-md mt-0.5">
              {geoStatus === 'granted' && 'Localização ativada! As unidades estão ordenadas pela distância real até a sua posição atual.'}
              {geoStatus === 'prompting' && 'Solicitando autorização de geolocalização no seu dispositivo...'}
              {geoStatus === 'denied' && 'Acesso à localização foi recusado. Ative as permissões no navegador para identificar a unidade mais próxima de você.'}
              {geoStatus === 'error' && 'Não foi possível detectar sua localização atual. A lista está exibindo a ordenação padrão por Estado.'}
              {geoStatus === 'idle' && 'Verificando serviços de geolocalização...'}
            </p>
          </div>
        </div>
        {geoStatus === 'denied' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border border-yellow-250/50 dark:border-yellow-900/30 rounded-xl text-[10px] font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            Permissão de Localização Desativada
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Input
            id="unit-search"
            type="text"
            placeholder="Buscar por nome, cidade ou estado (UF)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 border-zinc-200 dark:border-zinc-800 rounded-xl"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
        </div>
        <div className="flex flex-wrap gap-2.5 w-full lg:w-auto justify-start sm:justify-end shrink-0">
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 shrink-0">
            {['Todos', 'Prevenção', 'Tratamento', 'Reabilitação'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 ${
                  filterType === t
                    ? 'bg-primary border-primary text-white shadow-sm'
                    : 'bg-white border-zinc-200 text-zinc-650 hover:border-primary/20 dark:bg-zinc-950 dark:border-zinc-850 dark:text-zinc-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="h-9 px-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-xs font-semibold focus-visible:outline-none text-zinc-700 dark:text-zinc-300 cursor-pointer"
          >
            <option value="Todas">Todas as Cidades</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="h-9 px-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-xs font-semibold focus-visible:outline-none text-zinc-700 dark:text-zinc-300 cursor-pointer"
          >
            <option value="Todas">Todas as Especialidades</option>
            {specialties.map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {processedUnits.map((unit, index) => {
          const isClosest = userCoords && index === 0;
          return (
            <Card 
              key={unit.id} 
              className={`border-zinc-200/80 dark:border-zinc-850 hover:border-zinc-350 dark:hover:border-zinc-750 transition-all rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 flex flex-col justify-between shadow-xs ${
                isClosest ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-zinc-950' : ''
              }`}
            >
              <div>
                <CardHeader className="p-5 pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{unit.state} • {unit.city}</span>
                    {isClosest && (
                      <Badge className="bg-primary text-white font-bold text-[8px] px-1.5 py-0.5 tracking-wider uppercase animate-pulse">
                        Mais Próxima
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base font-extrabold text-zinc-800 dark:text-zinc-100 mt-1 leading-snug">
                    {unit.name}
                  </CardTitle>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {unit.types.map((type) => (
                      <Badge key={type} className={`${getBadgeStyle(type)} text-[8px] font-bold px-1.5 py-0.5 border flex items-center`}>
                        {getTypeIcon(type)}
                        {type}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {unit.specialties.map((spec) => (
                      <span key={spec} className="px-2 py-0.5 bg-zinc-150/40 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 rounded-lg text-[8px] font-black border border-zinc-200/20">
                        {spec}
                      </span>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0 pb-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-3">
                  <p className="flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{unit.address}</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-2 border-t border-zinc-100 dark:border-zinc-900">
                    <div>
                      <span className="text-zinc-400 font-bold block">TELEFONE</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{unit.phone}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 font-bold block">HORÁRIO</span>
                      <span className="font-semibold text-zinc-850 dark:text-zinc-200 leading-tight block">{unit.hours}</span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-5 pt-0 border-t border-zinc-100/50 dark:border-zinc-900/50 flex flex-col gap-2 bg-zinc-50/50 dark:bg-zinc-900/5">
                {unit.hasOwnProperty('distance') && (
                  <div className="text-center py-2 bg-primary/5 text-primary rounded-xl text-xs font-bold mt-3">
                    A cerca de {Math.round((unit as any).distance)} km de você
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${unit.lat},${unit.lng}`, '_blank')}
                    className="flex-1 h-9 text-xs font-semibold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  >
                    Google Maps
                  </Button>
                  <Button
                    type="button"
                    onClick={() => window.open(`https://waze.com/ul?ll=${unit.lat},${unit.lng}&navigate=yes`, '_blank')}
                    className="flex-1 h-9 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900"
                  >
                    Waze
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
