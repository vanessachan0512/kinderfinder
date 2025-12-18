import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDiscussionDetailStore = defineStore('discussionDetail', () => {
  const passedDiscussion = ref(null)
  const passedIsBookmarked = ref(null) // null = not passed

  const setPassedData = (discussion, isBookmarked) => {
    passedDiscussion.value = discussion
    passedIsBookmarked.value = isBookmarked
  }

  const clearPassedData = () => {
    passedDiscussion.value = null
    passedIsBookmarked.value = null
  }

  return {
    passedDiscussion,
    passedIsBookmarked,
    setPassedData,
    clearPassedData
  }
})