/**
 * @module M/impl/layer/MBTilesVector
 */
import { inflate } from 'pako';
import TileProvider from 'facade/provider/Tile';

/**
 * Default tile size of MBTiles
 * @const
 * @private
 * @type {number}
 */
const DEFAULT_TILE_SIZE = 256;

/**
 * @function
 * @private
 */
const generateResolutions = (extent, tileSize, maxZoomLevel) => {
  const width = ol.extent.getWidth(extent);
  const size = width / tileSize;
  const resolutions = new Array(maxZoomLevel + 1);
  for (let z = 0; z < maxZoomLevel + 1; z += 1) {
    resolutions[z] = size / (2 ** z);
  }
  return resolutions;
};


/**
 * @classdesc
 * @api
 */
class MBTilesVector extends M.impl.layer.Vector {
  /**
   * @classdesc
   * Main constructor of the class. Creates a MBTilesVector implementation layer
   * with parameters specified by the user
   *
   * @constructor
   * @implements {M.impl.Layer}
   * @param {Mx.parameters.LayerOptions} options custom options for this layer
   * @param {Object} vendorOptions vendor options for the base library
   * @api
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    // calls the super constructor
    super(options, vendorOptions);

    /**
     * User tile load function
     * @public
     * @type {function}
     */
    this.tileLoadFunction = userParameters.tileLoadFunction || null;

    /**
     * MBTilesVector url
     * @private
     * @type {string}
     */
    this.url_ = userParameters.url;

    /**
     * MBTilesVector source
     * @type {ArrayBuffer|Uint8Array|Response|File}
     */
    this.source_ = userParameters.source;

    /**
     * Layer extent
     * @private
     * @type {Mx.Extent}
     */
    this.maxExtent_ = userParameters.maxExtent || null;

    /**
     * Layer opacity
     * @private
     * @type {number}
     */
    this.opacity_ = typeof options.opacity === 'number' ? options.opacity : 1;

    /**
     * Z-index of the layer
     * @private
     * @type {number}
     */
    this.zIndex_ = M.impl.Map.Z_INDEX[M.layer.type.MBTilesVector];

    /**
     * Visibility of the layer
     * @private
     * @type {boolean}
     */
    this.visibility = options.visibility === false ? options.visibility : true;

