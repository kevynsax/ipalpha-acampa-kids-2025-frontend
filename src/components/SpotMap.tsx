import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface SpotMapProps {
  lat: number;
  lng: number;
  /** the circle drawn around the point, in metres */
  radiusM: number;
  /** optional: tapping / dragging the marker moves the spot */
  onMove?: (pos: { lat: number; lng: number }) => void;
  height?: number;
}

/** Leaflet's default marker looks for its PNGs relative to the CSS; a plain div icon needs nothing. */
const PIN = L.divIcon({ className: "spot-map__pin", html: "📍", iconSize: [28, 28], iconAnchor: [14, 28] });

/** the square that contains the radius circle — computed from the coordinates, so it works before the map has a view */
const boundsOf = (lat: number, lng: number, radiusM: number) => L.latLng(lat, lng).toBounds(radiusM * 2);

/**
 * A small OpenStreetMap view of one check-in spot with its radius. The view
 * fits the circle; the marker can be dragged (and the map tapped) to move the
 * spot when `onMove` is given.
 */
export default function SpotMap({ lat, lng, radiusM, onMove, height = 220 }: SpotMapProps) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const circle = useRef<L.Circle | null>(null);
  const moveRef = useRef(onMove);
  moveRef.current = onMove;

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
    // a view must exist before any layer geometry is projected (getBounds / fitBounds on layers throw otherwise)
    m.fitBounds(boundsOf(lat, lng, radiusM), { padding: [16, 16] });
    circle.current = L.circle([lat, lng], { radius: radiusM, color: "#2f6f5e", fillColor: "#2f6f5e", fillOpacity: 0.15, weight: 2 }).addTo(m);
    marker.current = L.marker([lat, lng], { icon: PIN, draggable: !!onMove }).addTo(m);
    marker.current.on("dragend", () => {
      const p = marker.current!.getLatLng();
      moveRef.current?.({ lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) });
    });
    m.on("click", (e: L.LeafletMouseEvent) => moveRef.current?.({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) }));
    map.current = m;
    // the container may have been laid out after the map was created (flex / dialogs)
    const t = setTimeout(() => m.invalidateSize(), 0);
    return () => {
      clearTimeout(t);
      m.remove();
      map.current = null;
      marker.current = null;
      circle.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the marker / circle in sync with the form fields
  useEffect(() => {
    if (!map.current || !marker.current || !circle.current) return;
    marker.current.setLatLng([lat, lng]);
    circle.current.setLatLng([lat, lng]);
    circle.current.setRadius(radiusM);
    map.current.fitBounds(boundsOf(lat, lng, radiusM), { padding: [16, 16] });
  }, [lat, lng, radiusM]);

  return <div ref={el} className="spot-map" style={{ height }} />;
}
