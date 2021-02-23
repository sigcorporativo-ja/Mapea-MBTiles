const extendMap = () => {
  /**
   * This function gets the MBtiles layers added to the map
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam
   * @returns {Array<M.layer.MBtiles>} layers from the map
   * @api
   */
  M.Map.prototype.getMBTiles = function getMBTiles(layersParamVar) {
    let layersParam = layersParamVar;

    if (M.utils.isNull(layersParam)) {
      layersParam = [];
    } else if (!M.utils.isArray(layersParam)) {
      layersParam = [layersParam];
    }

    const layers = this.getImpl().getMBTiles(layersParam).sort(M.Map.LAYER_SORT);

    return layers;
  };

  /**
   * This function adds the MBtiles layers to the map
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.MBtiles>} layersParam
   * @returns {Map}
   * @api
   */
  M.Map.prototype.addMBTiles = function addMBTiles(layersParamVar) {
    let layersParam = layersParamVar;
    if (!M.utils.isNullOrEmpty(layersParam)) {
      if (!M.utils.isArray(layersParam)) {
        layersParam = [layersParam];
      }

      const mbtilesLayers = [];
      layersParam.forEach((layerParam) => {
        if (M.utils.isObject(layerParam) && layerParam.type === M.layer.type.MBTiles) {
          layerParam.setMap(this);
          mbtilesLayers.push(layerParam);
        }
      });

      this.getImpl().addMBTiles(mbtilesLayers);
      this.fire(M.evt.ADDED_LAYER, [mbtilesLayers]);
      this.fire(M.evt.ADDED_MBTILES, [mbtilesLayers]);
    }
    return this;
  };

  /**
   * This function removes the MBtiles layers to the map
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.MBtiles>} layersParam
   * @returns {Map}
   * @api
   */
  M.Map.prototype.removeMBTiles = function removeMBTiles(layersParam) {
    if (!M.utils.isNullOrEmpty(layersParam)) {
      const mbtilesLayers = this.getMBTiles(layersParam);
      if (mbtilesLayers.length > 0) {
        this.getImpl().removeMBTiles(mbtilesLayers);
      }
    }
    return this;
  };

  /**
   * This function gets the MBtiles layers added to the map
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam
   * @returns {Array<M.layer.MBtiles>} layers from the map
   * @api
   */
  M.Map.prototype.getMBTilesVector = function getMBTilesVector(layersParamVar) {
    let layersParam = layersParamVar;

    if (M.utils.isNull(layersParam)) {
      layersParam = [];
    } else if (!M.utils.isArray(layersParam)) {
      layersParam = [layersParam];
    }

    const layers = this.getImpl().getMBTilesVector(layersParam).sort(Map.LAYER_SORT);

    return layers;
  };

  /**
   * This function adds the MBtiles layers to the map
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.MBtiles>} layersParam
   * @returns {Map}
   * @api
   */
  M.Map.prototype.addMBTilesVector = function addMBTilesVector(layersParamVar) {
    let layersParam = layersParamVar;
    if (!M.utils.isNullOrEmpty(layersParam)) {
      if (!M.utils.isArray(layersParam)) {
        layersParam = [layersParam];
      }

      const mbtilesLayers = [];
      layersParam.forEach((layerParam) => {
        if (M.utils.isObject(layerParam) && layerParam.type === M.layer.type.MBTilesVector) {
          layerParam.setMap(this);
          mbtilesLayers.push(layerParam);
        }
      });

      this.getImpl().addMBTilesVector(mbtilesLayers);
      this.fire(M.evt.ADDED_LAYER, [mbtilesLayers]);
      this.fire(M.evt.ADDED_MBTILES_VECTOR, [mbtilesLayers]);
    }
    return this;
  };

  /**
   * This function removes the MBtiles layers to the map
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.MBtiles>} layersParam
   * @returns {Map}
   * @api
   */
  M.Map.prototype.removeMBTilesVector = function removeMBTilesVector(layersParam) {
    if (!M.utils.isNullOrEmpty(layersParam)) {
      const mbtilesLayers = this.getMBTilesVector(layersParam);
      if (mbtilesLayers.length > 0) {
        this.getImpl().removeMBTilesVector(mbtilesLayers);
      }
    }
    return this;
  };
};


export default extendMap;
