<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { jwtDecode } from "jwt-decode"
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
import { Modal } from 'bootstrap'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faCircleNotch, faComments } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
library.add(faCircleNotch, faComments)

const route = useRoute()
const router = useRouter()
const discussionId = route.params.id || route.params.discussionId
const discussion = ref(null)
const newMessage = ref('')

const token = localStorage.getItem('token')
const decoded = token ? jwtDecode(token) : null

const hoveredComment = ref(null)
const replyTarget = ref(null)
const editingTarget = ref(null)
const showEmojiPicker = ref(false)
const openDropdown = ref(null)
const reportTarget = ref(null)
const reportReason = ref('')
const reportDetails = ref('')

// ——— INSTANT LOAD ———
function loadFromState() {
  const state = history.state || {}

  // Only use history.state if NOT a reload
  if (performance.navigation.type !== performance.navigation.TYPE_RELOAD && state.discussion) {
    discussion.value = state.discussion
    return true
  }

  const saved = sessionStorage.getItem(`discussion_${discussionId}`)
  if (saved && performance.navigation.type !== performance.navigation.TYPE_RELOAD) {
    try {
      const data = JSON.parse(saved)
      discussion.value = data.discussion
      return true
    } catch (e) {
      sessionStorage.removeItem(`discussion_${discussionId}`)
    }
  }

  return false
}


async function loadFromBackend() {
  if (!discussionId) return
  try {
    const res = await fetch(`/api/discussions/${discussionId}`)
    if (!res.ok) throw new Error('Not found')
    const freshData = await res.json()

    // PRESERVE optimistic messages during reload
    if (discussion.value?.comments?.length) {
      const optimistic = discussion.value.comments.filter(c => c.isOptimistic)
      if (optimistic.length > 0) {
        const existingIds = new Set(freshData.comments.map(c => c._id))
        const merged = [...optimistic.filter(c => !existingIds.has(c._id)), ...freshData.comments]
        freshData.comments = merged
      }
    }

    discussion.value = freshData

    // Save fresh data + keep optimistic ones
    sessionStorage.setItem(`discussion_${discussionId}`, JSON.stringify({
      discussion: freshData,
      timestamp: Date.now()
    }))
    history.replaceState({ ...history.state, discussion: freshData }, '', location.href)
  } catch (err) {
    console.error('Load failed:', err)
  }
}

onMounted(() => {
  const isReload = performance.navigation.type === performance.navigation.TYPE_RELOAD

  if (isReload) {
    loadFromBackend()
  } else {
    if (!loadFromState()) loadFromBackend()
  }

  nextTick(() => document.querySelector('input')?.focus())
})


watch(() => route.params.id, () => {
  discussion.value = null
  if (!loadFromState()) loadFromBackend()
})

// ——— FINAL OPTIMISTIC SEND (NEVER LOSES MESSAGES) ———
async function sendMessage() {
  if (!newMessage.value.trim() || !discussion.value || !decoded) return

  const messageText = newMessage.value.trim()
  const tempId = `temp_${Date.now()}_${Math.random().toString(36)}`
  const isEdit = !!editingTarget.value
  const isReply = !!replyTarget.value && !isEdit

  const optimisticComment = {
    _id: tempId,
    message: messageText,
    user: { _id: decoded._id, username: decoded.username, profileEmoji: decoded.profileEmoji || 'smile', profilePicture: decoded.profilePicture },
    timestamp: new Date().toISOString(),
    replyTo: isReply ? { ...replyTarget.value } : null,
    isOptimistic: true,
    failed: false
  }

  let targetIndex = -1

  if (isEdit) {
    targetIndex = discussion.value.comments.findIndex(c => c._id === editingTarget.value._id)
    if (targetIndex !== -1) {
      discussion.value.comments[targetIndex] = { ...discussion.value.comments[targetIndex], message: messageText, isOptimistic: true }
    }
  } else {
    discussion.value.comments.push(optimisticComment)
    targetIndex = discussion.value.comments.length - 1
  }

  nextTick(() => {
    const container = document.querySelector('.flex-grow-1.overflow-auto')
    if (container) container.scrollTop = container.scrollHeight
  })

  newMessage.value = ''
  replyTarget.value = null
  editingTarget.value = null
  showEmojiPicker.value = false

  try {
    const url = isEdit
      ? `/api/discussions/${discussionId}/comment/${editingTarget.value._id}`
      : `/api/discussions/${discussionId}/comment`

    const payload = isEdit
      ? { message: messageText }
      : {
          user: { _id: decoded._id, username: decoded.username, profileEmoji: decoded.profileEmoji || 'smile', profilePicture: decoded.profilePicture },
          message: messageText,
          replyTo: isReply ? replyTarget.value : null
        }

    const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) throw new Error('Failed')

    const result = await res.json()
    const realComment = isEdit ? result : (result.comment || result)

    // THIS IS THE KEY: Replace temp comment with real one by ID match
    if (targetIndex !== -1) {
      discussion.value.comments.splice(targetIndex, 1, {
        ...realComment,
        isOptimistic: false,
        failed: false
      })
    }

    // Force refresh cache so reload always shows latest
    await loadFromBackend()

  } catch (err) {
    console.error('Send failed:', err)
    if (targetIndex !== -1) {
      discussion.value.comments[targetIndex].isOptimistic = false
      discussion.value.comments[targetIndex].failed = true
    }
  }
}

