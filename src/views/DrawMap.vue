<template>
  <GridLayout>
    <template v-slot:sidebar>
      <h2>Draw Type</h2>
      <SelectOption :selection="drawType" itemRef="drawType" />
      <input type="number" min="3" max="32" v-model="regPolygon" class="regPolygon" v-show="$store.state.selectOptions['drawType'] === 'Regular Polygon' ">
      <div class="addOptionToDraw">
        <h2>Additional</h2>
        <span>
          <button @click="clearLastFeature" class="btn">Undo</button>
          <button @click="clearAllFeatures" class="btn">Clear All</button>
        </span>
        <InputCheckbox v-for="option in $store.state.addOptionToDraw" :key="option" :item="option" />
      </div>
    </template>
  </GridLayout>
</template>

<script>
import { shallowRef, onMounted, markRaw, watchEffect, computed, ref } from 'vue';
import { useStore } from 'vuex';
import SelectOption from '@/components/SelectOption.vue';
import InputRadio from '@/components/InputRadio.vue';
import InputCheckbox from '@/components/InputCheckbox.vue';
import GridLayout from '@/components/GridLayout.vue';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style, Text, RegularShape } from 'ol/style';
import { Draw } from 'ol/interaction';
import { createRegularPolygon, createBox} from 'ol/interaction/Draw';
import { getLength, getArea } from 'ol/sphere';
import { Point, LineString } from 'ol/geom';

export default {
  components: { SelectOption, InputRadio, InputCheckbox, GridLayout },
  setup() {
    const store = useStore()
    const mapContainer = shallowRef(null);
    const map = shallowRef(null);
    const drawType = ['Point', 'LineString', 'Circle', 'Regular Polygon', 'Rectangle', 'Polygon(freehand)']
    const startDrawingMsg = 'Click to start drawing'
    const continueMsg = computed(()=>`Click to continue drawing ${store.state.selectOptions['drawType']}`);
    const hintMsg = ref(startDrawingMsg)
    const regPolygon = ref(3)

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
      })
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

    function showSegment (segmentOutputCoord, style) {
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

    function styleFunction (feature, showHint) {
      const geometry = feature.getGeometry();
      const type = geometry.getType();
      const style = [vectorStyle[type]]
      let drawType, measureOutput, measureOutputCoord, segmentOutputCoord;
      switch (store.state.selectOptions['drawType']) {
        case 'Point':
          drawType = 'Point'
          break;
        case 'LineString':
          drawType = 'LineString'
          break;
        case 'Circle':
          drawType = 'Circle'
          break;
        default:
          drawType = 'Polygon'
          break;
      }
      if ( type === drawType && store.state.addOptionToDraw[0].checked) {
        if (drawType === 'LineString') {
          measureOutput = formatLength(geometry)
          measureOutputCoord = new Point(geometry.getLastCoordinate())
          segmentOutputCoord = geometry
        } else if (drawType === 'Polygon') {
          measureOutput = formatPolygonArea(geometry)
          measureOutputCoord = geometry.getInteriorPoint()
          segmentOutputCoord = new LineString(geometry.getCoordinates()[0])
        }
        outputStyle.setGeometry(measureOutputCoord);
        outputStyle.getText().setText(measureOutput);
        if (store.state.selectOptions['drawType'] !== 'Point') style.push(outputStyle)
      }
      if ( segmentOutputCoord && store.state.addOptionToDraw[1].checked ) showSegment(segmentOutputCoord, style)
      if ( showHint && type === 'Point' ) {
        hintStyle.getText().setText(hintMsg.value);
        style.push(hintStyle);
      }
      return style
    }

    const newFeature = new VectorLayer({
      source: new VectorSource(),
      style: feature => styleFunction(feature),
    })

    const drawStart = () => {
      hintMsg.value = continueMsg.value;
      if (store.state.addOptionToDraw[2].checked) newFeature.getSource().clear()
    }
    const drawEnd = () => {
      hintMsg.value = startDrawingMsg
    }

    let draw
    const addDraw = () => {
      const showHint = true
      let type, geometryFunction
      switch (store.state.selectOptions['drawType']) {
        case 'Point':
          type = 'Point'
          break;
        case 'LineString':
          type = 'LineString'
          break;
        case 'Polygon(freehand)':
          type = 'Polygon'
          break;
        case 'Rectangle':
          type = 'Circle'
          geometryFunction = createBox()
          break;
        case 'Circle':
          type = 'Circle'
          break;
        case 'Regular Polygon':
          type = 'Circle'
          geometryFunction = createRegularPolygon(regPolygon.value)
          break;
      }
      draw = new Draw({
        type: type,
        source: newFeature.getSource(),
        style: feature => styleFunction(feature, showHint),
        geometryFunction: geometryFunction
      })
      draw.on('drawstart', drawStart)
      draw.on('drawend', drawEnd)
      if (map.value) map.value.addInteraction(draw)
    }

    addDraw()

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
      
      watchEffect(() => { 
        map.value.removeInteraction(draw)
        addDraw()
      })
    })

    return { map, mapContainer, drawType, clearLastFeature, clearAllFeatures, regPolygon }
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

.regPolygon {
  display: inline-block;
  height: 30px;
  font-size: 18px;
  margin-right: 10px;
}
</style>