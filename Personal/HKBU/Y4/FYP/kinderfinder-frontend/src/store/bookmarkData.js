// src/stores/bookmarkData.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBookmarkDataStore = defineStore('bookmarkData', () => {
  const populatedKindergartens = ref([])
  const populatedDiscussions = ref([])
  const populatedResources = ref([])

  const setKindergartens = (data) => {
    populatedKindergartens.value = data
  }

  const setDiscussions = (data) => {
    populatedDiscussions.value = data
  }

  const setResources = (data) => {
    populatedResources.value = data
  }

  const clear = () => {
    populatedKindergartens.value = []
    populatedDiscussions.value = []
    populatedResources.value = []
  }

  return {
    populatedKindergartens,
    populatedDiscussions,
    populatedResources,
    setKindergartens,
    setDiscussions,
    setResources,
    clear
  }
})