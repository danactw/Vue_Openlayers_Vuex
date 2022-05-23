<template>
  <select v-model="itemRef">
    <option :value="item" v-for="item in selection" :key="item"> {{ item }} </option>
  </select>
</template>

<script>
import { watchEffect, computed } from '@vue/runtime-core'
export default {
  props: {
    selection: Array,
    itemRef: String
  },
  setup(props) {
    watchEffect(() => {
      console.log(props.itemRef);
    })

    const currentCenter = computed({
      get () {
        return store.state.centerOptions[0]
      },
      set(newValue) {
        
      }
    })
  }
}
</script>

<style>
</style>