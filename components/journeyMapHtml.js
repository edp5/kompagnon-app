import { colors } from "../theme/tokens";

/**
 * @typedef {{ lat: number, lon: number, label?: string }} Point
 */

/**
 * Builds a self-contained Leaflet page (loaded inside a WebView) showing an
 * accompanied journey with the project palette: the user's own trip, the
 * companion's trip when its coordinates are known, and the meeting point.
 * @param {{ mine: {departure: Point, arrival: Point}, other?: {departure: Point, arrival: Point}, meeting?: Point }} data
 * @returns {string} HTML document.
 */
function buildHtml({ mine, other, meeting }) {
  const config = JSON.stringify({
    mine,
    other: other ?? null,
    meeting: meeting ?? null,
    palette: {
      teal: colors.teal,
      tealDark: colors.tealDark,
      navy: colors.navy,
      warning: colors.warning,
      surface: colors.surface,
      bg: colors.bg,
    },
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; background: ${colors.bg}; }
  /* Mute the raster tiles so they sit under the brand-coloured overlays. */
  .leaflet-tile-pane { filter: saturate(0.72) brightness(1.03) contrast(0.96); }
  .leaflet-container { background: ${colors.bg}; font-family: -apple-system, system-ui, sans-serif; }
  .rv-pin {
    display: flex; align-items: center; justify-content: center;
    width: 26px; height: 26px; border-radius: 50%;
    background: ${colors.teal}; border: 3px solid ${colors.surface};
    box-shadow: 0 2px 6px rgba(30,44,56,0.35); color: #fff;
    font-size: 12px; font-weight: 700;
  }
  .dot { width: 16px; height: 16px; border-radius: 50%; border: 3px solid ${colors.surface}; box-shadow: 0 1px 4px rgba(30,44,56,0.3); }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var C = ${config};
  var start = C.mine && C.mine.departure ? [Number(C.mine.departure.lat), Number(C.mine.departure.lon)] : [48.8566, 2.3522];
  var map = L.map('map', { zoomControl: true, attributionControl: false }).setView(start, 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

  function latlng(p){ return [Number(p.lat), Number(p.lon)]; }
  function dot(color){ return L.divIcon({ className: '', html: '<div class="dot" style="background:'+color+'"></div>', iconSize:[16,16], iconAnchor:[8,8] }); }

  var pts = [];

  function drawTrip(trip, color, dashed){
    if(!trip) return;
    var a = latlng(trip.departure), b = latlng(trip.arrival);
    pts.push(a, b);
    L.polyline([a, b], { color: color, weight: dashed ? 3 : 5, opacity: dashed ? 0.7 : 0.95, dashArray: dashed ? '6,8' : null, lineCap: 'round' }).addTo(map);
    L.marker(a, { icon: dot(color) }).addTo(map).bindTooltip(trip.departure.label || 'Départ', {direction:'top'});
    L.marker(b, { icon: dot(C.palette.navy) }).addTo(map).bindTooltip(trip.arrival.label || 'Arrivée', {direction:'top'});
  }

  drawTrip(C.mine, C.palette.teal, false);
  drawTrip(C.other, C.palette.tealDark, true);

  if (C.meeting) {
    var m = latlng(C.meeting); pts.push(m);
    L.marker(m, { icon: L.divIcon({ className: '', html: '<div class="rv-pin">RV</div>', iconSize:[26,26], iconAnchor:[13,13] }), zIndexOffset: 1000 })
      .addTo(map).bindTooltip('Point de rendez-vous', {direction:'top'});
  }

  function fit(){
    map.invalidateSize();
    if (pts.length > 1) {
      map.fitBounds(L.latLngBounds(pts), { padding: [28, 28] });
    } else if (pts.length === 1) {
      map.setView(pts[0], 14);
    }
  }
  // The iframe/container may not have its size yet when the script first runs.
  setTimeout(fit, 60);
  window.addEventListener('load', fit);
  window.addEventListener('resize', fit);
</script>
</body>
</html>`;
}

export { buildHtml };
