import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useResourceDetailStore = defineStore('resourceDetail', () => {
  const passedArticle = ref(null)
  const passedIsBookmarked = ref(null)  // null = not passed

  const setPassedData = (article, isBookmarked) => {
    passedArticle.value = article
    passedIsBookmarked.value = isBookmarked
  }

  const clearPassedData = () => {
    passedArticle.value = null
    passedIsBookmarked.value = null
  }

  return { passedArticle, passedIsBookmarked, setPassedData, clearPassedData }
})