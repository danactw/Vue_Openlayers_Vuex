<template>
  <select v-model="$store.state.selectOptions[itemRef]">
    <option :value="item" v-for="item in selection" :key="item"> {{ item }} </option>
  </select>
</template>

<script>
export default {
  props: {
    selection: Array,
    itemRef: String
  },
}
</script>

<style>
select {
  display: inline-block;
  height: 40px;
  font-size: 18px;
  margin-right: 10px;
}
</style>