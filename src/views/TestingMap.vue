<template> 
  <div class="gridContainer">
    <div class="grid1">
      <div class="sidebar">
        <h2>Interactions</h2>
        <InputRadio :items="interactionType" itemRef="interactionType"/>
        <h2>Draw Type</h2>
        <SelectOption :selection="drawType" itemRef="drawType" :disabled="$store.state.inputRadio['interactionType']!=='Draw'" />
        <div class="addOptionToDraw" v-show="$store.state.inputRadio['interactionType']==='Draw'">
          <h2>Additional</h2>
          <span>
            <button @click="clearLastFeature" class="btn">Undo</button>
            <button @click="clearAllFeatures" class="btn">Clear All</button>
          </span>
          <InputCheckbox v-for="option in $store.state.addOptionToDraw" :key="option" :item="option" />
        </div>
      </div>
    </div>
    <div class="grid2">
      <div id="map" class="map" ref="mapContainer"></div>
    </div>
  </div>
</template>

<script>
import { shallowRef, onMounted, markRaw, watchEffect, computed, ref } from 'vue';
import SelectOption from '@/components/SelectOption.vue';
import InputRadio from '@/components/InputRadio.vue';
import InputCheckbox from '@/components/InputCheckbox.vue';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Draw } from 'ol/interaction';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import { useStore } from 'vuex';
import { Point } from 'ol/geom';

