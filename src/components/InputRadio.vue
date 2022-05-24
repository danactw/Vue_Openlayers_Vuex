<template>
  <div v-for="item in items" :key="item" class="groupContainer">
    <input :id="item" type="radio" :value="item"  v-model="$store.state.inputRadio[itemRef]">
    <label :for="item"> {{ item }} </label><br>
  </div>
</template>

<script>
export default {
  props: {
    items: Array,
    itemRef: String
  }
}
</script>

<style>
.groupContainer {
  margin: 15px 5px;
}
</style>