<template>
  <li class="layer" v-for="item in $store.state.baseLayersTitle" :key="item">
    <input :id="item" class="visibility" type="radio" v-model="$store.state.baseLayersVisibility" :value="item"/>
    <label :for="item" class="layerTitle"> {{ item }} </label>
    <input class="opacity" type="range" min="0" max="1" step="0.01" v-model="$store.state.baseLayersOpacity" v-show="$store.state.baseLayersVisibility===item"/>
  </li>
</template>

<script>
export default {
}
</script>

<style>
.layer {
  height: 40px;
  margin: 15px 0;
  list-style: none;
}

.layer .layerTitle {
  margin: 0 5px;
}

.opacity {
  display: block;
  margin-left: 25px;
}
</style>