<template>
  <GridLayout>
    <template v-slot:sidebar>
      <p class="loadingReminder">Loading may take some time~</p>
      <h2>Vector Layer</h2>
      <InputRadio :items="$store.state.vectorLayersTitle" itemRef="vectorLayersVisibility"/>
      <SelectOption :selection="vectorSelectType" itemRef="vectorSelectType" v-show="$store.state.inputRadio['vectorLayersVisibility']==='Countries'" />
      <fieldset class="coordinate" v-show="$store.state.inputRadio['vectorLayersVisibility']==='Eco-Regions'">
        <legend>Info</legend>
        <small>Click on the region to display info</small>
        <h4>BIOME_NAME</h4>
        <span>{{ info.BIOME_NAME }} </span>
        <h4>ECO_NAME</h4>
        <span>{{ info.ECO_NAME }} </span>
        <h4>REALM</h4>
        <span>{{ info.REALM }} </span>
      </fieldset>
    </template>
  </GridLayout>  
  <div class="overlayContainer" ref="overlayContainer"> {{ msg }} </div>
</template>

<script>
import { shallowRef, onMounted, markRaw, ref, watchEffect, watch } from 'vue';
import { useStore } from 'vuex';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import LayerGroup from 'ol/layer/Group';
import { Tile as TileLayer, Vector as VectorLayer , VectorTile as VectorTileLayer } from 'ol/layer';
import VectorImageLayer from 'ol/layer/VectorImage';
import { OSM, Vector as VectorSource, VectorTile as VectorTileSource } from 'ol/source';
import { Fill, Stroke, Style } from 'ol/style';
import { GeoJSON, MVT } from 'ol/format';
import Overlay from 'ol/Overlay';
import InputRadio from '@/components/InputRadio.vue';
import SelectOption from '@/components/SelectOption.vue';
import GridLayout from '@/components/GridLayout.vue';

