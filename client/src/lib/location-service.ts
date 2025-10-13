export interface LocationData {
  city: string;
  state?: string;
  country: string;
  countryCode: string;
  formatted: string;
}

export interface PhotonFeature {
  type: string;
  properties: {
    osm_type: string;
    osm_id: number;
    osm_key: string;
    osm_value: string;
    type: string;
    countrycode: string;
    name: string;
    country: string;
    state?: string;
    city?: string;
    county?: string;
    district?: string;
    postcode?: string;
    street?: string;
    extent: number[];
  };
  geometry: {
    type: string;
    coordinates: [number, number];
  };
}

export interface PhotonResponse {
  type: string;
  features: PhotonFeature[];
}

class LocationService {
  private searchCache: Map<string, LocationData[]> = new Map();
  private readonly CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

  private readonly PHOTON_API_URL = 'https://photon.komoot.io/api';

  private getCountryFlag(countryCode: string): string {
    const flags: Record<string, string> = {
      US: '🇺🇸',
      CA: '🇨🇦',
      MX: '🇲🇽',
      GB: '🇬🇧',
      FR: '🇫🇷',
      DE: '🇩🇪',
      ES: '🇪🇸',
      IT: '🇮🇹',
      GR: '🇬🇷',
      NL: '🇳🇱',
      BE: '🇧🇪',
      CH: '🇨🇭',
      AT: '🇦🇹',
      PT: '🇵🇹',
      DK: '🇩🇰',
      SE: '🇸🇪',
      NO: '🇳🇴',
      FI: '🇫🇮',
      IE: '🇮🇪',
      IS: '🇮🇸',
      PL: '🇵🇱',
      CZ: '🇨🇿',
      HU: '🇭🇺',
      HR: '🇭🇷',
      TR: '🇹🇷',
      RU: '🇷🇺',
      JP: '🇯🇵',
      KR: '🇰🇷',
      CN: '🇨🇳',
      TH: '🇹🇭',
      IN: '🇮🇳',
      SG: '🇸🇬',
      MY: '🇲🇾',
      ID: '🇮🇩',
      PH: '🇵🇭',
      VN: '🇻🇳',
      KH: '🇰🇭',
      LK: '🇱🇰',
      NP: '🇳🇵',
      MM: '🇲🇲',
      LA: '🇱🇦',
      EG: '🇪🇬',
      AE: '🇦🇪',
      IL: '🇮🇱',
      JO: '🇯🇴',
      MA: '🇲🇦',
      ZA: '🇿🇦',
      KE: '🇰🇪',
      TZ: '🇹🇿',
      ET: '🇪🇹',
      AU: '🇦🇺',
      NZ: '🇳🇿',
      FJ: '🇫🇯',
      BR: '🇧🇷',
      AR: '🇦🇷',
      CL: '🇨🇱',
      PE: '🇵🇪',
      CO: '🇨🇴',
      EC: '🇪🇨',
      UY: '🇺🇾',
      BO: '🇧🇴',
      CR: '🇨🇷',
      PA: '🇵🇦',
      GT: '🇬🇹',
      BZ: '🇧🇿',
      JM: '🇯🇲',
      BB: '🇧🇧',
      DO: '🇩🇴',
      CU: '🇨🇺',
      MC: '🇲🇨',
      LU: '🇱🇺',
      MT: '🇲🇹',
      CY: '🇨🇾',
    };
    return flags[countryCode.toUpperCase()] || '🌍';
  }

  async searchLocations(query: string): Promise<LocationData[]> {
    if (query.length < 2) return [];

    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    if (this.searchCache.has(cacheKey)) {
      const cachedResult = this.searchCache.get(cacheKey)!;
      return cachedResult;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const url = `${this.PHOTON_API_URL}/?q=${encodeURIComponent(query)}&limit=10`;

      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to fetch locations');

      const data: PhotonResponse = await response.json();

      const results: LocationData[] = data.features
        .filter(
          feature =>
            // Only include places that are cities, towns, villages, or countries
            ['city', 'town', 'village', 'hamlet', 'suburb', 'quarter', 'neighbourhood'].includes(
              feature.properties.osm_value
            ) || feature.properties.osm_key === 'place'
        )
        .map(feature => {
          const props = feature.properties;

          // Determine the primary location name
          const locationName = props.name;
          let city = '';
          let state = '';
          const country = props.country || '';
          const countryCode = props.countrycode?.toUpperCase() || '';

          // Parse location hierarchy
          if (
            props.osm_value === 'city' ||
            props.osm_value === 'town' ||
            props.osm_value === 'village'
          ) {
            city = props.name;
            state = props.state || props.county || '';
          } else if (props.city) {
            city = props.city;
            state = props.state || props.county || '';
          }

          // Format the display string
          let formatted = locationName;
          if (city && state && country) {
            formatted = `${city}, ${state}, ${country}`;
          } else if (city && country) {
            formatted = `${city}, ${country}`;
          } else if (state && country) {
            formatted = `${state}, ${country}`;
          } else if (country) {
            formatted = country;
          }

          return {
            city: city,
            state: state,
            country: country,
            countryCode: countryCode,
            formatted: formatted,
          };
        })
        .filter(
          (location, index, array) =>
            // Remove duplicates
            array.findIndex(l => l.formatted === location.formatted) === index
        )
        .slice(0, 10);

      // Cache the results
      this.searchCache.set(cacheKey, results);

      // Clean up old cache entries
      if (this.searchCache.size > 100) {
        const oldestKey = this.searchCache.keys().next().value;
        if (oldestKey) {
          this.searchCache.delete(oldestKey);
        }
      }

      return results;
    } catch (error) {
      return [];
    }
  }

  formatLocation(data: Partial<LocationData>): string {
    const parts: string[] = [];

    if (data.city) parts.push(data.city);
    if (data.state) parts.push(data.state);
    if (data.country) parts.push(data.country);

    return parts.join(', ');
  }

  parseLocationString(locationString: string): Partial<LocationData> {
    const parts = locationString.split(',').map(part => part.trim());

    if (parts.length === 1) {
      // Just country
      return { country: parts[0], countryCode: '', formatted: parts[0] };
    } else if (parts.length === 2) {
      // City, Country
      return { city: parts[0], country: parts[1], countryCode: '', formatted: locationString };
    } else if (parts.length === 3) {
      // City, State, Country
      return {
        city: parts[0],
        state: parts[1],
        country: parts[2],
        countryCode: '',
        formatted: locationString,
      };
    }

    return {};
  }
}

export const locationService = new LocationService();
