import React, { useEffect, useRef, useContext, useState } from 'react';
import L from 'leaflet';
import type { Map as LeafletMap, TileLayer, Marker, GeoJSON } from 'leaflet';
import type { CaseData } from '../types';
import { ThemeContext } from '../contexts/ThemeContext';

// I casi sulla mappa sono quadrati con alone, non pallini: il tondo e' escluso
// dalla direzione Samaritan, salvo la spia di registrazione.
const samThreat = 'rgba(255, 0, 0, 0.8)';

const samSquare = (size: number, primary: boolean) =>
  L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border:2px solid ${samThreat};`
      + `background:${primary ? samThreat : 'transparent'};`
      + `box-shadow:0 0 ${primary ? 15 : 5}px ${samThreat};"></div>`,
  });

interface ItalyMapProps {
  cases: CaseData[];
  onSelectCase: (caseData: CaseData) => void;
  selectedCaseId: string | null;
}

const ItalyMap: React.FC<ItalyMapProps> = ({ cases, onSelectCase, selectedCaseId }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const regionLayerRef = useRef<GeoJSON | null>(null);
  const [regionGeoJson, setRegionGeoJson] = useState<any>(null);
  const { theme } = useContext(ThemeContext);

  // Confini regionali serviti dall'applicazione, non da una risorsa remota:
  // il file e' vendorizzato in public/ (fonte openpolis/geojson-italy, coordinate
  // arrotondate a 4 decimali). Vedi docs/help.md per la provenienza.
  useEffect(() => {
    fetch('/limits_IT_regions.geojson')
      .then(response => response.json())
      .then(data => setRegionGeoJson(data))
      .catch(error => console.error('Error fetching region GeoJSON:', error));
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      const map = L.map(mapRef.current, {
        center: [42.5, 12.5],
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: false,
        dragging: true,
      });
      mapInstance.current = map;
    }
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);
  
  // Update tile layer on theme change
  useEffect(() => {
    if (!mapInstance.current) return;
    const tileUrl = theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(tileUrl);
    } else {
      tileLayerRef.current = L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(mapInstance.current);
    }
  }, [theme]);

  // Main effect to draw/update map features based on selected case
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    // --- 1. Clear previous layers ---
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    if (regionLayerRef.current) {
      regionLayerRef.current.remove();
      regionLayerRef.current = null;
    }

    // --- 2. Find selected case ---
    const selectedCase = selectedCaseId ? cases.find(c => c.caseID === selectedCaseId) : null;
    
    // --- 3. If a case is selected, draw its features ---
    if (selectedCase) {
      // Draw region outlines
      if (regionGeoJson && selectedCase.summary.location.regions && selectedCase.summary.location.regions.length > 0) {
        const selectedRegions = new Set(selectedCase.summary.location.regions);
        const featuresToDraw = regionGeoJson.features.filter((feature: any) =>
          selectedRegions.has(feature.properties.reg_name)
        );

        if (featuresToDraw.length > 0) {
          const regionData = { type: "FeatureCollection", features: featuresToDraw };
          regionLayerRef.current = L.geoJSON(regionData as any, {
            style: {
              color: samThreat,
              weight: 2,
              opacity: 0.8,
              fill: false,
              dashArray: '5, 5',
            }
          }).addTo(map);
          regionLayerRef.current.bringToFront();
        }
      }

      // Draw city markers
      const locations = selectedCase.summary?.location?.cities;
      if (locations && locations.length > 0) {
        const caseMarkers: Marker[] = [];
        
        // Secondary markers
        locations.slice(1).forEach(loc => {
          if (loc.coords) {
            const marker = L.marker([loc.coords.lat, loc.coords.lng], {
              icon: samSquare(8, false),
            }).addTo(map);
            marker.on('click', () => onSelectCase(selectedCase));
            marker.bindPopup(`<div class="font-sans text-sm">Località secondaria: ${loc.name}<br><strong>Caso: ${selectedCase.summary.title}</strong></div>`);
            caseMarkers.push(marker);
          }
        });

        // Primary marker
        const primaryLocation = locations[0];
        if (primaryLocation.coords) {
          const marker = L.marker([primaryLocation.coords.lat, primaryLocation.coords.lng], {
            icon: samSquare(16, true),
          }).addTo(map);
          marker.on('click', () => onSelectCase(selectedCase));
          marker.bindPopup(`<div class="font-sans text-base">${selectedCase.summary.title}</div>`);
          caseMarkers.unshift(marker);

          // Pan view to primary marker
          map.setView(marker.getLatLng(), map.getZoom(), { animate: true, duration: 1 });
        }
        markersRef.current = caseMarkers;
      }
    } else {
        // No case selected, just reset view to default
        map.setView([42.5, 12.5], 6, { animate: true, duration: 1 });
    }
  }, [selectedCaseId, cases, onSelectCase, theme, regionGeoJson]);

  return <div ref={mapRef} className="w-full h-full" />;
};

export default ItalyMap;