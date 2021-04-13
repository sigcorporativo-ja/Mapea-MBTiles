import { MBTiles, MBTilesVector } from 'facade/index.js';

const mapjs = M.map({
  container: 'map',
  projection: 'EPSG:3857*m',
  controls: ['layerswitcher', 'panzoom'],
  layers: ['OSM'],
});

// fetch('./countries.mbtiles').then((response) => {
//   const mbtile = new MBTilesVector({
//     name: 'mbtile',
//     legend: 'Países',
//     source: response,
//   });
//   mapjs.addLayers(mbtile);
// }).catch((e) => {
//   throw e;
// });

fetch('./cabrera.mbtiles').then((response) => {
  const mbtile = new MBTiles({
    name: 'mbtiles',
    legend: 'Cabrera',
    source: response,
  });
  mapjs.addLayers(mbtile);
}).catch((e) => {
  throw e;
});
