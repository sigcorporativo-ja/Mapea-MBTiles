/**
 * @entry
 */
import 'configuration';
import extendImpl from 'impl/prototype-extend';
import extendMap from './Map.js';
import extendLayerType from './LayerType.js';

const extend = () => {
  extendMap();
  extendLayerType();
  extendImpl();
};

extend();