export default {
  components: { SelectOption, InputRadio, InputCheckbox },
  setup() {
    const store = useStore()
    const mapContainer = shallowRef(null);
    const map = shallowRef(null);
    const interactionType = ['Draw', 'Translate', 'Modify', 'Scale and Rotate']
    const drawType = ['Point', 'LineString', 'Circle', 'Polygon']
    const startDrawingMsg = 'Click to start drawing'
    const continueMsg = computed(()=>`Click to continue drawing ${store.state.selectOptions['drawType']}`);
    const hintMsg = ref(startDrawingMsg)

    const drawingStyle = {
      'Point': new Style({
        text: new Text({
          text: 'drawing-point',
          font: '12px Calibri,sans-serif',
          fill: new Fill({
            color: 'red',
          }),
          backgroundFill: new Fill({
            color: 'rgba(0, 0, 0, 0.4)',
          }),
          padding: [2, 2, 2, 2],
          textBaseline: 'bottom',
          offsetY: -12,
        }),
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.5)',
        }),
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 1)',
          lineDash: [10,10],
          width: 2
        }),
      }),
      'LineString': new Style({
        text: new Text({
          text: 'drawing-line',
          font: '12px Calibri,sans-serif',
          fill: new Fill({
            color: 'red',
          }),
          backgroundFill: new Fill({
            color: 'rgba(0, 0, 0, 0.4)',
          }),
          padding: [2, 2, 2, 2],
          textBaseline: 'bottom',
          offsetY: -12,
        }),
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.5)',
        }),
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 1)',
          lineDash: [10,10],
          width: 2
        }),
      }),
      'Polygon': new Style({
        text: new Text({
          text: 'drawing-polygon',
          font: '12px Calibri,sans-serif',
          fill: new Fill({
            color: 'red',
          }),
          backgroundFill: new Fill({
            color: 'rgba(0, 0, 0, 0.4)',
          }),
          padding: [2, 2, 2, 2],
          textBaseline: 'bottom',
          offsetY: -12,
        }),
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.5)',
        }),
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 1)',
          lineDash: [10,10],
          width: 2
        }),
      }),
      'Circle': new Style({
        text: new Text({
          text: 'drawing-circle',
          font: '12px Calibri,sans-serif',
          fill: new Fill({
            color: 'red',
          }),
          backgroundFill: new Fill({
            color: 'rgba(0, 0, 0, 0.4)',
          }),
          padding: [2, 2, 2, 2],
          textBaseline: 'bottom',
          offsetY: -12,
        }),
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.5)',
        }),
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 1)',
          lineDash: [10,10],
          width: 2
        }),
      }),
    }

    const vectorStyle = {
      'Point': new Style({
        text: new Text({
          text: 'point',
          font: '12px Calibri,sans-serif',
          fill: new Fill({
            color: 'rgba(255, 255, 255, 1)',
          }),
          backgroundFill: new Fill({
            color: 'rgba(0, 0, 0, 0.4)',
          }),
          padding: [2, 2, 2, 2],
          textBaseline: 'bottom',
          offsetY: -12,
        }),
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({
            color: '#ffcc33',
          }),
        })
      }),
      'LineString': new Style({
        text: new Text({
          text: 'lineString',
          font: '12px Calibri,sans-serif',
          fill: new Fill({
            color: 'rgba(255, 255, 255, 1)',
          }),
          backgroundFill: new Fill({
            color: 'rgba(0, 0, 0, 0.4)',
          }),
          padding: [2, 2, 2, 2],
          textBaseline: 'bottom',
          offsetY: -12,
        }),
        stroke: new Stroke({
          color: 'blue',
          width: 2
        })
      }),
      'Polygon': new Style({
        text: new Text({
          text: 'polygon',
          font: '12px Calibri,sans-serif',
          fill: new Fill({
            color: 'rgba(255, 255, 255, 1)',
          }),
          backgroundFill: new Fill({
            color: 'rgba(0, 0, 0, 0.4)',
          }),
          padding: [2, 2, 2, 2],
          textBaseline: 'bottom',
          offsetY: -12,
        }),
        fill: new Fill({
          color: 'rgba(0, 153, 0, 0.3)'
        }),
        stroke: new Stroke({
          color: 'rgba(0, 153, 0,1)',
          width: 2
        }),
      }),
      'Circle': new Style({
        text: new Text({
          text: 'circle',
          font: '12px Calibri,sans-serif',
          fill: new Fill({
            color: 'rgba(255, 255, 255, 1)',
          }),
          backgroundFill: new Fill({
            color: 'rgba(0, 0, 0, 0.4)',
          }),
          padding: [2, 2, 2, 2],
          textBaseline: 'bottom',
          offsetY: -12,
        }),
        fill: new Fill({
          color: 'rgba(255, 128, 128,0.5)'
        }),
        stroke: new Stroke({
          color: 'rgba(255, 128, 128,1)',
          width: 2
        }),
      }),
      'Segment': new Style({
        text: new Text({
          text: 'segment',
          font: '12px Calibri,sans-serif',
          fill: new Fill({
            color: 'rgba(255, 255, 255, 1)',
          }),
          backgroundFill: new Fill({
            color: 'rgba(0, 0, 0, 0.4)',
          }),
          padding: [2, 2, 2, 2],
          textBaseline: 'bottom',
          offsetY: -12,
          placement: 'line'
        })
      }),
    }

    function styleFunction (feature, showHint) {
      const geometry = feature.getGeometry();
      const type = geometry.getType();
      if (type === 'LineString') {
        vectorStyle.Segment.setGeometry(geometry)
        vectorStyle.Segment.getText().setText('segment123')
      }
      const style = [vectorStyle[type], vectorStyle.Segment]

      return style
    };
    const newFeature = new VectorLayer({
      source: new VectorSource(),
      style: function (feature) {
        // console.log(feature.getGeometry())
        // console.log(feature.getGeometry().getType())
        // console.log(feature.getGeometry().getCoordinates())
        // console.log(feature.getGeometry().getFirstCoordinate())
        // console.log(feature.getGeometry().getLastCoordinate())
        return styleFunction(feature)
      },
    })

    const draws = []
    for (let i = 0; i < drawType.length ; i++ ) {
      const showHint = true
      draws.push(
        new Draw({
        type: drawType[i],
        source: newFeature.getSource(),
        style: feature => vectorStyle[feature.getGeometry().getType()]
      })
      )
    }
    const drawStart = () => {
      hintMsg.value = continueMsg.value;
      if (store.state.addOptionToDraw[2].checked) newFeature.getSource().clear()
    }
    const drawEnd = () => {
      hintMsg.value = startDrawingMsg
    }

    function clearAllInteractions () {
      draws.forEach(draw=> draw.setActive(false))
    }

    watchEffect(() => {
      const currentDrawType = store.state.selectOptions['drawType']
      const currentDrawTypeIndex = drawType.indexOf(currentDrawType)
      clearAllInteractions()
      switch (store.state.inputRadio['interactionType']) {
        case 'Draw' :
          for (let i = 0; i < drawType.length ; i++ ) {
            if (i===currentDrawTypeIndex) {
              draws[i].setActive(true)
              draws[i].on('drawstart', drawStart)
              draws[i].on('drawend', drawEnd)
            } else draws[i].setActive(false)
          }
          break;
        case 'Modify':
          modify.setActive(true)
          break;
        case 'Translate':
          translate.setActive(true)
          break;
      }
    })

    const clearLastFeature = () => {
      const feature = newFeature.getSource().getFeatures().pop()
      newFeature.getSource().removeFeature(feature)
    }
    const clearAllFeatures = () => {
      newFeature.getSource().clear()
    }

    onMounted(() => {
      map.value = markRaw(new Map({
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          newFeature
        ],
        target: 'map',
        view: new View({
          center: [-11036062.99394863, 4759762.370261724],
          zoom: 4,
        }),
      }))

      draws.forEach(draw=> {
        if (map.value) map.value.addInteraction(draw)
      })
    })

    return { map, mapContainer, interactionType, drawType, clearLastFeature, clearAllFeatures }
  }
}
</script>

<style>
.btn {
  padding: 5px;
  margin-right: 15px;
  cursor: pointer;
  display: inline-block;
  border: none;
  height: 40px;
  font-size: 18px;
}

.btn:hover {
  transform: translateY(1px);
}
</style>