/**
 * @module M/layer/MBTilesVector
 */
import MBTilesVectorImpl from 'impl/MBTilesVector.js';
/**
 * Possibles modes of MBTilesVector
 *
 * @const
 * @public
 * @api
 */
export const mode = {
  RENDER: 'render',
  FEATURE: 'feature',
};

/**
 * @classdesc
 * Main constructor of the class. Creates a MBTilesVector layer
 * with parameters specified by the user
 * @api
 */
class MBTilesVector extends M.layer.Vector {
  constructor(userParameters = {}, options = {}, vendorOptions = {}) {
    // Register Type
    M.layer.type.registerLayerType(M.layer.type.MBTilesVector);

    const impl = new MBTilesVectorImpl(userParameters, options, vendorOptions);
    super(userParameters, options, vendorOptions, impl);

    if (M.utils.isUndefined(MBTilesVectorImpl)) {
      M.exception('La implementación usada no puede crear capas Vector');
    }
  }

  /**
   * @getter
   * @api
   */
  get type() {
    return M.layer.type.MBTilesVector;
  }

  /**
   * @setter
   * @api
   */
  set type(newType) {
    if (!M.utils.isUndefined(newType) &&
      !M.utils.isNullOrEmpty(newType) && (newType !== M.layer.type.MBTilesVector)) {
      M.eException('El tipo de capa debe ser \''.concat(M.layer.type.MBTilesVector).concat('\' pero se ha especificado \'').concat(newType).concat('\''));
    }
  }

  /**
   * This method calculates the maxExtent of this layer:
   * 1. Check if the user specified a maxExtent parameter
   * 2. Gets the map maxExtent
   * 3. Sets the maxExtent from the map projection
   *
   * @function
   * @api
   */
  getMaxExtent() {
    let maxExtent = this.userMaxExtent; // 1
    if (M.utils.isNullOrEmpty(maxExtent)) {
      maxExtent = this.map_.userMaxExtent; // 2
      if (M.utils.isNullOrEmpty(maxExtent)) {
        maxExtent = this.map_.getProjection().getExtent(); // 3
      }
    }
    return maxExtent;
  }

  /**
   * This method calculates the maxExtent of this layer:
   * 1. Check if the user specified a maxExtent parameter
   * 2. Gets the map maxExtent
   * 3. Sets the maxExtent from the map projection
   * Async version of getMaxExtent
   *
   * @function
   * @api
   */
  calculateMaxExtent() {
    return new Promise(resolve => resolve(this.getMaxExtent()));
  }

  /**
   * This function sets the style to layer
   *
   * @function
   * @public
   * @param {M.Style}
   * @param {bool}
   */
  setStyle(styleParam, applyToFeature = false, defaultStyle = MBTilesVector.DEFAULT_OPTIONS_STYLE) {
    super.setStyle(styleParam, applyToFeature, defaultStyle);
  }

  /**
   * This function gets the projection of the map.
   * @function
   * @public
   * @api
   */
  getProjection() {
    return this.getImpl().getProjection();
  }

  /**
   * Gets the geometry type of the layer.
   * @function
   * @public
   * @return {string} geometry type of layer
   * @api
   */
  getGeometryType() {
    let geometry = null;
    const features = this.getFeatures();
    if (!M.utils.isNullOrEmpty(features)) {
      const firstFeature = features[0];
      if (!M.utils.isNullOrEmpty(firstFeature)) {
        geometry = firstFeature.getType();
      }
    }
    return geometry;
  }

  /**
   * Returns all features.
   *
   * @function
   * @public
   * @return {Array<M.RenderFeature>} Features
   * @api
   */
  getFeatures() {
    const features = this.getImpl().getFeatures();

    return features.map(olFeature => M.impl.RenderFeature.olFeature2Facade(olFeature));
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
      equals = this.name === obj.name;
    }
    return equals;
  }

  setFilter() {}

  addFeatures() {}

  removeFeatures() {}

  refresh() {}

  redraw() {}

  toGeoJSON() {}
}

/**
 * Style options by default for this layer
 *
 * @const
 * @type {object}
 * @public
 * @api
 */
MBTilesVector.DEFAULT_PARAMS = {
  fill: {
    color: '#fff',
    opacity: 0.6,
  },
  stroke: {
    color: '#827ec5',
    width: 2,
  },
  radius: 5,
};

/**
 * Default generic style for this layer
 * @const
 * @type {object}
 * @public
 * @api
 */
MBTilesVector.DEFAULT_OPTIONS_STYLE = {
  point: {
    ...MBTilesVector.DEFAULT_PARAMS,
    radius: 5,
  },
  line: {
    ...MBTilesVector.DEFAULT_PARAMS,
  },
  polygon: {
    ...MBTilesVector.DEFAULT_PARAMS,
  },
};

export default MBTilesVector;
