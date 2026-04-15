'use client';

import L, { type DivIcon, type LatLngLiteral } from 'leaflet';
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  TileLayer,
  Tooltip,
  useMapEvents
} from 'react-leaflet';

type AllowedCity = {
  key: string;
  label: string;
  latitude: number;
  longitude: number;
  radius: number; // en kilomètres
};

type Props = {
  value: {
    address: string;
    latitude: number | null;
    longitude: number | null;
  };
  onChange: (value: {
    address: string;
    latitude: number;
    longitude: number;
    cityKey: string;
  }) => void;
  allowedCities: AllowedCity[];
};

type NeighborhoodLabel = {
  cityKey: string;
  name: string;
  latitude: number;
  longitude: number;
};

type CityLabel = {
  cityKey: string;
  name: string;
  latitude: number;
  longitude: number;
};

const defaultCenter: LatLngLiteral = { lat: 31.7917, lng: -7.0926 };

const MOROCCO_FULL_BOUNDS: [[number, number], [number, number]] = [
  [19.8, -17.8],
  [36.4, -0.6]
];

/**
 * Polygone volontairement simplifié du Maroc continental
 * pour créer le masque "hors Maroc".
 */
const MOROCCO_RING: [number, number][] = [
  [35.92, -5.95],
  [35.78, -5.55],
  [35.62, -5.32],
  [35.35, -5.22],
  [35.07, -5.35],
  [34.82, -5.85],
  [34.64, -6.25],
  [34.45, -6.72],
  [34.18, -7.18],
  [33.95, -7.58],
  [33.74, -7.84],
  [33.46, -8.18],
  [33.16, -8.62],
  [32.82, -8.92],
  [32.42, -9.36],
  [31.98, -9.78],
  [31.45, -10.2],
  [30.98, -10.58],
  [30.44, -10.94],
  [29.96, -11.18],
  [29.36, -11.34],
  [28.78, -11.48],
  [28.18, -11.8],
  [27.55, -12.2],
  [26.9, -12.9],
  [26.15, -13.5],
  [25.4, -14.1],
  [24.7, -14.7],
  [23.95, -15.35],
  [23.25, -15.95],
  [22.5, -16.45],
  [21.75, -16.9],
  [20.95, -17.1],
  [21.35, -16.1],
  [22.2, -15.0],
  [23.3, -13.9],
  [24.5, -12.9],
  [25.7, -11.9],
  [26.7, -10.95],
  [27.58, -9.58],
  [27.76, -8.92],
  [28.06, -8.34],
  [28.36, -7.84],
  [28.74, -7.26],
  [29.15, -6.82],
  [29.62, -6.25],
  [30.12, -5.76],
  [30.72, -5.18],
  [31.34, -4.56],
  [31.94, -3.86],
  [32.54, -3.18],
  [33.06, -2.58],
  [33.54, -2.02],
  [34.1, -1.68],
  [34.74, -1.46],
  [35.24, -1.62],
  [35.56, -2.18],
  [35.78, -3.02],
  [35.92, -4.08],
  [35.96, -5.08],
  [35.92, -5.95]
];

const WORLD_RING: [number, number][] = [
  [90, -180],
  [90, 180],
  [-90, 180],
  [-90, -180]
];

const CITY_LABELS: CityLabel[] = [
  { cityKey: 'casablanca', name: 'Casablanca', latitude: 33.5731, longitude: -7.5898 },
  { cityKey: 'marrakech', name: 'Marrakech', latitude: 31.6295, longitude: -7.9811 },
  { cityKey: 'tanger', name: 'Tanger', latitude: 35.7595, longitude: -5.834 },
  { cityKey: 'rabat', name: 'Rabat', latitude: 34.0209, longitude: -6.8416 },
  { cityKey: 'fes', name: 'Fès', latitude: 34.0331, longitude: -5.0003 },
  { cityKey: 'agadir', name: 'Agadir', latitude: 30.4278, longitude: -9.5981 },
  { cityKey: 'oujda', name: 'Oujda', latitude: 34.6814, longitude: -1.9086 },
    { cityKey: 'dakhla', name: 'Dakhla', latitude: 23.6848, longitude: -15.9570 },
];

