// src/stores/discussionDetail.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSocketStore } from '@/store/socket'

export const useDiscussionDetailStore = defineStore('discussionDetail', () => {
  const passedDiscussion = ref(null)
  const passedIsBookmarked = ref(false)

  const socketStore = useSocketStore()

  const normalizeComment = (c) => ({
    _id: c._id?.toString(),
    message: c.message || '',
    user: c.user || { _id: 'unknown', username: 'Anonymous', profileEmoji: '👤' },
    timestamp: c.timestamp || new Date().toISOString(),
    replyTo: c.replyTo || null,
    isOptimistic: c.isOptimistic || false,
    failed: c.failed || false
  })

  const setPassedData = (discussion, isBookmarked = false) => {
    passedDiscussion.value = {
      ...discussion,
      comments: Array.isArray(discussion.comments)
        ? discussion.comments.map(normalizeComment)
        : []
    }
    passedIsBookmarked.value = isBookmarked
  }

  const clearPassedData = () => {
    passedDiscussion.value = null
    passedIsBookmarked.value = false
  }

  const setupRealtime = (discussionId) => {
    // Remove old listeners if any
    socketStore.socket?.off('discussion:comment')
    socketStore.socket?.off('discussion:commentEdited')

    // New comment
    socketStore.socket?.on('discussion:comment', (payload) => {
      if (passedDiscussion.value?._id !== payload.discussionId) return

      const newComment = payload.comment

      // Check for duplicate (replace optimistic)
      const existingIndex = passedDiscussion.value.comments.findIndex(c =>
        c._id === newComment._id ||
        (c.isOptimistic && c.message === newComment.message && c.user._id === newComment.user._id)
      )

      if (existingIndex !== -1) {
        passedDiscussion.value.comments.splice(existingIndex, 1, {
          ...newComment,
          isOptimistic: false,
          failed: false
        })
      } else {
        passedDiscussion.value.comments.push(newComment)
      }
    })

    // Edited comment
    socketStore.socket?.on('discussion:commentEdited', (payload) => {
      if (passedDiscussion.value?._id !== payload.discussionId) return

      const comment = passedDiscussion.value.comments.find(c => c._id === payload.commentId)
      if (comment) {
        comment.message = payload.message
        if (payload.timestamp) comment.timestamp = payload.timestamp
      }
    })
  }

  return {
    passedDiscussion,
    passedIsBookmarked,
    setPassedData,
    clearPassedData,
    setupRealtime
  }
})