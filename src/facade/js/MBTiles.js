/**
 * @module M/layer/MBTiles
 */
import MBTilesImpl from 'impl/MBTiles.js';

/**
 * @classdesc
 * Main constructor of the class. Creates a MBTiles layer
 * with parameters specified by the user
 * @api
 */
class MBTiles extends M.Layer {
  /**
   * @constructor
   * @extends {M.Layer}
   * @param {string|Mx.parameters.WMS} userParameters parameters
   * @param {Mx.parameters.LayerOptions} options provided by the user
   * @param {Object} vendorOptions vendor options for the base library
   * @api
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    // Register Type
    M.layer.type.registerLayerType(M.layer.type.MBTiles);
    // checks if the implementation can create MBTiles
    if (M.utils.isUndefined(MBTilesImpl)) {
      M.exception(M.language.getValue('exception').mbtiles_method);
    }

    /**
     * Implementation of this layer
     * @public
     * @type {M/impl/layer/MBTilesVector}
     */
    const impl = new MBTilesImpl(userParameters, options, vendorOptions);

    // calls the super constructor
    super(userParameters, impl);

    /**
     * MBTiles name
     * @public
     * @type {string}
     */
    this.name = userParameters.name;

    /**
     * MBTiles legend
     * @public
     * @type {string}
     */
    this.legend = userParameters.legend;

    /**
     * MBTiles options
     * @public
     * @type {object}
     */
    this.options = options;
  }

  /**
   * 'type' This property indicates if
   * the layer was selected
   */
  get type() {
    return M.layer.type.MBTiles;
  }

  set type(newType) {
    if (!M.utils.isUndefined(newType) &&
      !M.utils.isNullOrEmpty(newType) && (newType !== M.layer.type.MBTiles)) {
      M.exception('El tipo de capa debe ser \''.concat(M.layer.type.MBTiles).concat('\' pero se ha especificado \'').concat(newType).concat('\''));
    }
  }

  /**
   * Calculates the maxExtent of this layer, being the first value found in this order:
   * 1. checks if the user specified a maxExtent parameter for the layer.
   * 2. gets the maxExtent from the layer mbtile file.
   * 3. gets the maxExtent of the map.
   * 4. gets the maxExtent from the map projection.
   *
   * @function
   * @param {Object} callbackFn Optional callback function
   * @return {Array<number>} Max extent of the layer
   * @api
   */
  getMaxExtent(callbackFn) {
    let maxExtent;
    if (M.utils.isNullOrEmpty(this.userMaxExtent)) { // 1
      this.getImpl().getExtentFromProvider().then((mbtilesExtent) => {
        if (M.utils.isNullOrEmpty(mbtilesExtent)) { // 2
          if (M.utils.isNullOrEmpty(this.map_.userMaxExtent)) { // 3
            const projMaxExtent = this.map_.getProjection().getExtent();
            this.maxExtent_ = projMaxExtent; // 4
          } else {
            this.maxExtent_ = this.map_.userMaxExtent;
            maxExtent = this.maxExtent_;
          }
        } else {
          this.maxExtent_ = mbtilesExtent;
        }
        if (M.utils.isFunction(callbackFn)) {
          callbackFn(this.maxExtent_);
        }
      });
    } else {
      maxExtent = this.userMaxExtent;
    }
    if (!M.utils.isNullOrEmpty(maxExtent) && M.utils.isFunction(callbackFn)) {
      callbackFn(maxExtent);
    } else if (M.utils.isNullOrEmpty(maxExtent)) {
      maxExtent = this.maxExtent_;
    }
    return maxExtent;
  }

  /**
   * Async version of getMaxExtent.
   * @function
   * @return {Promise} - Promise object represents the maxExtent of the layer
   * @api
   */
  calculateMaxExtent() {
    return new Promise(resolve => this.getMaxExtent(resolve));
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
      equals = this.name === obj.name;
    }
    return equals;
  }
}

export default MBTiles;