// ——— REST OF YOUR FUNCTIONS (unchanged) ———
function addEmoji(emoji) {
  newMessage.value += emoji.native || emoji.i || ''
  showEmojiPicker.value = false
}
function replyToComment(c) {
  replyTarget.value = { _id: c._id, user_id: c.user._id, username: c.user.username, message: c.message }
  nextTick(() => document.querySelector('input')?.focus())
}
function editComment(c) {
  editingTarget.value = c
  newMessage.value = c.message
  nextTick(() => document.querySelector('input')?.focus())
}
function cancelReplyOrEdit() {
  replyTarget.value = null
  editingTarget.value = null
  newMessage.value = ''
}
function toggleDropdown(id) { openDropdown.value = openDropdown.value === id ? null : id }
function reportComment(c) {
  reportTarget.value = c
  reportReason.value = ''
  reportDetails.value = ''
  const modal = new Modal(document.getElementById('reportModal'))
  modal.show()
}
async function submitReport() {
  if (!reportReason.value) return alert('Select a reason')
  try {
    await fetch('/api/users/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ commentId: reportTarget.value._id, discussionId, reportedUser: reportTarget.value.user, reason: reportReason.value, details: reportDetails.value, reporter: decoded }) })
    alert('Report submitted!')
    Modal.getInstance(document.getElementById('reportModal')).hide()
  } catch (err) { alert('Failed') }
}
</script>

<template>
  <!-- Your beautiful template stays the same -->
  <div class="min-vh-100" style="background: linear-gradient(135deg, #fff1eb 0%, #ace0f9 100%); position: relative; overflow: hidden;">
    <!-- Decorations -->
     <div class="position-fixed top-90 start-90 w-100 h-100 pointer-events-none" style="z-index: 1; opacity: 0.15;">
      <img src="/images/discuss.png" class="position-absolute" style="top: 8%; left: 3%; width: 220px;">
      <img src="/images/drawing.png" class="position-absolute" style="bottom: 20%; right: 3%; width: 240px;">
      <div class="position-absolute animate-float" style="top: 40%; left: 4%;"><div class="fs-1">⭐️</div></div>
      <div class="position-absolute animate-float delay-1" style="top: 30%; right: 14%;"><div class="fs-1">☀️</div></div>
      <div class="position-absolute animate-float delay-2" style="top: 30%; left: 17%;"><div class="fs-1">🌈</div></div>
      <div class="position-absolute animate-float delay-4" style="top: 50%; right: 6%;"><div class="fs-1">🎈</div></div>
      <div class="position-absolute animate-float delay-5" style="top:60%; left: 10%;"><div class="fs-1">🧸</div></div>
      <div class="position-absolute animate-float delay-3" style="top: 7%; right: 10%;"><div class="fs-1">🍭</div></div>
    </div>

    <div class="container py-4" style="position:relative;z-index:2;">
      <div class="row justify-content-center">
        <div class="col-lg-9 col-xl-8">
          <!-- Header -->
          <div class="d-flex justify-content-between align-items-start mb-4 bg-white rounded-4 shadow-sm p-4">
            <div>
              <h2 class="fw-bold text-primary mb-2">{{ discussion?.title || 'Loading...' }}</h2>
              <p class="text-muted mb-2">Description: {{ discussion?.description }}</p>
              <div v-if="discussion?.hashtags?.length" class="mb-2">
                <span v-for="tag in discussion.hashtags" :key="tag" class="badge bg-info text-white me-2 px-3 py-2">{{ tag }}</span>
              </div>
            </div>
            <button @click="router.back()" class="btn btn-outline-primary">Back</button>
          </div>

          <!-- Chat -->
          <div class="bg-white rounded-4 shadow-lg overflow-hidden" style="height:68vh;display:flex;flex-direction:column;">
            <div class="flex-grow-1 overflow-auto p-4">
              <div v-if="!discussion" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
              <div v-else-if="!discussion.comments?.length" class="text-center text-muted py-5">
                <font-awesome-icon :icon="['fas','comments']" class="fs-1 mb-3 opacity-50" />
                <p>No comments yet. Be the first to say hello!</p>
              </div>

              <template v-for="(c, i) in discussion?.comments" :key="c._id">
                <!-- Date separator -->
                <div v-if="i === 0 || new Date(c.timestamp).toDateString() !== new Date(discussion.comments[i-1].timestamp).toDateString()" class="text-center my-3">
                  <span class="badge bg-light text-dark px-3 py-2">
                    {{ new Date(c.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
                  </span>
                </div>

                <!-- Message -->
                <div :class="['d-flex mb-3', c.user._id === decoded?._id ? 'justify-content-end' : 'justify-content-start']"
                  @mouseenter="hoveredComment = c._id" @mouseleave="hoveredComment = null">

                  <div v-if="c.user._id !== decoded?._id" class="me-3 flex-shrink-0">
                    <div v-if="c.user.profilePicture" class="rounded-circle overflow-hidden" style="width:40px;height:40px;">
                      <img :src="c.user.profilePicture" class="w-100 h-100" style="object-fit:cover;">
                    </div>
                    <div v-else class="fs-2">{{ c.user.profileEmoji || 'person' }}</div>
                  </div>

                  <div class="rounded-4 px-4 py-3 position-relative"
                    :style="c.user._id === decoded?._id 
                      ? 'background:#a8e6cf;max-width:75%;border-bottom-right-radius:4px;' 
                      : 'background:#fff;max-width:75%;box-shadow:0 2px 8px rgba(0,0,0,0.1);border-bottom-left-radius:4px;'">

                    <div v-if="c.user._id !== decoded?._id" class="fw-bold text-primary small mb-1">{{ c.user.username }}</div>

                    <div v-if="c.replyTo" class="border-start border-warning border-4 ps-3 mb-2 small text-muted bg-light rounded p-2">
                      Replying to {{ c.replyTo.user_id === decoded?._id ? 'you' : c.replyTo.username }}
                      <div class="text-truncate">{{ c.replyTo.message }}</div>
                    </div>

                    <div class="mb-1 d-flex align-items-center gap-2">
                      {{ c.message }}
                    </div>

                    <small class="text-muted">
                      {{ new Date(c.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }}
                    </small>

                    <!-- Dropdown -->
                    <div v-if="hoveredComment === c._id" class="position-absolute top-0 mt-2"
                      :style="c.user._id === decoded?._id ? 'right:100%;margin-right:8px;' : 'left:100%;margin-left:8px;'">
                      <button class="btn btn-sm text-dark p-0" @click.stop="toggleDropdown(c._id)">...</button>
                      <ul v-if="openDropdown === c._id" class="dropdown-menu show shadow-lg border-0"
                        :class="c.user._id === decoded?._id ? 'dropdown-menu-end' : 'dropdown-menu-start'" style="min-width:120px;">
                        <li><a class="dropdown-item small" @click.stop="replyToComment(c)">Reply</a></li>
                        <li v-if="c.user._id === decoded?._id"><a class="dropdown-item small text-primary" @click.stop="editComment(c)">Edit</a></li>
                        <li v-else><a class="dropdown-item small text-danger" @click.stop="reportComment(c)">Report</a></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- Reply Banner -->
            <div v-if="replyTarget || editingTarget" class="bg-light border-top px-4 py-3 small">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <strong v-if="editingTarget" class="text-primary">Editing your message</strong>
                  <strong v-else class="text-primary">Replying to {{ replyTarget?.user_id === decoded?._id ? 'You' : replyTarget?.username }}</strong>
                  <div class="text-muted text-truncate mt-1" style="max-width:300px;">{{ editingTarget?.message || replyTarget?.message }}</div>
                </div>
                <button class="btn-close" @click="cancelReplyOrEdit"></button>
              </div>
            </div>

            <!-- Input -->
            <div class="border-top bg-white p-3">
              <div class="input-group">
                <input v-model="newMessage" @keyup.enter="sendMessage" type="text" class="form-control border-0 shadow-none"
                  :placeholder="editingTarget ? 'Edit message...' : 'Type a message...'"/>
                <button class="btn btn-outline-secondary" @click="showEmojiPicker = !showEmojiPicker">😊</button>
                <button class="btn btn-primary" @click="sendMessage">Send</button>
              </div>
              <Teleport to="body">
                <div v-if="showEmojiPicker" class="position-fixed shadow-lg rounded-4 overflow-hidden"
                  style="bottom:100px;right:20px;z-index:9999;background:white;">
                  <EmojiPicker @select="addEmoji" />
                </div>
              </Teleport>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Report Modal -->
    <div class="modal fade" id="reportModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
        <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">Report Comment</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
            <p>Reporting: <strong>{{ reportTarget?.user?.username }}</strong></p>
            <blockquote class="border-start border-danger ps-3">{{ reportTarget?.message }}</blockquote>
            <select v-model="reportReason" class="form-select mb-3">
            <option value="">Select reason</option>
            <option>Spam</option>
            <option>Harassment</option>
            <option>Inappropriate</option>
            </select>
            <textarea v-model="reportDetails" class="form-control" rows="3" placeholder="More details (optional)"></textarea>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button class="btn btn-danger" @click="submitReport">Submit Report</button>
        </div>
        </div>
    </div>
    </div>
</template>

<style scoped>
.rounded-4 { border-radius: 1.5rem; }
.pointer-events-none { pointer-events: none; }
.animate-float { animation: float 8s ease-in-out infinite; }
.delay-1 { animation-delay: 1s; }
.delay-2 { animation-delay: 2s; }
.delay-3 { animation-delay: 3s; }
.delay-4 { animation-delay: 4s; }
.delay-5 { animation-delay: 5s; }
@keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-30px) rotate(5deg)} }
</style>