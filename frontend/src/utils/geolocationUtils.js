import api from '../services/api';

export const STANDARDIZED_COLORS = [
  { id: 'preto',    label: 'Preto'    },
  { id: 'branco',   label: 'Branco'   },
  { id: 'caramelo', label: 'Caramelo' },
  { id: 'cinza',    label: 'Cinza'    },
  { id: 'marrom',   label: 'Marrom'   },
  { id: 'amarelo',  label: 'Amarelo'  },
  { id: 'mesclado', label: 'Mesclado' },
  { id: 'rajado',   label: 'Rajado'   },
  { id: 'laranja',  label: 'Laranja'  },
  { id: 'tricolor', label: 'Tricolor' },
];

export const EMPTY_ADDRESS = {
  logradouro: '',
  numero: '',
  bairro: '',
  city: '',
  estado: '',
  cep: '',
};

function getPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export function getGeolocationErrorMessage(error) {
  const code = error?.code ?? error?.name;

  if (code === 1 || code === 'PERMISSION_DENIED') {
    return 'Permissão de localização negada. Ative nas configurações do navegador e recarregue a página.';
  }
  if (code === 2 || code === 'POSITION_UNAVAILABLE') {
    return 'Localização indisponível. Verifique se o GPS/Wi-Fi está ativo ou clique no mapa para marcar manualmente.';
  }
  if (code === 3 || code === 'TIMEOUT') {
    return 'Tempo esgotado ao buscar localização. Tente novamente ou marque no mapa.';
  }
  if (error?.message === 'INSECURE_CONTEXT') {
    return 'Geolocalização exige HTTPS ou localhost. Acesse via http://localhost:5173';
  }
  if (error?.message === 'UNSUPPORTED') {
    return 'Seu navegador não suporta geolocalização.';
  }
  return 'Não foi possível obter sua localização. Tente marcar no mapa.';
}

export async function getCurrentLocation() {
  if (!navigator.geolocation) {
    const err = new Error('UNSUPPORTED');
    throw err;
  }

  if (!window.isSecureContext) {
    const err = new Error('INSECURE_CONTEXT');
    throw err;
  }

  const strategies = [
    { enableHighAccuracy: true,  timeout: 12000, maximumAge: 0 },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 },
  ];

  let lastError;
  for (const options of strategies) {
    try {
      const { coords } = await getPosition(options);
      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      };
    } catch (err) {
      lastError = err;
      if (err.code === 1) throw err;
    }
  }

  throw lastError || new Error('POSITION_UNAVAILABLE');
}

export async function reverseGeocode(lat, lng) {
  const fallback = {
    ...EMPTY_ADDRESS,
    latitude: lat,
    longitude: lng,
    displayName: `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`,
  };

  try {
    const { data } = await api.get('/geocode/reverse', {
      params: { lat, lng },
      timeout: 12000,
    });

    const address = data?.data?.address;
    if (!address) return fallback;

    return {
      logradouro: address.logradouro || '',
      numero: address.numero || '',
      bairro: address.bairro || '',
      city: address.city || '',
      estado: address.estado || '',
      cep: address.cep || '',
      latitude: address.latitude ?? lat,
      longitude: address.longitude ?? lng,
      displayName: address.displayName || fallback.displayName,
    };
  } catch {
    return fallback;
  }
}

export async function getCurrentLocationAndAddress() {
  const coords = await getCurrentLocation();
  const address = await reverseGeocode(coords.latitude, coords.longitude);
  return {
    ...address,
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
  };
}

export function formatAddressLine(address) {
  if (!address) return '';
  const parts = [
    address.logradouro,
    address.numero ? `nº ${address.numero}` : '',
    address.bairro,
    address.city,
    address.estado,
  ].filter(Boolean);

  if (parts.length) return parts.join(', ');
  return address.displayName || '';
}
