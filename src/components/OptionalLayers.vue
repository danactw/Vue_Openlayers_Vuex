<template>
  <li class="layer">
    <input :id="item.title" class="visibility" type="checkbox" v-model="item.visibility"/>
    <label :for="item.title" class="layerTitle"> {{ item.title }} </label>
    <input class="opacity" type="range" min="0" max="1" step="0.01" v-model="item.opacity" v-show="item.visibility"/>
  </li>
</template>

<script>
import { watch } from '@vue/runtime-core'
export default {
  props: {
    item: Object
  },
  setup(props) {
    watch(()=>props.item.visibility, () => props.item.opacity=1)
  }
}
</script>

<style>

</style>