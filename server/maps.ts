interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export class GoogleMapsService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY!;
    if (!this.apiKey) {
      throw new Error("GOOGLE_MAPS_API_KEY environment variable is required");
    }
  }

  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        
        return {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: result.formatted_address
        };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  async getDistanceMatrix(origins: string[], destinations: string[]): Promise<any> {
    try {
      const originsParam = origins.map(o => encodeURIComponent(o)).join('|');
      const destinationsParam = destinations.map(d => encodeURIComponent(d)).join('|');
      
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsParam}&destinations=${destinationsParam}&units=imperial&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Distance matrix error:', error);
      return null;
    }
  }
}

export const mapsService = new GoogleMapsService();