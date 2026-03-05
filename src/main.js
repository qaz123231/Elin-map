import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";

const tileSize = 24;
const mapWidth = 2928;
const mapHeight = 2544;

const map = L.map("map", {
  crs: L.CRS.Simple,
  minZoom: -.5,
  maxZoom: 4,
  zoomSnap: 0.1,
  wheelPxPerZoomLevel: 100,
});

const bounds = [[0, 0], [mapHeight, mapWidth]];
L.imageOverlay("/overworld.png", bounds).addTo(map);
map.fitBounds(bounds);
map.setMaxBounds(bounds);

// Hover rectangle
let hoverRect = L.rectangle([[0, 0], [tileSize, tileSize]], {
  color: "red",
  weight: 1,
  fill: false,
}).addTo(map);

function updateHoverRect(latlng) {
  const x = Math.floor(latlng.lng / tileSize) * tileSize;
  const y = Math.floor(latlng.lat / tileSize) * tileSize;
  hoverRect.setBounds([[y, x], [y + tileSize, x + tileSize]]);
}

map.on("mousemove", (e) => updateHoverRect(e.latlng));

// Load tile data from JSON
let tileData = {};
const predefinedTileRects = {}; // to store rectangles

async function loadTileData() {
  try {
    const res = await fetch("/tileData.json");
    tileData = await res.json();

    // Draw faint blue rectangle on all predefined tiles
    for (const key in tileData) {
      const [tileX, tileY] = key.split(",").map(Number);
      const rect = L.rectangle(
        [
          [tileY * tileSize, tileX * tileSize],
          [tileY * tileSize + tileSize, tileX * tileSize + tileSize],
        ],
        { color: "blue", weight: 1, fillOpacity: 0.1 } // faint fill
      ).addTo(map);
      predefinedTileRects[key] = rect;
    }
  } catch (err) {
    console.error("Could not load tileData.json:", err);
    tileData = {};
  }
}

await loadTileData();

// Click to show popup
map.on("click", (e) => {
  const tileX = Math.floor(e.latlng.lng / tileSize);
  const tileY = Math.floor(e.latlng.lat / tileSize);
  const key = `${tileX},${tileY}`;

  const centerLat = tileY * tileSize + tileSize / 2;
  const centerLng = tileX * tileSize + tileSize / 2;

  let content = `Tile coordinate: (${tileX}, ${tileY})`;

  if (tileData[key]) {
  // Convert \n to <br> for HTML display
  const descriptionHtml = tileData[key].description.replace(/\n/g, "<br>");
  content = `<b>${tileData[key].title}</b><br>${descriptionHtml}`;
}

L.popup({
  autoClose: true,
  closeOnClick: true,
  maxWidth: 300,       // max width of popup in pixels
  keepInView: true     // ensures popup stays within viewport
})
  .setLatLng([centerLat, centerLng])
  .setContent(content)
  .openOn(map);
});

// Recalculate hover rectangle on zoom/pan
map.on("zoom", () => updateHoverRect(hoverRect.getBounds().getNorthWest()));
map.on("move", () => updateHoverRect(hoverRect.getBounds().getNorthWest()));