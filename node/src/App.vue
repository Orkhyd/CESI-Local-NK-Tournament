<template>
  <VaConfig :colors="{
        variables: {
          primary: primaryColor,
        },
      }">
    <RouterView />
  </VaConfig>
</template>

<script setup>
import { ref } from "vue";

const primaryColor = ref("#0c2432");
</script>

<style scoped>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  display: flex !important;
  flex-direction: column;
}
</style>
