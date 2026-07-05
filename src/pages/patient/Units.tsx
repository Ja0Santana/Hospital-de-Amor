import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';

import { UNITS_DATA, SPECIALTIES } from '../../components/patient/units/constants';
import GeolocSuggestion from '../../components/patient/units/GeolocSuggestion';
import UnitsFilterPanel from '../../components/patient/units/UnitsFilterPanel';
import UnitCard from '../../components/patient/units/UnitCard';

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

  const cities = Array.from(new Set(UNITS_DATA.map((u) => u.city))).sort();

  useEffect(() => {
    if ('geolocation' in navigator) {
      setGeoStatus('prompting');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
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
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getProcessedUnits = () => {
    let list = [...UNITS_DATA];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
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
        distance: getDistance(userCoords.lat, userCoords.lng, u.lat, u.lng),
      }));
      return listWithDistance.sort((a, b) => a.distance - b.distance);
    }

    return list.sort((a, b) => {
      if (a.state !== b.state) return a.state.localeCompare(b.state);
      return a.name.localeCompare(b.name);
    });
  };

  const processedUnits = getProcessedUnits();

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-6 text-left">
      <div>
        <Button
          variant="link"
          onClick={() => onNavigate('dashboard')}
          className="text-primary p-0 h-auto font-semibold mb-2"
        >
          ← Voltar ao Início
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
          Nossas Unidades
        </h1>
        <p className="text-zinc-500 mt-1">
          Localize filiais de Prevenção, Tratamento e Reabilitação do Hospital de Amor em todo o Brasil.
        </p>
      </div>

      <GeolocSuggestion geoStatus={geoStatus} />

      <UnitsFilterPanel
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        filterCity={filterCity}
        setFilterCity={setFilterCity}
        filterSpecialty={filterSpecialty}
        setFilterSpecialty={setFilterSpecialty}
        cities={cities}
        specialties={SPECIALTIES}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {processedUnits.map((unit, index) => {
          const isClosest = userCoords !== null && index === 0;
          return <UnitCard key={unit.id} unit={unit} isClosest={isClosest} />;
        })}
      </div>
    </div>
  );
}
