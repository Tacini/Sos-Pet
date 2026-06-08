const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'SOS-Pet/1.0 (lost-pet-app; localhost-dev)';

const BRAZIL_STATE_NAMES = {
  acre: 'AC', alagoas: 'AL', amapá: 'AP', amapa: 'AP', amazonas: 'AM',
  bahia: 'BA', ceará: 'CE', ceara: 'CE', 'distrito federal': 'DF',
  'espírito santo': 'ES', 'espirito santo': 'ES', goiás: 'GO', goias: 'GO',
  maranhão: 'MA', maranhao: 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS',
  'minas gerais': 'MG', pará: 'PA', para: 'PA', paraíba: 'PB', paraiba: 'PB',
  paraná: 'PR', parana: 'PR', pernambuco: 'PE', piauí: 'PI', piaui: 'PI',
  'rio de janeiro': 'RJ', 'rio grande do norte': 'RN', 'rio grande do sul': 'RS',
  rondônia: 'RO', rondonia: 'RO', roraima: 'RR', 'santa catarina': 'SC',
  'são paulo': 'SP', 'sao paulo': 'SP', sergipe: 'SE', tocantins: 'TO',
};

function normalizeEstado(raw) {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  if (/^BR-[A-Z]{2}$/i.test(trimmed)) return trimmed.split('-')[1].toUpperCase();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return BRAZIL_STATE_NAMES[trimmed.toLowerCase()] || trimmed;
}

function parseNominatimAddress(addr, lat, lng) {
  const logradouro =
    addr.road || addr.pedestrian || addr.footway || addr.street || addr.residential || '';
  const numero = addr.house_number || '';
  const bairro =
    addr.suburb || addr.neighbourhood || addr.quarter || addr.district ||
    addr.city_district || addr.hamlet || '';
  const city =
    addr.city || addr.town || addr.village || addr.municipality ||
    addr.county || addr.state_district || '';
  const estado = normalizeEstado(addr['ISO3166-2-lvl4'] || addr.state || '');
  const cep = (addr.postcode || '').replace(/\D/g, '');

  return {
    logradouro,
    numero,
    bairro,
    city,
    estado,
    cep,
    latitude: parseFloat(lat),
    longitude: parseFloat(lng),
    displayName: [logradouro, numero && `nº ${numero}`, bairro, city, estado]
      .filter(Boolean)
      .join(', '),
  };
}

class GeocodeController {
  static async reverse(req, res, next) {
    try {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return res.status(400).json({
          success: false,
          message: 'Coordenadas inválidas. Informe lat e lng.',
        });
      }

      const url = new URL(`${NOMINATIM_BASE}/reverse`);
      url.searchParams.set('lat', String(lat));
      url.searchParams.set('lon', String(lng));
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('accept-language', 'pt-BR');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'pt-BR',
        },
      });

      if (!response.ok) {
        return res.status(502).json({
          success: false,
          message: 'Serviço de endereço temporariamente indisponível.',
        });
      }

      const data = await response.json();
      const address = parseNominatimAddress(data.address || {}, lat, lng);

      if (!address.displayName) {
        address.displayName = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }

      res.json({ success: true, data: { address } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = GeocodeController;