    /**
     * Zoom levels of the layer
     * @private
     * @type {number}
     */
    this.maxZoomLevel = userParameters.maxZoomLevel || null;
  }

  /**
   * This function sets the visibility of this layer
   *
   * @function
   * @api
   */
  setVisible(visibility) {
    this.visibility = visibility;
    if (!M.utils.isNullOrEmpty(this.ol3Layer)) {
      this.ol3Layer.setVisible(visibility);
    }
  }

  /**
   * This function sets the map object of the layer
   *
   * @public
   * @param {M/Map} map
   * @function
   * @api
   */
  addTo(map) {
    this.map = map;
    const { code } = this.map.getProjection();
    const projection = ol.proj.get(code);
    const extent = projection.getExtent();

    if (!this.tileLoadFunction) {
      this.fetchSource().then((tileProvider) => {
        tileProvider.getMaxZoomLevel().then((maxZoomLevel) => {
          if (!this.maxZoomLevel) {
            this.maxZoomLevel = maxZoomLevel;
          }
          const resolutions = generateResolutions(extent, DEFAULT_TILE_SIZE, this.maxZoomLevel);
          this.tileProvider_ = tileProvider;
          this.tileProvider_.getExtent().then((mbtilesExtent) => {
            let reprojectedExtent = mbtilesExtent;
            if (reprojectedExtent) {
              reprojectedExtent = ol.proj.transformExtent(mbtilesExtent, 'EPSG:4326', code);
            }
            this.tileProvider_.getFormat().then((format) => {
              this.ol3Layer = this.createLayer({
                tileProvider,
                resolutions,
                extent: reprojectedExtent,
                sourceExtent: extent,
                projection,
                format,
              });

              this.ol3Layer
                .getSource().on('tileloaderror', evt => this.checkAllTilesLoaded_(evt));
              this.ol3Layer
                .getSource().on('tileloadend', evt => this.checkAllTilesLoaded_(evt));

              this.map.on(M.evt.CHANGE_ZOOM, () => {
                if (this.map) {
                  const newZoom = this.map.getZoom();
                  if (this.lastZoom_ !== newZoom) {
                    this.features_.length = 0;
                    this.lastZoom_ = newZoom;
                  }
                }
              });

              this.map.getMapImpl().addLayer(this.ol3Layer);
            });
          });
        });
      });
    } else {
      const resolutions = generateResolutions(extent, DEFAULT_TILE_SIZE, this.maxZoomLevel || 16);
      this.ol3Layer = this.createLayer({
        resolutions,
        extent,
        sourceExtent: extent,
        projection,
      });

      this.ol3Layer
        .getSource().on('tileloaderror', evt => this.checkAllTilesLoaded_(evt));
      this.ol3Layer
        .getSource().on('tileloadend', evt => this.checkAllTilesLoaded_(evt));

      this.map.on(M.evt.CHANGE_ZOOM, () => {
        if (this.map) {
          const newZoom = this.map.getZoom();
          if (this.lastZoom_ !== newZoom) {
            this.features_.length = 0;
            this.lastZoom_ = newZoom;
          }
        }
      });

      this.map.getMapImpl().addLayer(this.ol3Layer);
    }
  }

  /** This function create the implementation ol layer.
   *
   * @param {object} opts
   * @return {ol/layer/TileLayer|ol/layer/VectorTile}
   * @api
   */
  createLayer(opts) {
    let tileLoadFn = this.loadVectorTileWithProvider;
    if (this.tileLoadFunction) {
      tileLoadFn = this.loadVectorTile;
    }
    const mvtFormat = new ol.format.MVT();
    const layer = new ol.layer.VectorTile({
      visible: this.visibility,
      opacity: this.opacity_,
      zIndex: this.zIndex_,
      extent: this.maxExtent_ || opts.sourceExtent,
      source: new ol.source.VectorTile({
        projection: opts.projection,
        url: '{z},{x},{y}',
        tileLoadFunction: tile => tileLoadFn(tile, mvtFormat, opts),
        tileGrid: new ol.tilegrid.TileGrid({
          extent: opts.sourceExtent,
          origin: ol.extent.getBottomLeft(opts.sourceExtent),
          resolutions: opts.resolutions,
        }),
      }),
    });
    return layer;
  }

  /**
   * This function is the custom tile loader function of
   * TileLayer
   * @param {ol/Tile} tile
   * @param {ol/format/MVT} formatter
   * @param {M/provider/Tile} tileProvider
   * @function
   * @api
   */
  loadVectorTileWithProvider(tile, formatter, opts) {
    tile.setState(1); // ol/TileState#LOADING
    tile.setLoader((extent, resolution, projection) => {
      const tileCoord = tile.getTileCoord();
      opts.tileProvider.getVectorTile([tileCoord[0], tileCoord[1], -tileCoord[2] - 1])
        .then((pbf) => {
          if (pbf) {
            const features = formatter.readFeatures(pbf, {
              extent,
              featureProjection: projection,
            });
            tile.setFeatures(features);
            tile.setState(2); // ol/TileState#LOADED
          } else {
            tile.setState(3); // ol/TileState#ERROR
          }
        });
    });
  }

  /**
   * This function is the custom tile loader function of
   * TileLayer
   * @param {ol/Tile} tile
   * @param {ol/format/MVT} formatter
   * @param {M/provider/Tile} tileProvider
   * @function
   * @api
   */
  loadVectorTile(tile, formatter, opts, target) {
    tile.setState(1); // ol/TileState#LOADING
    tile.setLoader((extent, resolution, projection) => {
      const tileCoord = tile.getTileCoord();
      target.tileLoadFunction(tileCoord[0], tileCoord[1], -tileCoord[2] - 1).then((_vectorTile) => {
        if (_vectorTile) {
          const vectorTile = inflate(_vectorTile);
          const features = formatter.readFeatures(vectorTile, {
            extent,
            featureProjection: projection,
          });
          tile.setFeatures(features);
          tile.setState(2); // ol/TileState#LOADED
        } else {
          tile.setState(3); // ol/TileState#ERROR
        }
      });
    });
  }

  /**
   * This function load the source mbtiles
   * @function
   * @returns {Promise<M/provider/Tile>}
   * @api
   */
  fetchSource() {
    return new Promise((resolve, reject) => {
      if (this.tileProvider_) {
        resolve(this.tileProvider_);
      } else if (this.source_) {
        const tileProvider = new TileProvider(this.source_);
        resolve(tileProvider);
      } else {
        reject(new Error('No source was specified.'));
      }
    });
  }

  /**
   * This function set facade class OSM
   *
   * @function
   * @api
   */
  setFacadeObj(obj) {
    this.facadeLayer_ = obj;
  }

  /**
   * TODO
   */
  setMaxExtent(maxExtent) {
    this.ol3Layer.setExtent(maxExtent);
  }

  /**
   *
   * @public
   * @function
   * @api
   */
  getMinResolution() {}

  /**
   *
   * @public
   * @function
   * @api
   */
  getMaxResolution() {}

  /**
   * This function destroys this layer, cleaning the HTML
   * and unregistering all events
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    const olMap = this.map.getMapImpl();
    if (!M.utils.isNullOrEmpty(this.ol3Layer)) {
      olMap.removeLayer(this.ol3Layer);
      this.ol3Layer = null;
    }
    this.map = null;
  }

  /**
   * This function checks if an object is equals
   * to this layer
   *
   * @function
   * @api
   */
  equals(obj) {
    let equals = false;

    if (obj instanceof MBTilesVector) {
      equals = (this.name === obj.name);
    }

    return equals;
  }

  /**
   * This function returns all features or discriminating by the filter
   *
   * @function
   * @public
   * @param {boolean} skipFilter - Indicates whether skyp filter
   * @param {M.Filter} filter - Filter to execute
   * @return {Array<M.Feature>} returns all features or discriminating by the filter
   * @api
   */
  getFeatures(skipFilter, filter) {
    let features = [];
    if (this.ol3Layer) {
      const olSource = this.ol3Layer.getSource();
      const tileCache = olSource.tileCache;
      if (tileCache.getCount() === 0) {
        return features;
      }
      const z = tileCache.peekFirstKey().split('/').map(Number)[0];
      tileCache.forEach((tile) => {
        if (tile.tileCoord[0] !== z || tile.getState() !== 2) {
          return;
        }
        const sourceTiles = tile.getSourceTiles();
        for (let i = 0, ii = sourceTiles.length; i < ii; i += 1) {
          const sourceTile = sourceTiles[i];
          const olFeatures = sourceTile.getFeatures();
          if (olFeatures) {
            features = features.concat(olFeatures);
          }
        }
      });
    }
    return features;
  }

  /**
   * This function checks if an object is equals
   * to this layer
   *
   * @private
   * @function
   * @param {ol/source/Tile.TileSourceEvent} evt
   */
  checkAllTilesLoaded_(evt) {
    const { code } = this.map.getProjection();
    const currTileCoord = evt.tile.getTileCoord();
    const olProjection = ol.proj.get(code);
    const tileCache = this.ol3Layer.getSource().getTileCacheForProjection(olProjection);
    const tileImages = tileCache.getValues();
    const loaded = tileImages.some((tile) => {
      const tileCoord = tile.getTileCoord();
      const tileState = tile.getState();
      const sameTile = (currTileCoord[0] === tileCoord[0] &&
        currTileCoord[1] === tileCoord[1] &&
        currTileCoord[2] === tileCoord[2]);
      const tileLoaded = sameTile || (tileState !== 1);
      return tileLoaded;
    });
    if (loaded && !this.loaded_) {
      this.loaded_ = true;
      this.facadeLayer_.fire(M.evt.LOAD);
    }
  }

  /**
   * This methods returns a layer clone of this instance
   * @return {ol/layer/Tile}
   */
  cloneOLLayer() {
    let olLayer = null;
    if (this.ol3Layer != null) {
      const properties = this.ol3Layer.getProperties();
      olLayer = new ol.layer.Tyle(properties);
    }
    return olLayer;
  }
}

export default MBTilesVector;
