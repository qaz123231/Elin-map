import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import 'leaflet-groupedlayercontrol';
import 'leaflet-groupedlayercontrol/dist/leaflet.groupedlayercontrol.min.css';

const tileSize = 24;
const mapWidth = 2928;
const mapHeight = 2544;

const mapImageLayer = L.layerGroup();
const gridLayer = L.layerGroup();
const hoverLayer = L.layerGroup();

const poiLayers = {};

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

//UI 

const coordBox = document.getElementById("coordBox");
const panel = document.getElementById("infoPanel");
const title = document.getElementById("tileTitle");
const description = document.getElementById("tileDescription");

const searchBox = document.getElementById("searchBox");
const searchResults = document.getElementById("searchResults");

//HOVER 

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

//LOAD DATA 

let tileData = {};

const res = await fetch("/tileData.json");
tileData = await res.json();

//CREATE LAYERS 

for(const key in tileData){

  const type = tileData[key].type;

  if(!poiLayers[type]){
    poiLayers[type] = L.layerGroup().addTo(map);
  }

}

//DRAW POI 

for(const key in tileData){

  const [tileX,tileY] = key.split(",").map(Number);
  const type = tileData[key].type;

  const rect = L.rectangle([
    [tileY*tileSize,tileX*tileSize],
    [tileY*tileSize+tileSize,tileX*tileSize+tileSize]
  ],{
    color:"black",
    weight:1,
    opacity:.25,
    fillOpacity:0.05
  });

  rect.addTo(poiLayers[type]);

}

//LABELS 

for (const key in tileData) {

  const [tileX, tileY] = key.split(",").map(Number);
  const type = tileData[key].type;

  const centerLat = tileY *tileSize+ tileSize / 2;
  const centerLng = tileX * tileSize + tileSize / 2;

  const label = L.marker([centerLat + tileSize*.75, centerLng], {
    icon: L.divIcon({
      className: 'tileLabel',
      html: `<span>${tileData[key].title}</span>`
    }),
    interactive: false
  });

  label.addTo(poiLayers[type]);

}

//CLICK HANDLER

function openTile(key){

  if(!tileData[key]) return;

  const newTitle = tileData[key].title;

  const newDescription =
    tileData[key].description.replace(/\n/g,"<br>");

  if (panel.classList.contains("open")) {

    panel.classList.remove("open");
    document.body.classList.remove("panel-open");

    setTimeout(() => {

      title.textContent = newTitle;
      description.innerHTML = newDescription;

      panel.classList.add("open");
      document.body.classList.add("panel-open");

    },200);

  } else {

    title.textContent = newTitle;
    description.innerHTML = newDescription;

    panel.classList.add("open");
    document.body.classList.add("panel-open");

  }

}

map.on("click",(e)=>{

  const tileX = Math.floor(e.latlng.lng / tileSize);
  const tileY = Math.floor(e.latlng.lat / tileSize);

  const key = `${tileX},${tileY}`;

  if(tileData[key]){

    openTile(key);

  }else{

    panel.classList.remove("open");
    document.body.classList.remove("panel-open");

  }

});



//SEARCH SYSTEM 

const searchIndex = [];

for(const key in tileData){

  const [x,y] = key.split(",").map(Number);

  searchIndex.push({
    key,
    x,
    y,
    title: tileData[key].title,
    description: tileData[key].description
  });

}

searchBox.addEventListener("input", ()=>{

  const q = searchBox.value.toLowerCase();

  searchResults.innerHTML = "";

  if(q.length < 2) return;

  const results = searchIndex.filter(loc =>
    loc.title.toLowerCase().includes(q) ||
    loc.description.toLowerCase().includes(q)
  ).slice(0,10);

  for(const r of results){

    const div = document.createElement("div");
    div.className = "searchItem";
    div.textContent = r.title;

    div.onclick = ()=>{

  const lat = r.y * tileSize + tileSize/2;
  const lng = r.x * tileSize + tileSize/2;

  map.flyTo([lat, lng], 1, {
    animate: true,
    duration: 1
  });

  openTile(r.key);

  searchResults.innerHTML="";
  searchBox.value="";

};

    searchResults.appendChild(div);

  }

});

//LAYER CONTROL 

gridLayer.addTo(map);
hoverLayer.addTo(map);

const groupedOverlays = {
  "Settings": {
    "Grid": gridLayer,
    "Selection": hoverLayer
  },
  "Points of Interest": {}
};

for(const type in poiLayers){

  const name = type.charAt(0).toUpperCase() + type.slice(1);

  groupedOverlays["Points of Interest"][name] = poiLayers[type];

}

L.control.groupedLayers(null, groupedOverlays).addTo(map);