const NEIGHBORHOOD_LABELS: NeighborhoodLabel[] = [
  { cityKey: 'casablanca', name: 'Maarif', latitude: 33.5865, longitude: -7.6322 },
  { cityKey: 'casablanca', name: 'Gauthier', latitude: 33.5905, longitude: -7.6215 },
  { cityKey: 'casablanca', name: 'Aïn Diab', latitude: 33.6006, longitude: -7.6834 },
  { cityKey: 'casablanca', name: 'Sidi Maarouf', latitude: 33.5358, longitude: -7.6401 },

  { cityKey: 'marrakech', name: 'Guéliz', latitude: 31.6346, longitude: -8.0104 },
  { cityKey: 'marrakech', name: 'Hivernage', latitude: 31.6218, longitude: -8.0158 },
  { cityKey: 'marrakech', name: 'Sidi Ghanem', latitude: 31.6592, longitude: -8.0258 },

  { cityKey: 'tanger', name: 'Malabata', latitude: 35.7747, longitude: -5.7736 },
  { cityKey: 'tanger', name: 'Marshan', latitude: 35.7922, longitude: -5.8212 },
  { cityKey: 'tanger', name: 'Iberia', latitude: 35.7808, longitude: -5.8074 },

  { cityKey: 'rabat', name: 'Agdal', latitude: 33.9967, longitude: -6.8525 },
  { cityKey: 'rabat', name: 'Hassan', latitude: 34.0278, longitude: -6.8227 },
  { cityKey: 'rabat', name: 'Hay Riad', latitude: 33.9796, longitude: -6.8765 },

  { cityKey: 'fes', name: 'Ville Nouvelle', latitude: 34.0437, longitude: -5.003 },
  { cityKey: 'fes', name: 'Narjiss', latitude: 33.9972, longitude: -4.9892 },
  { cityKey: 'fes', name: 'Atlas', latitude: 34.0286, longitude: -4.9922 },

  { cityKey: 'agadir', name: 'Talborjt', latitude: 30.42, longitude: -9.5952 },
  { cityKey: 'agadir', name: 'Founty', latitude: 30.4015, longitude: -9.6188 },
  { cityKey: 'agadir', name: 'Haut Founty', latitude: 30.4056, longitude: -9.609 },

  { cityKey: 'oujda', name: 'Centre-ville', latitude: 34.6819, longitude: -1.9077 },
  { cityKey: 'oujda', name: 'Lazaret', latitude: 34.6994, longitude: -1.8908 },
  { cityKey: 'oujda', name: 'Hay Al Qods', latitude: 34.6652, longitude: -1.9239 }
];

const selectedPointIcon: DivIcon = L.divIcon({
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  html: `
    <div style="
      width: 26px;
      height: 26px;
      border-radius: 999px;
      background: #73B8FF;
      border: 3px solid rgba(255,255,255,0.92);
      box-shadow: 0 0 0 8px rgba(115,184,255,0.22);
      position: relative;
    ">
      <div style="
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #111827;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      "></div>
    </div>
  `
});

function makeCirclePolygon(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  points = 48
): [number, number][] {
  const coordinates: [number, number][] = [];
  const earthRadiusKm = 6371;

  for (let i = 0; i < points; i += 1) {
    const bearing = (2 * Math.PI * i) / points;
    const lat1 = (centerLat * Math.PI) / 180;
    const lng1 = (centerLng * Math.PI) / 180;
    const angularDistance = radiusKm / earthRadiusKm;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance) +
        Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
    );

    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
        Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
      );

    coordinates.push([(lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI]);
  }

  return coordinates;
}

