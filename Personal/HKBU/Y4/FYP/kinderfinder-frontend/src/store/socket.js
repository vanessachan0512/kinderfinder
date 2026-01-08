// src/stores/socket.js — CLEAN VERSION (only connection & room management)
import { defineStore } from 'pinia'
import { io } from 'socket.io-client'

export const useSocketStore = defineStore('socket', {
  state: () => ({
    socket: null,
    connected: false,
    currentDiscussionId: null,
    pendingDiscussionId: null
  }),

  actions: {
    connect(userId) {
      if (this.socket?.connected) {
        console.log('⚠️ Socket already connected')
        return
      }

      console.log('🔄 Initializing socket connection...')

      this.socket = io('http://localhost:4000', {
        withCredentials: true
      })

      this.socket.on('connect', () => {
        console.log('✅ SOCKET CONNECTED! ID:', this.socket.id)
        this.connected = true

        if (userId) {
          this.socket.emit('joinUserChannel', userId.toString())
          console.log('👤 Joined personal channel:', userId)
        }

        if (this.pendingDiscussionId) {
          this.joinDiscussion(this.pendingDiscussionId)
          this.pendingDiscussionId = null
        }
      })

      this.socket.on('connect_error', (err) => {
        console.error('❌ Socket connect error:', err.message)
        this.connected = false
      })

      this.socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected')
        this.connected = false
      })
    },

    joinDiscussion(discussionId) {
      discussionId = discussionId.toString()
      console.log('🟡 Attempting to join discussion:', discussionId)

      if (!this.socket) {
        this.pendingDiscussionId = discussionId
        return
      }

      if (!this.connected) {
        this.pendingDiscussionId = discussionId
        return
      }

      if (this.currentDiscussionId && this.currentDiscussionId !== discussionId) {
        this.socket.emit('leaveDiscussion', this.currentDiscussionId)
      }

      this.socket.emit('joinDiscussion', discussionId)
      this.currentDiscussionId = discussionId
      console.log('🟢 Joined discussion room:', discussionId)
    },

    leaveDiscussion() {
      if (this.currentDiscussionId && this.socket?.connected) {
        this.socket.emit('leaveDiscussion', this.currentDiscussionId)
        console.log('🚪 Left room:', this.currentDiscussionId)
        this.currentDiscussionId = null
      }
    },

    disconnect() {
      this.leaveDiscussion()
      this.socket?.disconnect()
      this.socket = null
      this.connected = false
      this.currentDiscussionId = null
      this.pendingDiscussionId = null
    }
  }
})