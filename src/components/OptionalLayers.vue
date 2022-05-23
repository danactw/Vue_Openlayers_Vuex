<template>
  <li class="layer">
    <input :id="item" class="visibility" type="checkbox" v-model="visibility"/>
    <label :for="item" class="layerTitle"> {{ item }} </label>
    <input class="opacity" type="range" min="0" max="1" step="0.01" v-model="opacity" v-show="visibility"/>
  </li>
</template>

<script>
export default {

}
</script>

<style>

</style>