function ClickHandler({
  onSelect,
  allowedCities
}: {
  onSelect: (value: {
    address: string;
    latitude: number;
    longitude: number;
    cityKey: string;
  }) => void;
  allowedCities: AllowedCity[];
}) {
  useMapEvents({
    click(e) {
      const clicked = L.latLng(e.latlng.lat, e.latlng.lng);

      let matchedCity: AllowedCity | null = null;

      for (const city of allowedCities) {
        const cityCenter = L.latLng(city.latitude, city.longitude);
        const distanceInMeters = clicked.distanceTo(cityCenter);

        if (distanceInMeters <= city.radius * 1000) {
          matchedCity = city;
          break;
        }
      }

      if (!matchedCity) {
        return;
      }

      onSelect({
        address: matchedCity.label,
        latitude: clicked.lat,
        longitude: clicked.lng,
        cityKey: matchedCity.key
      });
    }
  });

  return null;
}

function ZoomAwareReferenceLabels() {
  const map = useMapEvents({
    zoomend: () => {
      map.invalidateSize();
    }
  });

  const zoom = map.getZoom();

  if (zoom < 11) {
    return null;
  }

  return (
    <TileLayer
      attribution=""
      url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
      opacity={0.95}
      zIndex={650}
      updateWhenZooming={false}
      updateWhenIdle
    />
  );
}

function ZoomAwareLabels({
  allowedCities
}: {
  allowedCities: AllowedCity[];
}) {
  const map = useMapEvents({
    zoomend: () => {
      map.invalidateSize();
    }
  });

  const zoom = map.getZoom();
  const showCityLabels = zoom < 8.6;
  const showNeighborhoods = zoom >= 8.6 && zoom < 11;

  const PASSIVE_CITY_KEYS = ['dakhla'];

  const visibleCities = CITY_LABELS.filter(
    (item) =>
      allowedCities.some((city) => city.key === item.cityKey) ||
      PASSIVE_CITY_KEYS.includes(item.cityKey)
  );

  const visibleNeighborhoods = NEIGHBORHOOD_LABELS.filter((item) =>
    allowedCities.some((city) => city.key === item.cityKey)
  );

  return (
    <>
      {showCityLabels &&
        visibleCities.map((item) => (
          <Marker
            key={`city-${item.cityKey}`}
            position={[item.latitude, item.longitude]}
            interactive={false}
            icon={L.divIcon({
              className: '',
              iconSize: [120, 24],
              iconAnchor: [60, 12],
              html: `
                <div style="
                  color: rgba(255,255,255,0.92);
                  font-size: 15px;
                  font-weight: 700;
                  letter-spacing: 0.01em;
                  text-shadow:
                    0 1px 2px rgba(0,0,0,0.75),
                    0 0 10px rgba(0,0,0,0.45);
                  white-space: nowrap;
                  text-align: center;
                  pointer-events: none;
                ">
                  ${item.name}
                </div>
              `
            })}
          />
        ))}

      {showNeighborhoods &&
        visibleNeighborhoods.map((item) => (
          <Marker
            key={`neighborhood-${item.cityKey}-${item.name}`}
            position={[item.latitude, item.longitude]}
            interactive={false}
            icon={L.divIcon({
              className: '',
              iconSize: [110, 20],
              iconAnchor: [55, 10],
              html: `
                <div style="
                  color: rgba(255,255,255,0.88);
                  font-size: 12px;
                  font-weight: 600;
                  letter-spacing: 0.01em;
                  text-shadow:
                    0 1px 2px rgba(0,0,0,0.7),
                    0 0 8px rgba(0,0,0,0.4);
                  white-space: nowrap;
                  text-align: center;
                  pointer-events: none;
                ">
                  ${item.name}
                </div>
              `
            })}
          />
        ))}
    </>
  );
}

