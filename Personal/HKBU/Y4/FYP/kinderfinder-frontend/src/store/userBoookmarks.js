// src/store/userBookmarks.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { io } from 'socket.io-client'

export const useUserBookmarksStore = defineStore('userBookmarks', () => {
  const kindergartens = ref([])
  const discussions = ref([])
  const resources = ref([])
  const socket = ref(null)

  const setBookmarks = (data) => {
    kindergartens.value = data.kindergartensBookmark || []
    discussions.value = data.discussionsBookmark || []
    resources.value = data.resourcesBookmark || []
  }

  const clearBookmarks = () => {
    kindergartens.value = []
    discussions.value = []
    resources.value = []
  }

  const connectSocket = (userId) => {
    if (!socket.value) {
      socket.value = io('http://localhost:4000') // backend port
    }

    // Join personal channel for this user
    socket.value.emit('joinUserChannel', userId)

    // Listen for kindergarten bookmark updates
    socket.value.on('bookmark:kindergarten', (kg) => {
      kindergartens.value.push(kg)
    })

    // Listen for discussion bookmark updates
    socket.value.on('bookmark:discussion', (disc) => {
      discussions.value.push(disc)
    })

    // Listen for resource bookmark updates
    socket.value.on('bookmark:resource', (res) => {
      resources.value.push(res)
    })
  }

  return {
    kindergartens,
    discussions,
    resources,
    setBookmarks,
    clearBookmarks,
    connectSocket
  }
})
