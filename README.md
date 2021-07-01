# Mapea MBTiles
---
Extensión de Mapea para el soporte de carga de ficheros locales .mbtiles.

Se implementa la clase M.layer.MBTiles para aquellos ficheros MBTiles que tengan su tile data en formato imagen (jpg, png, etc).

Por el contratio, la clase M.layer.MBTilesVector se usará cuando el tile data esté en formato .pbf (mapbox vector tile).


## Desarrollo
Node version >= 12.X.X

1. Instalar dependencias `npm install`

2. Desplegar servidor de desarrollo `npm start`

3. Se abrirá el navegador con la página de test.

## Compilación
En la carpeta properties se encuentran los diferentes ficheros para configurar el perfil deseado.

Para compilar con un perfil concreto
```bash
$ npm run build -- -P <perfil>
```

### Parámetros configurables

- M.config.MBTILES_SQL_WASM_URL: Este parámetro de configuración indica donde se encuentra el fichero sql-wasm.wasm necesario para la librería SQL.js que se usa como dependencia para la conexión con los ficheros mbtiles. Para entornos de producción este fichero debe estar disponible desde un servidor que provea del fichero [sql-wasm.wasm](https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.4.0/dist/sql-wasm.js)


## Uso

Pasamos a mostrar un ejemplo general de explotación de la extensión:

index.html
```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="mapea" content="yes">
    <title>Mapea MBTiles Production TEST</title>
    <link href="https://sigc.desarrollo.guadaltel.es/mapea6/assets/css/mapea-6.0.0.ol.min.css" rel="stylesheet" />
    <style rel="stylesheet">
        html,
        body {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden;
        }
    </style>

</head>

<body>
    <div id="map" class="container"></div>
    <script type="text/javascript" src="https://sigc.desarrollo.guadaltel.es/mapea6/js/mapea-6.0.0.ol.min.js"></script>
    <script type="text/javascript" src="https://sigc.desarrollo.guadaltel.es/mapea6/js/configuration-6.0.0.js"></script>
    <script type="text/javascript" src="../dist/mapea-mbtiles-1.0.0.ol.min.js"></script>
    <script type="text/javascript">
        const mapjs = M.map({
            container: 'map',
            projection: 'EPSG:3857*m',
            controls: ['layerswitcher'],
            layers: ['OSM'],
        });

        fetch('./countries.mbtiles').then((response) => {
            const mbtile = new M.layer.MBTilesVector({
                name: 'mbtiles_vector',
                legend: 'Cabrera',
                source: response,
            });
            mapjs.addLayers(mbtile);
        }).catch(e => {
            throw e
        });

        fetch('./cabrera.mbtiles').then((response) => {
            const mbtile = new M.layer.MBTiles({
                name: 'mbtiles',
                legend: 'Countries',
                source: response,
            });
            mapjs.addLayers(mbtile);
        });
    </script>
</body>
</html>

```

## Documentación API Mapea-MBTiles

### class M.layer.MBTiles

- Constructor:
  
  new M.layer.MBTiles(options)
  
  options: 
  Estructura:
  ```javascript
  const options = {
      data,//El fichero  que contiene la información de mbtiles (.mbtiles). Tipo: [Response](https://developer.mozilla.org/es/docs/Web/API/Response) | 
            // [File](https://developer.mozilla.org/es/docs/Web/API/File) | 
            // [Uint8Array](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Uint8Array)
      extent, // extensión de la capa. Opcional
      name, // Nombre interno de la capa. Opcional
      legend, // Leyenda para mostrar en TOC. Opcional
      transparent, // True para hacerla capa base. Opcional,
      visibility, // Visibilidad de la capa. Opcional
      opacity, // Opacidad de la capa. Numero entre [0-1]
      zoomLevels // Numero de niveles de zoom de la capa. 16 por defecto,
      tileLoadFunction, // Función de carga de los tiles. Recibe las coordenadas x,y,z
                        // y devuelve una promesa con el dato con la imagen en base64 para esas coordenadas.
    }
  }
  ```
### class M.layer.MBTilesVector

- Constructor:
  
  new M.layer.MBTilesVector(options, inheritedOpts)
  
  options: 
  Estructura:
  ```javascript
  const options = {
      data,//El fichero  que contiene la información de mbtiles (.mbtiles). Tipo: [Response](https://developer.mozilla.org/es/docs/Web/API/Response) | 
            // [File](https://developer.mozilla.org/es/docs/Web/API/File) | 
            // [Uint8Array](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Uint8Array)
      name, // Nombre interno de la capa. Opcional
      legend, // Leyenda para mostrar en TOC. Opcional,
      maxExtent, // Extensión máxima de la capa. Opcional
      visibility, // Visibilidad de la capa. Opcional
      opacity, // Opacidad de la capa. Numero entre [0-1]
      zoomLevels // Numero de niveles de zoom de la capa. 16 por defecto,
      tileLoadFunction, // Función de carga de los tiles. Recibe las coordenadas x,y,z
                        // y devuelve una promesa con el dato .pbf para esas coordenadas.
    }
  }

  const inheritedOpts = {
      style, // Estilo de Mapea para la capa (M.style.Point|M.style.Line|M.style.Polygon). Opcional
    }
  }

  ```
### Extensiones de M.Map

- M.Map.prototype.addMBTiles
- M.Map.prototype.addMBTilesVector
- M.Map.prototype.getMBTiles
- M.Map.prototype.getMBTilesVector
- M.Map.prototype.removeMBTiles
- M.Map.prototype.removeMBTilesVector

### Extensiones de M.layer.type

- M.layer.type.MBTiles
- M.layer.type.MBTilesVector

## Matriz de compatibilidad
| Mapea-MBTiles | Mapea   |
| ------------- | ------- |
| 1.0.0         | >=6.0.0 |