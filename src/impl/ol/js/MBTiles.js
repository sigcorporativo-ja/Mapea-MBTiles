/**
 * @module M/impl/layer/MBTiles
 */
import TileProvider, { DEFAULT_WHITE_TILE } from 'facade/provider/Tile';

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
class MBTiles extends M.impl.Layer {
  /**
   * @classdesc
   * Main constructor of the class. Creates a MBTiles implementation layer
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
     * MBTiles url
     * @private
     * @type {string}
     */
    this.url_ = userParameters.url;

    /**
     * MBTiles source
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
    this.opacity_ = typeof userParameters.opacity === 'number' ? userParameters.opacity : 1;

    /**
     * Z-index of the layer
     * @private
     * @type {number}
     */
    this.zIndex_ = M.impl.Map.Z_INDEX[M.layer.type.MBTiles];

    /**
     * Zoom levels of the layer
     * @private
     * @type {number}
     */
    this.maxZoomLevel_ = userParameters.maxZoomLevel || null;

    /**
     * Visibility parameter
     * @private
     * @type {bool}
     */
    this.visibility = userParameters.visibility === false ? userParameters.visibility : true;
  }

  /**
   * This function sets the visibility of this layer
   *
   * @function
   * @api
   */
  setVisible(visibility) {
    this.visibility = visibility;
    // if this layer is base then it hides all base layers
    if ((visibility === true) && (this.transparent !== true)) {
      // hides all base layers
      this.map.getBaseLayers().forEach((layer) => {
        if (!layer.equals(this.facadeLayer_) && layer.isVisible()) {
          layer.setVisible(false);
        }
      });

      // set this layer visible
      if (!M.utils.isNullOrEmpty(this.ol3Layer)) {
        this.ol3Layer.setVisible(visibility);
      }

      // updates resolutions and keep the bbox
      this.map.getImpl().updateResolutionsFromBaseLayer();
      // this.getExtentFromProvider().then((reprojectedExtent) => {
      //   const bbox = this.map.getBbox();
      //   if (bbox) {
      //     const { x, y } = bbox;
      //     if (x.min < reprojectedExtent[0] || x.max > reprojectedExtent[1] ||
      //       y.min < reprojectedExtent[1] || y.max > reprojectedExtent[2]) {
      //       this.map.setBbox(reprojectedExtent);
      //     }
      //   }
      // });
    } else if (!M.utils.isNullOrEmpty(this.ol3Layer)) {
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
          if (!this.maxZoomLevel_) {
            this.maxZoomLevel_ = maxZoomLevel;
          }
          const resolutions = generateResolutions(extent, DEFAULT_TILE_SIZE, this.maxZoomLevel_);
          this.getExtentFromProvider().then((reprojectedExtent) => {
            this.ol3Layer = this.createLayer({
              tileProvider,
              resolutions,
              extent: reprojectedExtent || extent,
              sourceExtent: extent,
              projection,
            });
            this.map.getMapImpl().addLayer(this.ol3Layer);
          });
        });
      });
    } else {
      const resolutions = generateResolutions(extent, DEFAULT_TILE_SIZE, this.maxZoomLevel_ || 16);
      this.ol3Layer = this.createLayer({
        resolutions,
        extent,
        sourceExtent: extent,
        projection,
      });
      this.map.getMapImpl().addLayer(this.ol3Layer);
    }
  }

  /**
   * This function gets the layer extent from the mbtile file.
   * @function
   * @return {Promise<array<number>>}
   * @api
   */
  getExtentFromProvider() {
    return new Promise((resolve) => {
      this.fetchSource().then((tileProvider) => {
        tileProvider.getExtent().then((extent) => {
          const { code } = this.map.getProjection();
          let reprojectedExtent;
          if (extent) {
            reprojectedExtent = ol.proj.transformExtent(extent, 'EPSG:4326', code);
          }
          resolve(reprojectedExtent);
        });
      });
    });
  }

  /** This function create the implementation ol layer.
   *
   * @param {object} opts
   * @return {ol/layer/TileLayer|ol/layer/VectorTile}
   * @api
   */
  createLayer(opts) {
    let tileLoadFn = this.loadTileWithProvider;
    if (this.tileLoadFunction) {
      tileLoadFn = this.loadTile;
    }
    const layer = new ol.layer.Tile({
      visible: this.visibility,
      opacity: this.opacity_,
      zIndex: this.zIndex_,
      extent: this.maxExtent_ || opts.extent,
      source: new ol.source.XYZ({
        url: '{z},{x},{y}',
        projection: opts.projection,
        tileLoadFunction: tile => tileLoadFn(tile, opts.tileProvider, this),
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
   * TileLayer with tile provider.
   * @param {ol/Tile} tile
   * @param {M/provider/Tile} tileProvider
   * @function
   * @api
   */
  loadTileWithProvider(tile, tileProvider) {
    const imgTile = tile;
    const tileCoord = tile.getTileCoord();
    const tileSrc = tileProvider.getTile([tileCoord[0], tileCoord[1], -tileCoord[2] - 1]);
    imgTile.getImage().src = tileSrc;
  }

  /**
   * This function is the custom tile loader function of
   * TileLayer
   * @param {ol/Tile} tile
   * @param {M/provider/Tile} tileProvider
   * @function
   * @api
   */
  loadTile(tile, opts, target) {
    const imgTile = tile;
    const tileCoord = tile.getTileCoord();
    target.tileLoadFunction(tileCoord[0], tileCoord[1], -tileCoord[2] - 1).then((tileSrc) => {
      if (tileSrc) {
        imgTile.getImage().src = tileSrc;
      } else {
        imgTile.getImage().src = DEFAULT_WHITE_TILE;
      }
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
        this.tileProvider_ = tileProvider;
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
   * This function gets the number zoom levels of the layer.
   * @function
   * @public
   * @return {number}
   * @api
   */
  getMaxZoomLevel() {
    return this.maxZoomLevel_;
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

    if (obj instanceof MBTiles) {
      equals = (this.name === obj.name);
    }

    return equals;
  }

  /**
   * This methods returns a layer clone of this instance
   * @return {ol/layer/Tile}
   */
  cloneOLLayer() {
    let olLayer = null;
    if (this.ol3Layer != null) {
      const properties = this.ol3Layer.getProperties();
      olLayer = new ol.layer.Tile(properties);
    }
    return olLayer;
  }
}

export default MBTiles;
