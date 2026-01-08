import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCompareStore = defineStore('compare', () => {
  // Max 2 kindergartens
  const compareItems = ref([]) // stores full kindergarten objects

  const addToCompare = (kg) => {
  console.log('addToCompare called with:', kg.ENGLISH_NAME, kg._id)
  console.log('Current length:', compareItems.value.length)

  if (!kg || !kg._id) return

  if (compareItems.value.some(item => item._id === kg._id)) {
    console.log('Already in compare list')
    return
  }

  if (compareItems.value.length >= 2) {
    alert('You can compare up to 2 kindergartens only.')
    return
  }

  compareItems.value.push(kg)
  console.log('Added! New list:', compareItems.value.map(i => i.ENGLISH_NAME))
}

  // Remove from compare
  const removeFromCompare = (id) => {
    compareItems.value = compareItems.value.filter(item => item._id !== id)
  }

  // Clear all
  const clearCompare = () => {
    compareItems.value = []
  }

  // Helper: check if a kindergarten is in compare list
  const isInCompare = (id) => {
    return compareItems.value.some(item => item._id === id)
  }

  // Getter: number of items
  const count = computed(() => compareItems.value.length)

  return {
    compareItems,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    count
  }
})