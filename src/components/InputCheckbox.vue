<template>
  <v-checkbox
    :label="item"
    :value="item"
    hide-details
    @click="toggleItem(item)"
  ></v-checkbox>
</template>

<script>
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
export default {
  props: {
    item: String,
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    
    const toggleItem = (item) => {
      const vModel = route.name === 'DrawMap' ? store.state.selectedOptionToDraw : store.state.displayedMapControls
      const index = vModel.indexOf(item)
      index === -1 ?  vModel.push(item) : vModel.splice(index, 1)
    }

    return { toggleItem }
  }
}
</script>