import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import 'leaflet-groupedlayercontrol';
import 'leaflet-groupedlayercontrol/dist/leaflet.groupedlayercontrol.min.css';

const tileSize = 24;
const mapWidth = 2928;
const mapHeight = 2544;

// Layer groups
const baseLayers = {};
const overlayLayers = {};

const mapImageLayer = L.layerGroup();
const gridLayer = L.layerGroup();
const hoverLayer = L.layerGroup();

const specialLayer = L.layerGroup();
const dungeonLayer = L.layerGroup();
const cityLayer = L.layerGroup();
const startLayer = L.layerGroup();
const questLayer = L.layerGroup();


//leaflet setup

const map = L.map("map", {
  crs: L.CRS.Simple,
  minZoom: -.5,
  maxZoom: 4,
  zoomSnap: 0.1,
  attributionControl: true
});

map.attributionControl.setPrefix(false);
map.attributionControl.addAttribution(
  'Map by <a href="https://github.com/qaz123231/Elin-map" target="_blank">qaz123231</a>'
);

const bounds = [[0,0],[mapHeight,mapWidth]];

L.imageOverlay("/overworld.png", bounds).addTo(mapImageLayer);
mapImageLayer.addTo(map);

map.fitBounds(bounds);
map.setMaxBounds(bounds);

//ui elements

const coordBox = document.getElementById("coordBox");
const panel = document.getElementById("infoPanel");
const title = document.getElementById("tileTitle");
const description = document.getElementById("tileDescription");

//selection rectangle

let hoverRect = L.rectangle([[0,0],[tileSize,tileSize]],{
  color:"Black",
  weight:1,
  fill:false
}).addTo(hoverLayer);

function updateHover(latlng){

  const tileX = Math.floor(latlng.lng/tileSize);
  const tileY = Math.floor(latlng.lat/tileSize);

  const x = tileX*tileSize;
  const y = tileY*tileSize;

  hoverRect.setBounds([
    [y,x],
    [y+tileSize,x+tileSize]
  ]);

  coordBox.textContent = `Tile: (${tileX}, ${tileY})`;
}

map.on("mousemove",(e)=>updateHover(e.latlng));

//load json

let tileData = {};

const res = await fetch("/tileData.json");
tileData = await res.json();

//draw grid

const gridGroup = gridLayer;

const rows = Math.ceil(mapHeight / tileSize);
const cols = Math.ceil(mapWidth / tileSize);

//Horizontal lines
for (let i = 0; i <= rows; i++) {
  const y = i * tileSize;
  const line = L.polyline([[y, 0], [y, mapWidth]], {
    color: 'white',
    weight: 0.5,
    opacity: 0.2,
    interactive: false
  });
  gridGroup.addLayer(line);
}

//Vertical lines
for (let j = 0; j <= cols; j++) {
  const x = j * tileSize;
  const line = L.polyline([[0, x], [mapHeight, x]], {
    color: 'white',
    weight: 0.5,
    opacity: 0.2,
    interactive: false
  });
  gridGroup.addLayer(line);
}




//defined tiles hightlight

for(const key in tileData){

  const [tileX,tileY] = key.split(",").map(Number);

  var tile = L.rectangle([
    [tileY*tileSize,tileX*tileSize],
    [tileY*tileSize+tileSize,tileX*tileSize+tileSize]
  ],{
    color:"black",
    weight:1,
    opacity:.25,
    fillOpacity:0.05
  })

  switch(tileData[key].type){
    case "dungeon":
      tile.addTo(dungeonLayer);
      break;
    case "start":
      tile.addTo(startLayer);
      break;
    case "special":
      tile.addTo(specialLayer);
      break;
    case "city":
      tile.addTo(cityLayer);
      break;
    case "quest":
      tile.addTo(questLayer);
      break;
  }

}

//on map titles

for (const key in tileData) {
  const [tileX, tileY] = key.split(",").map(Number);

  const centerLat = tileY *tileSize+ tileSize / 2;
  const centerLng = tileX * tileSize + tileSize / 2;

  var titles = L.marker([centerLat + tileSize, centerLng], {
    icon: L.divIcon({
      className: 'tileLabel',
      html: `<span>${tileData[key].title}</span>`,
      iconSize: null,
      iconAnchor: [0, 0],
    }),
    interactive: false
  });

  switch(tileData[key].type){
    case "dungeon":
      titles.addTo(dungeonLayer);
      break;
    case "start":
      titles.addTo(startLayer);
      break;
    case "special":
      titles.addTo(specialLayer);
      break;
    case "city":
      titles.addTo(cityLayer);
      break;
    case "quest":
      titles.addTo(questLayer);
      break;
  }

}

//layer control setup

gridLayer.addTo(map);
hoverLayer.addTo(map);

dungeonLayer.addTo(map);
startLayer.addTo(map);
specialLayer.addTo(map);
cityLayer.addTo(map);
questLayer.addTo(map)

var groupedOverlays = {
  "Settings": {
    "Grid": gridLayer,
    "Selection": hoverLayer
  },
  "Points of Interest": {
    "Starting points": startLayer,
    "Cities": cityLayer,
    "Quests": questLayer,
    "Dungeons": dungeonLayer,
    "Specials": specialLayer
  }
};

L.control.groupedLayers(null, groupedOverlays).addTo(map);

//on click event

map.on("click", (e) => {

  const tileX = Math.floor(e.latlng.lng / tileSize);
  const tileY = Math.floor(e.latlng.lat / tileSize);

  const key = `${tileX},${tileY}`;

  if (tileData[key]) {

    const newTitle = tileData[key].title;
    const newDescription =
      tileData[key].description.replace(/\n/g, "<br>");

    if (panel.classList.contains("open")) {

      panel.classList.remove("open");

      setTimeout(() => {
        title.textContent = newTitle;
        description.innerHTML = newDescription;
        panel.classList.add("open");
      }, 200);

    } else {

      title.textContent = newTitle;
      description.innerHTML = newDescription;
      panel.classList.add("open");

    }

  } else {

    panel.classList.remove("open");

  }

});