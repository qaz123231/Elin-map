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
  zoomSnap: 0.1
});

const bounds = [[0,0],[mapHeight,mapWidth]];

L.imageOverlay("/overworld.png", bounds).addTo(map);

map.fitBounds(bounds);
map.setMaxBounds(bounds);

/* UI ELEMENTS */

const coordBox = document.getElementById("coordBox");
const panel = document.getElementById("infoPanel");
const title = document.getElementById("tileTitle");
const description = document.getElementById("tileDescription");

/* HOVER RECTANGLE */

let hoverRect = L.rectangle([[0,0],[tileSize,tileSize]],{
  color:"red",
  weight:1,
  fill:false
}).addTo(map);

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

/* LOAD TILE DATA */

let tileData = {};

const res = await fetch("/tileData.json");
tileData = await res.json();

/* DRAW BLUE TILES */

for(const key in tileData){

  const [tileX,tileY] = key.split(",").map(Number);

  L.rectangle([
    [tileY*tileSize,tileX*tileSize],
    [tileY*tileSize+tileSize,tileX*tileSize+tileSize]
  ],{
    color:"blue",
    weight:1,
    fillOpacity:0.1
  }).addTo(map);

}

/* CLICK HANDLER */

map.on("click", (e) => {

  const tileX = Math.floor(e.latlng.lng / tileSize);
  const tileY = Math.floor(e.latlng.lat / tileSize);

  const key = `${tileX},${tileY}`;

  if (tileData[key]) {

    const newTitle = tileData[key].title;
    const newDescription =
      tileData[key].description.replace(/\n/g, "<br>");

    // If already open, close first to replay animation
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