function AttributionStyler() {
  useMapEvents({
    load: () => {
      const styleId = 'hire-map-attribution-style';
      if (document.getElementById(styleId)) return;

      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .leaflet-control-attribution {
          right: 8px !important;
          bottom: 8px !important;
          background: linear-gradient(
            180deg,
            rgba(10,14,24,0.52) 0%,
            rgba(10,14,24,0.78) 100%
          ) !important;
          color: rgba(255,255,255,0.38) !important;
          border-radius: 999px !important;
          padding: 3px 8px !important;
          font-size: 9px !important;
          line-height: 1.1 !important;
          letter-spacing: 0.01em !important;
          box-shadow: 0 6px 20px rgba(0,0,0,0.18) !important;
          border: 1px solid rgba(255,255,255,0.05) !important;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          max-width: 180px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .leaflet-control-attribution a {
          color: rgba(255,255,255,0.46) !important;
          text-decoration: none !important;
          transition: color .2s ease;
        }

        .leaflet-control-attribution a:hover {
          color: rgba(255,255,255,0.68) !important;
        }

        .leaflet-control-zoom {
          border: none !important;
          box-shadow: none !important;
          margin-right: 12px !important;
          margin-top: 12px !important;
        }

        .leaflet-control-zoom a {
          background: rgba(10,14,24,0.82) !important;
          color: rgba(255,255,255,0.82) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          width: 34px !important;
          height: 34px !important;
          line-height: 32px !important;
          border-radius: 12px !important;
          margin-bottom: 8px !important;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          font-size: 18px !important;
          font-weight: 500 !important;
        }

        .leaflet-control-zoom a:hover {
          background: rgba(18,24,38,0.94) !important;
          color: rgba(255,255,255,0.96) !important;
        }

        .leaflet-top.leaflet-right .leaflet-control {
          margin-right: 12px !important;
        }
      `;
      document.head.appendChild(style);
    }
  });

  return null;
}

export default function B2BLocationMap({
  value,
  onChange,
  allowedCities
}: Props) {
  const markerPosition =
    value.latitude !== null && value.longitude !== null
      ? ({ lat: value.latitude, lng: value.longitude } as LatLngLiteral)
      : null;

  const moroccoOutsideTargetCityMask: [number, number][][] = [
    MOROCCO_RING,
    ...allowedCities.map((city) =>
      makeCirclePolygon(city.latitude, city.longitude, city.radius)
    )
  ];

  const DECORATIVE_CITIES = [
    { name: 'Dakhla', lat: 23.6848, lng: -15.9570 },
    { name: 'Lagouira', lat: 20.85, lng: -17.10 }
  ];

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <MapContainer
        center={{ lat: 28.8, lng: -8.9 }}
        zoom={4.15}
        minZoom={4.0}
        maxZoom={18}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        style={{ height: '420px', width: '100%', background: '#0B0F17' }}
        maxBounds={MOROCCO_FULL_BOUNDS}
        maxBoundsViscosity={0.9}
      >
        <TileLayer
          attribution="&copy; CARTO & OpenStreetMap contributors"
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />

        <ZoomAwareReferenceLabels />
        <ClickHandler onSelect={onChange} allowedCities={allowedCities} />

        <Polygon
          positions={[WORLD_RING, MOROCCO_RING]}
          pathOptions={{
            stroke: false,
            fillColor: '#080B12',
            fillOpacity: 0.52,
            fillRule: 'evenodd'
          }}
        />

        <Polygon
          positions={moroccoOutsideTargetCityMask}
          pathOptions={{
            stroke: false,
            fillColor: '#080B12',
            fillOpacity: 0.52,
            fillRule: 'evenodd'
          }}
        />

        {allowedCities.map((city) => (
          <Circle
            key={city.key}
            center={[city.latitude, city.longitude]}
            radius={city.radius * 1000}
            pathOptions={{
              color: '#B8FF3D',
              weight: 1.15,
              opacity: 0.62,
              fillColor: '#A3E635',
              fillOpacity: 0.045
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -6]}
              permanent={false}
              className="pointer-events-none"
            >
              <span className="text-xs font-medium">{city.label}</span>
            </Tooltip>
          </Circle>
        ))}

        <ZoomAwareLabels allowedCities={allowedCities} />
        <AttributionStyler />

        {allowedCities.map((city) => (
          <CircleMarker
            key={`${city.key}-center`}
            center={[city.latitude, city.longitude]}
            radius={4}
            pathOptions={{
              color: '#D9FF62',
              weight: 2,
              fillColor: '#D9FF62',
              fillOpacity: 0.85
            }}
          />
        ))}

        {markerPosition ? (
          <Marker position={markerPosition} icon={selectedPointIcon} />
        ) : null}
      </MapContainer>
    </div>
  );
}