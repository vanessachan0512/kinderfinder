import { defineStore } from 'pinia'

export const useKindergartenDetailStore = defineStore('kindergartenDetail', {
  state: () => ({
    passedData: null,
    passedBookmarkStatus: null
  }),
  actions: {
    setPassedData(kindergarten, isBookmarked) {
      this.passedData = kindergarten
      this.passedBookmarkStatus = isBookmarked
    },
    clearPassedData() {
      this.passedData = null
      this.passedBookmarkStatus = null
    }
  },
  persist: true  // ← This saves to sessionStorage automatically
})