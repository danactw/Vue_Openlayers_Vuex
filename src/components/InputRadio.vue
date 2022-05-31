<template>
  <v-radio-group v-model="$store.state.inputRadio[itemRef]" column >
    <v-radio
      v-for="item in items"
      :key="item"
      :label="item"
      :value="item"
    ></v-radio>
  </v-radio-group>
</template>

<script>
export default {
  props: {
    items: Array,
    itemRef: String
  }
}
</script>