export default {
  components: { InputRadio, SelectOption, GridLayout },
  setup() {
      const store = useStore();
      const mapContainer = shallowRef(null);
      const map = shallowRef(null);
      const overlayContainer = ref(null);
      const overlay = ref(null);
      const msg = ref(null);
      const selectedCountry = ref({});
      const info = ref({});
      const vectorSelectType = ["Single Select", "Multi Select", "Single Select on hover"];
      const baseMap = new TileLayer({
          source: new OSM(),
      });
      const countriesStyle = new Style({
          stroke: new Stroke({
              color: "gray",
              width: 1,
          }),
          fill: new Fill({
              color: "rgba(20,20,20,0.5)",
          }),
      });
      const Countries = new VectorTileLayer({
          declutter: true,
          source: new VectorTileSource({
              maxZoom: 15,
              format: new MVT({
                  idProperty: "iso_a3",
              }),
              url: "https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/" +
                  "ne:ne_10m_admin_0_countries@EPSG:900913@pbf/{z}/{x}/{-y}.pbf",
          }),
          style: countriesStyle,
          visible: true,
          title: "Countries"
      });
      const selectedStyle = new Style({
          stroke: new Stroke({
              color: "rgba(200,20,20,0.8)",
              width: 2,
          }),
          fill: new Fill({
              color: "rgba(200,20,20,0.4)",
          }),
      });
      const selectionLayer = new VectorTileLayer({
          renderMode: "vector",
          source: Countries.getSource(),
          style: function (feature) {
              if (feature.getId() in selectedCountry.value) {
                  return selectedStyle;
              }
          },
      });
      const vectorBaseMap = new VectorTileLayer({
          source: new VectorTileSource({
              format: new MVT(),
              url: "https://basemaps.arcgis.com/v1/arcgis/rest/services/World_Basemap/VectorTileServer/tile/{z}/{y}/{x}.pbf",
          }),
          visible: false,
          title: "Base Map"
      });
      const ecoRegionsStyle = new Style({
          fill: new Fill({
              color: "rgba(102, 204, 255, 0.2)"
          }),
          stroke: new Stroke({
              color: "rgb(51, 153, 255)",
              width: 1
          })
      });
      const selectedEcoRegionsStyle = (feature) => {
          const color = feature.get("COLOR") || "#eeeeee";
          ecoRegionsStyle.getFill().setColor(color);
          return ecoRegionsStyle;
      };
      const ecoRegions = new VectorImageLayer({
          imageRatio: 2,
          source: new VectorSource({
              url: "https://openlayers.org/data/vector/ecoregions.json",
              format: new GeoJSON(),
          }),
          style: selectedEcoRegionsStyle,
          visible: false,
          title: "Eco-Regions"
      });
      const ecoRegionsOverlay = new VectorLayer({
          source: new VectorSource(),
          map: map.value,
          style: new Style({
              stroke: new Stroke({
                  color: "rgba(255, 255, 255, 1)",
                  width: 3,
              }),
              fill: new Fill({
                  color: "rgba(255, 255, 255, 0.3)"
              })
          }),
      });
      const vectorLayers = ref([Countries, vectorBaseMap, ecoRegions]);
      const vectorLayerGroup = new LayerGroup({
          layers: vectorLayers.value
      });
      store.dispatch("getVectorLayersTitle", vectorLayers.value);
      watchEffect(() => {
          vectorLayerGroup.getLayers().forEach(layer => {
              const layerTitle = layer.get("title");
              if (layerTitle === store.state.inputRadio["vectorLayersVisibility"])
                  layer.setVisible(true);
              else
                  layer.setVisible(false);
          });
      });
      function highlightCountry(e) {
          Countries.getFeatures(e.pixel).then(function (features) {
              if (!features.length) {
                  selectedCountry.value = {};
                  selectionLayer.changed();
                  return;
              }
              const feature = features[0];
              if (!feature)
                  return;
              if (store.state.selectOptions["vectorSelectType"] !== "Multi Select") {
                  selectedCountry.value = {};
              }
              const featureId = feature.getId();
              selectedCountry.value[featureId] = feature;
              selectionLayer.changed();
          });
      }
      watch(() => store.state.selectOptions["vectorSelectType"], () => {
          selectedCountry.value = {};
          selectionLayer.changed();
      });
      function showOverlay(e) {
          const feature = map.value.getFeaturesAtPixel(e.pixel)[0];
          const currentCoord = e.coordinate;
          overlay.value.setPosition(currentCoord);
          if (feature) {
              msg.value = feature.getProperties().layer;
          }
          ;
      }
      let highlight;
      function showInfo(e) {
          const feature = map.value.forEachFeatureAtPixel(e.pixel, feature => feature);
          info.value["BIOME_NAME"] = feature ? feature.getProperties().BIOME_NAME : "";
          info.value["ECO_NAME"] = feature ? feature.getProperties().ECO_NAME : "";
          info.value["REALM"] = feature ? feature.getProperties().REALM : "";
          if (feature !== highlight) {
              if (highlight)
                  ecoRegionsOverlay.getSource().removeFeature(highlight);
              if (feature)
                  ecoRegionsOverlay.getSource().addFeature(feature);
              highlight = feature;
          }
      }
      function clear() {
          map.value.removeLayer(selectionLayer);
          selectedCountry.value = {};
          selectionLayer.changed();
          map.value.removeOverlay(overlay.value);
          map.value.removeLayer(ecoRegionsOverlay);
      }
      onMounted(() => {
          map.value = markRaw(new Map({
              layers: [baseMap, vectorLayerGroup],
              target: "map",
              view: new View({
                  center: [7086553.329346977, 4732139.984106977],
                  zoom: 3,
              }),
          }));
          // Overlay: new Overlay一定要放在onMounted裡
          overlay.value = new Overlay({
              element: overlayContainer.value,
              positioning: "center-left",
              offset: [15, 0]
          });
          watchEffect(() => {
              clear();
              switch (store.state.inputRadio["vectorLayersVisibility"]) {
                  case "Countries":
                      map.value.addLayer(selectionLayer);
                      map.value.on(["click", "pointermove"], e => {
                          if (store.state.selectOptions["vectorSelectType"] === "Single Select on hover" && e.type !== "pointermove" ||
                              store.state.selectOptions["vectorSelectType"] !== "Single Select on hover" && e.type === "pointermove") {
                              return;
                          }
                          highlightCountry(e);
                      });
                      break;
                  case "Base Map":
                      map.value.addOverlay(overlay.value);
                      map.value.on("pointermove", e => showOverlay(e));
                      break;
                  case "Eco-Regions":
                      map.value.addLayer(ecoRegionsOverlay);
                      map.value.on("click", e => showInfo(e));
                      break;
              }
          });
      });
      return { map, mapContainer, overlayContainer, msg, info, vectorSelectType };
  },
}
</script>

<style>
.loadingReminder {
  color: red;
}
</style>