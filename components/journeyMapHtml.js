import { colors } from "../theme/tokens";

/**
 * @typedef {{ lat: number, lon: number, label?: string }} Point
 */

/**
 * Builds a self-contained MapLibre GL page (loaded inside a WebView) showing an
 * accompanied journey: the user's own trip, the companion's trip when its
 * coordinates are known, and the meeting point.
 *
 * MapLibre renders vector tiles, so the map stays sharp at every zoom and the
 * base map can be a muted style that lets the brand-coloured overlays read.
 * The style comes from OpenFreeMap, which needs no account or API key.
 *
 * @param {{ mine: {departure: Point, arrival: Point}, other?: {departure: Point, arrival: Point}, meeting?: Point, positions?: object[] }} data
 * @returns {string} HTML document.
 */
function buildHtml({ mine, other, meeting, positions }) {
  const config = JSON.stringify({
    mine,
    other: other ?? null,
    meeting: meeting ?? null,
    positions: positions ?? [],
    palette: {
      teal: colors.teal,
      tealDark: colors.tealDark,
      navy: colors.navy,
      surface: colors.surface,
      bg: colors.bg,
    },
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; background: ${colors.bg}; }
  .maplibregl-ctrl-attrib { display: none; }
  .dot {
    width: 16px; height: 16px; border-radius: 50%;
    border: 3px solid ${colors.surface};
    box-shadow: 0 1px 4px rgba(30,44,56,0.35);
  }
  .live {
    width: 18px; height: 18px; border-radius: 50%;
    border: 3px solid ${colors.surface};
    box-shadow: 0 0 0 6px rgba(72,175,196,0.28), 0 2px 6px rgba(30,44,56,0.35);
  }
  .rv-pin {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 50%;
    background: ${colors.teal}; border: 3px solid ${colors.surface};
    box-shadow: 0 2px 8px rgba(30,44,56,0.4);
    color: #fff; font: 700 12px/1 -apple-system, system-ui, sans-serif;
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var C = ${config};
  function lngLat(p) { return [Number(p.lon), Number(p.lat)]; }

  var start = C.mine && C.mine.departure ? lngLat(C.mine.departure) : [2.3522, 48.8566];

  var map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/positron',
    center: start,
    zoom: 12,
    attributionControl: false,
    // The map sits inside a card; the surrounding screen handles scrolling.
    cooperativeGestures: false,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');

  var points = [];

  function marker(className, lngLatValue, title, text) {
    var el = document.createElement('div');
    el.className = className;
    if (title) { el.title = title; }
    if (text) { el.textContent = text; }
    new maplibregl.Marker({ element: el }).setLngLat(lngLatValue).addTo(map);
  }

  function dot(color, lngLatValue, title) {
    var el = document.createElement('div');
    el.className = 'dot';
    el.style.background = color;
    if (title) { el.title = title; }
    new maplibregl.Marker({ element: el }).setLngLat(lngLatValue).addTo(map);
  }

  function drawTrip(id, trip, color, dashed) {
    if (!trip) { return; }
    var from = lngLat(trip.departure), to = lngLat(trip.arrival);
    points.push(from, to);

    map.addSource(id, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [from, to] } },
    });
    map.addLayer({
      id: id + '-line',
      type: 'line',
      source: id,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: Object.assign(
        { 'line-color': color, 'line-width': dashed ? 3 : 5, 'line-opacity': dashed ? 0.75 : 0.95 },
        dashed ? { 'line-dasharray': [1.5, 1.5] } : {},
      ),
    });

    dot(color, from, trip.departure.label || 'Départ');
    dot(C.palette.navy, to, trip.arrival.label || 'Arrivée');
  }

  map.on('load', function () {
    drawTrip('mine', C.mine, C.palette.teal, false);
    drawTrip('other', C.other, C.palette.tealDark, true);

    if (C.meeting) {
      var m = lngLat(C.meeting);
      points.push(m);
      marker('rv-pin', m, 'Point de rendez-vous', 'RV');
    }

    (C.positions || []).forEach(function (p) {
      if (p.lat == null || p.lon == null) { return; }
      var at = [Number(p.lon), Number(p.lat)];
      points.push(at);
      var el = document.createElement('div');
      el.className = 'live';
      el.style.background = p.mine ? C.palette.tealDark : C.palette.teal;
      el.title = (p.mine ? 'Votre position' : (p.firstname || 'Votre binôme') + ' est ici');
      new maplibregl.Marker({ element: el }).setLngLat(at).addTo(map);
    });

    if (points.length > 1) {
      var bounds = points.reduce(function (acc, p) { return acc.extend(p); },
        new maplibregl.LngLatBounds(points[0], points[0]));
      // Markers stand above their anchor, so keep more room at the top.
      map.fitBounds(bounds, { padding: { top: 58, bottom: 38, left: 38, right: 38 }, duration: 0 });
    } else if (points.length === 1) {
      map.easeTo({ center: points[0], zoom: 14, duration: 0 });
    }
  });
</script>
</body>
</html>`;
}

export { buildHtml };
