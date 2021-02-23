const extendMap = () => {
  M.impl.Map.Z_INDEX[M.layer.type.MBTiles] = 2000;
  M.impl.Map.Z_INDEX[M.layer.type.MBTilesVector] = 9999;
  M.impl.Map.registerBaseLayerType(M.layer.type.MBTiles);

  /**
   * This function gets the MBtiles layers added to the map
   *
   * @function
   * @param {Array<M.Layer>} filters to apply to the search
   * @returns {Array<M.layer.MBtiles>} layers from the map
   */
  M.impl.Map.prototype.getMBTiles = function getMBTiles(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;

    const allLayers = this.layers_;
    const mbtilesLayers = allLayers.filter((layer) => {
      return (layer.type === M.layer.type.MBTiles);
    });

    if (M.utils.isNullOrEmpty(filters)) {
      filters = [];
    }
    if (!M.utils.isArray(filters)) {
      filters = [filters];
    }

    if (filters.length === 0) {
      foundLayers = mbtilesLayers;
    } else {
      filters.forEach((filterLayer) => {
        const filteredMBTilesLayers = mbtilesLayers.filter((mbtileLayer) => {
          let layerMatched = true;
          if (!foundLayers.includes(mbtileLayer)) {
            // type
            if (!M.utils.isNullOrEmpty(filterLayer.type)) {
              layerMatched = (layerMatched && (filterLayer.type === mbtileLayer.type));
            }
            // URL
            if (!M.utils.isNullOrEmpty(filterLayer.url)) {
              layerMatched = (layerMatched && (filterLayer.url === mbtileLayer.url));
            }
            // name
            if (!M.utils.isNullOrEmpty(filterLayer.name)) {
              layerMatched = (layerMatched && (filterLayer.name === mbtileLayer.name));
            }
            // legend
            if (!M.utils.isNullOrEmpty(filterLayer.legend)) {
              layerMatched = (layerMatched && (filterLayer.legend === mbtileLayer.legend));
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredMBTilesLayers);
      });
    }
    return foundLayers;
  };

  /**
   * This function adds the MBtiles layers to the map
   *
   * @function
   * @param {Array<M.layer.MBtiles>} layers
   * @returns {Map}
   */
  M.impl.Map.prototype.addMBTiles = function addMBTiles(layers) {
    const baseLayers = this.getBaseLayers();
    let existsBaseLayer = (baseLayers.length > 0);

    const addedLayers = [];
    layers.forEach((layer) => {
      if (layer.type === M.layer.type.MBTiles) {
        if (!M.utils.includes(this.layers_, layer)) {
          layer.getImpl().addTo(this.facadeMap_);
          this.layers_.push(layer);
          addedLayers.push(layer);

          if (layer.transparent !== true) {
            layer.setVisible(!existsBaseLayer);
            existsBaseLayer = true;
            layer.setZIndex(M.impl.Map.Z_INDEX_BASELAYER);
          } else if (layer.getZIndex() == null) {
            const zIndex = this.layers_.length + M.impl.Map.Z_INDEX[M.layer.type.MBTiles];
            layer.setZIndex(zIndex);
          }
        }
      }
    });

    const calculateResolutions = (addedLayers.length > 0 && !existsBaseLayer) ||
      addedLayers.some(l => l.transparent !== true && l.isVisible());
    if (calculateResolutions) {
      this.updateResolutionsFromBaseLayer();
    }

    return this;
  };

  /**
   * This function removes the MBtiles layers to the map
   *
   * @function
   * @param {Array<M.layer.MBtiles>} layers
   * @returns {Map}
   */
  M.impl.Map.prototype.removeMBTiles = function removeMBTiles(layers) {
    const mbtilesMapLayers = this.getMBTiles(layers);
    mbtilesMapLayers.forEach((mbtilesLayer) => {
      this.layers_ = this.layers_.filter(layer => !layer.equals(mbtilesLayer));
      mbtilesLayer.getImpl().destroy();
      mbtilesLayer.fire(M.evt.REMOVED_FROM_MAP, [mbtilesLayer]);
    });

    return this;
  };

  /**
   * This function gets the MBtiles layers added to the map
   *
   * @function
   * @param {Array<M.Layer>} filters to apply to the search
   * @returns {Array<M.layer.MBtiles>} layers from the map
   */
  M.impl.Map.prototype.getMBTilesVector = function getMBTilesVector(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;

    const allLayers = this.layers_;
    const mbtilesLayers = allLayers.filter((layer) => {
      return (layer.type === M.layer.type.MBTilesVector);
    });

    if (M.utils.isNullOrEmpty(filters)) {
      filters = [];
    }
    if (!M.utils.isArray(filters)) {
      filters = [filters];
    }

    if (filters.length === 0) {
      foundLayers = mbtilesLayers;
    } else {
      filters.forEach((filterLayer) => {
        const filteredMBTilesLayers = mbtilesLayers.filter((mbtileLayer) => {
          let layerMatched = true;
          if (!foundLayers.includes(mbtileLayer)) {
            // type
            if (!M.utils.isNullOrEmpty(filterLayer.type)) {
              layerMatched = (layerMatched && (filterLayer.type === mbtileLayer.type));
            }
            // URL
            if (!M.utils.isNullOrEmpty(filterLayer.url)) {
              layerMatched = (layerMatched && (filterLayer.url === mbtileLayer.url));
            }
            // name
            if (!M.utils.isNullOrEmpty(filterLayer.name)) {
              layerMatched = (layerMatched && (filterLayer.name === mbtileLayer.name));
            }
            // legend
            if (!M.utils.isNullOrEmpty(filterLayer.legend)) {
              layerMatched = (layerMatched && (filterLayer.legend === mbtileLayer.legend));
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredMBTilesLayers);
      });
    }
    return foundLayers;
  };

  /**
   * This function adds the MBtiles layers to the map
   *
   * @function
   * @param {Array<M.layer.MBtiles>} layers
   * @returns {Map}
   */
  M.impl.Map.prototype.addMBTilesVector = function addMBTilesVector(layers) {
    const baseLayers = this.getBaseLayers();
    const existsBaseLayer = (baseLayers.length > 0);

    layers.forEach((layer) => {
      // checks if layer is WFS and was added to the map
      if (layer.type === M.layer.type.MBTilesVector) {
        if (!M.utils.includes(this.layers_, layer)) {
          layer.getImpl().addTo(this.facadeMap_);
          this.layers_.push(layer);
          layer.setZIndex(layer.getZIndex());
          if (layer.getZIndex() == null) {
            const zIndex = this.layers_.length + M.impl.Map.Z_INDEX[M.layer.type.MBTilesVector];
            layer.setZIndex(zIndex);
          }
          if (!existsBaseLayer) {
            this.updateResolutionsFromBaseLayer();
          }
        }
      }
    });

    return this;
  };

  /**
   * This function removes the MBtiles layers to the map
   *
   * @function
   * @param {Array<M.layer.MBtiles>} layers
   * @returns {Map}
   */
  M.impl.Map.prototype.removeMBTilesVector = function removeMBTilesVector(layers) {
    const mbtilesMapLayers = this.getMBTilesVector(layers);
    mbtilesMapLayers.forEach((mbtilesLayer) => {
      this.layers_ = this.layers_.filter(layer => !layer.equals(mbtilesLayer));
      mbtilesLayer.getImpl().destroy();
      mbtilesLayer.fire(M.evt.REMOVED_FROM_MAP, [mbtilesLayer]);
    });

    return this;
  };


  M.impl.Map.registerExternalFunction('addMBTiles', 'addLayers');
  M.impl.Map.registerExternalFunction('addMBTilesVector', 'addLayers');
  M.impl.Map.registerExternalFunction('getMBTiles', 'getLayers');
  M.impl.Map.registerExternalFunction('getMBTilesVector', 'getLayers');
  M.impl.Map.registerExternalFunction('removeMBTiles', 'removeLayers');
  M.impl.Map.registerExternalFunction('removeMBTilesVector', 'removeLayers');
};


export default extendMap;
