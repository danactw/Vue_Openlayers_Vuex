<template>
  <v-select
    :items="selection"
    menu-props="auto"
    v-model="$store.state.selectOptions[itemRef]"
    dense
    solo
    single-line
  ></v-select>
</template>

<script>
export default {
  props: {
    selection: Array,
    itemRef: String
  },
}
</script>