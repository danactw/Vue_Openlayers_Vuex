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
import GeoJSON from 'ol/format/GeoJSON';
import { Draw, Modify, Select, Translate, Snap } from 'ol/interaction';
import { Circle as CircleStyle, RegularShape, Fill, Stroke, Style, Text } from 'ol/style';
import { getLength, getArea } from 'ol/sphere';
import { Point, LineString } from 'ol/geom';
import { useStore } from 'vuex';

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

    const vectorStyle = {
      'Point': new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({
            color: '#ffcc33',
          }),
        })
      }),
      'LineString': new Style({
        stroke: new Stroke({
          color: 'blue',
          width: 2
        })
      }),
      'Polygon': new Style({
        fill: new Fill({
          color: 'rgba(0, 153, 0, 0.3)'
        }),
        stroke: new Stroke({
          color: 'rgba(0, 153, 0,1)',
          width: 2
        }),
      }),
      'Circle': new Style({
        fill: new Fill({
          color: 'rgba(255, 128, 128,0.5)'
        }),
        stroke: new Stroke({
          color: 'rgba(255, 128, 128,1)',
          width: 2
        }),
      }),
    }
    const hintStyle = new Style({
      text: new Text({
        font: '12px Calibri,sans-serif',
        fill: new Fill({
          color: 'rgba(255, 255, 255, 1)',
        }),
        backgroundFill: new Fill({
          color: 'rgba(0, 0, 0, 0.4)',
        }),
        padding: [2, 2, 2, 2],
        textAlign: 'left',
        offsetX: 15,
      }),
    });
    const outputStyle = new Style({
      text: new Text({
        font: '14px Calibri,sans-serif',
        fill: new Fill({
          color: 'rgba(255, 255, 255, 1)',
        }),
        backgroundFill: new Fill({
          color: 'rgba(0, 0, 0, 0.7)',
        }),
        padding: [3, 3, 3, 3],
        textBaseline: 'bottom',
        offsetY: -15,
      }),
      image: new RegularShape({
        radius: 8,
        points: 3,
        angle: Math.PI,
        displacement: [0, 10],
        fill: new Fill({
          color: 'rgba(0, 0, 0, 0.7)',
        }),
      }),
    });
    const segmentStyle = new Style({
      text: new Text({
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
      image: new RegularShape({
        radius: 6,
        points: 3,
        angle: Math.PI,
        displacement: [0, 8],
        fill: new Fill({
          color: 'rgba(0, 0, 0, 0.4)',
        }),
      }),
    });

    const segmentStyles = [segmentStyle];

    const formatLength = function (line) {
      const length = getLength(line);
      let output;
      if (length > 100) {
        output = `${Math.round((length / 1000) * 100) / 100} km`;
      } else {
        output = `${Math.round(length * 100) / 100} m`;
      }
      return output;
    };

    const formatPolygonArea = function (polygon) {
      const area = getArea(polygon);
      let output;
      if (area > 10000) {
        output = `${Math.round((area / 1000000) * 100) / 100} km\xB2`;
      } else {
        output = `${Math.round(area * 100) / 100} m\xB2`;
      }
      return output;
    };

    function styleFunction (feature, showHint) {
      const geometry = feature.getGeometry();
      const type = geometry.getType();
      const style = [vectorStyle[type]]
      let measureOutput, measureOutputCoord, segmentOutputCoord;
      if ( type === store.state.selectOptions['drawType']) {
        if (store.state.selectOptions['drawType'] === 'LineString') {
          measureOutput = formatLength(geometry)
          measureOutputCoord = new Point(geometry.getLastCoordinate())
          segmentOutputCoord = geometry
        } else if (store.state.selectOptions['drawType'] === 'Polygon') {
          measureOutput = formatPolygonArea(geometry)
          measureOutputCoord = geometry.getInteriorPoint()
          segmentOutputCoord = new LineString(geometry.getCoordinates()[0])
        }
      }
      if ( measureOutput && store.state.addOptionToDraw[0].checked ) {
        outputStyle.setGeometry(measureOutputCoord);
        outputStyle.getText().setText(measureOutput);
        style.push(outputStyle)
      }
      // if (showSegments.value && segmentOutputCoord) {
      if ( segmentOutputCoord && store.state.addOptionToDraw[1].checked ) {
        let count = 0
        segmentOutputCoord.forEachSegment(function (a, b) {
          const segment = new LineString([a, b]);
          const label = formatLength(segment);
          if (segmentStyles.length - 1 < count) {
            segmentStyles.push(segmentStyle.clone());
          }
          const segmentPoint = new Point(segment.getCoordinateAt(0.5));
          segmentStyles[count].setGeometry(segmentPoint);
          segmentStyles[count].getText().setText(label);
          style.push(segmentStyles[count]);
          count++;
        });
      }
      if ( showHint && type==='Point') {
        hintStyle.getText().setText(hintMsg.value);
        style.push(hintStyle);
      }
      return style
    };
    const newFeature = new VectorLayer({
      source: new VectorSource(),
      style: function (feature) {
        return styleFunction(feature)
      },
    })
    const USLayer = new VectorLayer({
      source: new VectorSource({
        url: 'https://openlayers.org/data/vector/us-states.json',
        format: new GeoJSON(),
        wrapX: false,
      }),
    });

    const draws = []
    for (let i = 0; i < drawType.length ; i++ ) {
      const showHint = true
      draws.push(
        new Draw({
        type: drawType[i],
        source: newFeature.getSource(),
        style: function (feature) {
          return styleFunction(feature, showHint)
        }
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

    const select = new Select({
      wrapX: false,
    });
    const translate = new Translate({
      features: select.getFeatures() 
    })
    const modify = new Modify({
      features: select.getFeatures()
    });
    const snap = new Snap({
      source: newFeature.getSource(),
      pixelTolerance: 15
    })
    function clearAllInteractions () {
      draws.forEach(draw=> draw.setActive(false))
      modify.setActive(false)
      translate.setActive(false)
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
          USLayer,
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
      map.value.addInteraction(select)
      map.value.addInteraction(modify)
      map.value.addInteraction(translate)
      map.value.addInteraction(snap)
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