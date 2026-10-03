// components/MapViewWrapper.tsx – Universal Map View with Real Interactive Map Support
import React from "react";
import { View, StyleSheet, Platform } from "react-native";

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export interface MarkerProps {
  coordinate: { latitude: number; longitude: number };
  title?: string;
  pinColor?: string;
}

export interface CircleProps {
  center: { latitude: number; longitude: number };
  radius: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export function Marker(_props: MarkerProps) {
  return null;
}

export function Circle(_props: CircleProps) {
  return null;
}

interface MapViewProps {
  style?: any;
  region?: Region;
  children?: React.ReactNode;
}

export default function MapView({ style, region, children }: MapViewProps) {
  const centerLat = region?.latitude ?? 19.0760;
  const centerLon = region?.longitude ?? 72.8777;

  const markers: Array<{ lat: number; lon: number; title: string; pinColor?: string }> = [];
  const circles: Array<{ lat: number; lon: number; radius: number; fillColor?: string; strokeColor?: string }> = [];

  React.Children.forEach(children, (child: any) => {
    if (!child || !child.props) return;
    if (child.props.coordinate) {
      markers.push({
        lat: child.props.coordinate.latitude,
        lon: child.props.coordinate.longitude,
        title: child.props.title || "Designated Location",
        pinColor: child.props.pinColor,
      });
    }
    if (child.props.center) {
      circles.push({
        lat: child.props.center.latitude,
        lon: child.props.center.longitude,
        radius: child.props.radius || 100,
        fillColor: child.props.fillColor || "rgba(15, 82, 186, 0.15)",
        strokeColor: child.props.strokeColor || "#0F52BA",
      });
    }
  });

  const markersScript = markers
    .map((m) => `L.marker([${m.lat}, ${m.lon}]).addTo(map).bindPopup("<b>${m.title}</b>");`)
    .join("\n");

  const circlesScript = circles
    .map(
      (c) =>
        `L.circle([${c.lat}, ${c.lon}], {
          color: "${c.strokeColor || "#0F52BA"}",
          fillColor: "${c.fillColor || "rgba(15, 82, 186, 0.15)"}",
          fillOpacity: 0.18,
          radius: ${c.radius}
        }).addTo(map);`
    )
    .join("\n");

  const srcDoc = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { box-sizing: border-box; }
        html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #F8FAFC; }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(15,23,42,0.15);
        }
        .user-pulse {
          width: 18px;
          height: 18px;
          background: #0F52BA;
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(15, 82, 186, 0.7);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(15, 82, 186, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(15, 82, 186, 0); }
          100% { box-shadow: 0 0 0 0 rgba(15, 82, 186, 0); }
        }
        .hud-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 1000;
          background: rgba(15, 23, 42, 0.85);
          color: #FFFFFF;
          backdrop-filter: blur(4px);
          padding: 5px 10px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          border: 1px solid rgba(255,255,255,0.15);
          pointer-events: none;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="hud-badge" id="hud">GPS: ${centerLat.toFixed(4)}, ${centerLon.toFixed(4)}</div>
      <script>
        const lat = ${centerLat};
        const lon = ${centerLon};
        const map = L.map('map', { zoomControl: true, attributionControl: false }).setView([lat, lon], 17);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        const userIcon = L.divIcon({
          className: 'user-marker-wrap',
          html: '<div class="user-pulse"></div>',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
        L.marker([lat, lon], { icon: userIcon }).addTo(map).bindPopup('<b>Your Current Location</b>').openPopup();

        ${circlesScript}
        ${markersScript}
      </script>
    </body>
    </html>
  `;

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, style]}>
        {React.createElement("iframe", {
          srcDoc,
          style: {
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: 14,
          },
          title: "Real GPS Attendance Map",
        })}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 210,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
});
