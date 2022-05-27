<template>
  <div id="map" class="fullMap" ref="mapContainer"></div>
  <div class="overlayContainer" ref="overlayContainer"> {{ msg }} </div>
</template>

<script>
import { shallowRef, onMounted, markRaw, ref } from 'vue';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { OSM, VectorTile as VectorTileSource} from 'ol/source';
import { Tile as TileLayer, VectorTile as VectorTileLayer } from 'ol/layer';
import MVT from 'ol/format/MVT';
import {Fill, Stroke, Style} from 'ol/style';
import Overlay from 'ol/Overlay';

export default {
  setup() {
    const mapContainer = shallowRef(null);
    const map = shallowRef(null);
    const overlayContainer = ref(null)
    const overlay = ref(null)
    const msg = ref(null)
    const selectedCountry = ref({})

    const country = new Style({
      stroke: new Stroke({
        color: 'gray',
        width: 1,
      }),
      fill: new Fill({
        color: 'rgba(20,20,20,0.5)',
      }),
    });
    const selectedStyle = new Style({
      stroke: new Stroke({
        color: 'rgba(200,20,20,0.8)',
        width: 2,
      }),
      fill: new Fill({
        color: 'rgba(200,20,20,0.4)',
      }),
    });

    const vectorLayer = new VectorTileLayer({
      declutter: true,
      source: new VectorTileSource({
        maxZoom: 15,
        format: new MVT({
          idProperty: 'iso_a3',
        }),
        url:
          'https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/' +
          'ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf',
      }),
      style: country,
    });

    const selectionLayer = new VectorTileLayer({
      renderMode: 'vector',
      source: vectorLayer.getSource(),
      style: function (feature) {
        if (feature.getId() in selectedCountry.value) {
          return selectedStyle;
        }
      },
    });

    const vectorBaseMap = new VectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        url: 'https://basemaps.arcgis.com/v1/arcgis/rest/services/World_Basemap/VectorTileServer/tile/{z}/{y}/{x}.pbf',
      }),
    })

    onMounted(() => {
      map.value = markRaw(new Map({
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          vectorLayer,
          selectionLayer,
          vectorBaseMap
        ],
        target: 'map',
        view: new View({
          center: [0, 0],
          zoom: 2,
        }),
      }))

      // Overlay: new Overlay一定要放在onMounted裡
      overlay.value = new Overlay({ 
        element: overlayContainer.value,
        positioning: 'center-left',
        offset: [15, 0]
      }) 

      map.value.addOverlay(overlay.value)
      
      map.value.on('click', (event) => {
        vectorLayer.getFeatures(event.pixel).then(function (features) {
          console.log(features);
          if (!features.length) {
            selectedCountry.value = {};
            selectionLayer.changed();
            return;
          }
          const feature = features[0];
          if (!feature) {
            return;
          }
          const featureId = feature.getId();
          // add selected feature to lookup
          selectedCountry.value[featureId] = feature;

          selectionLayer.changed();
        });
      })

      map.value.on('pointermove', e => {
        const currentCoord = e.coordinate
        overlay.value.setPosition(currentCoord)
        msg.value = map.value.getFeaturesAtPixel(e.pixel)[0].getProperties().layer
      })
    })

  return { map, mapContainer, overlayContainer, msg }
}
}
</script>

<style>
</style>