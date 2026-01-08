
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { jwtDecode } from 'jwt-decode'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
import { Modal } from 'bootstrap'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faCircleNotch, faComments } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import { useDiscussionDetailStore } from '@/store/discussionDetail'
import { useSocketStore } from '@/store/socket'

library.add(faCircleNotch, faComments)

// Stores
const store = useDiscussionDetailStore()
const socketStore = useSocketStore()

// Reactive data from Pinia (single source of truth)
const discussion = computed(() => store.passedDiscussion)
const isBookmarked = computed(() => store.passedIsBookmarked)

// Route
const route = useRoute()
const router = useRouter()
const discussionId = route.params.discussionId

// User
const token = localStorage.getItem('token')
const decoded = token ? jwtDecode(token) : null
const userId = decoded?._id

// UI state
const newMessage = ref('')
const hoveredComment = ref(null)
const replyTarget = ref(null)
const editingTarget = ref(null)
const showEmojiPicker = ref(false)
const openDropdown = ref(null)
const reportTarget = ref(null)
const reportReason = ref('')
const reportDetails = ref('')

// Load data & setup real-time
const loadDiscussionAndBookmark = async () => {
  if (!discussionId) return

  try {
    const res = await fetch(`/api/discussions/${discussionId}`)
    if (!res.ok) throw new Error('Discussion not found')
    const data = await res.json()

    let bookmarkStatus = false
    if (userId) {
      const userRes = await fetch(`/api/users/${userId}`)
      if (userRes.ok) {
        const userData = await userRes.json()
        const bookmarkIds = (userData.discussionsBookmark || []).map(id => id.toString())
        bookmarkStatus = bookmarkIds.includes(discussionId.toString())
      }
    }

    // Set everything in Pinia store
    store.setPassedData(data, bookmarkStatus)
  } catch (err) {
    console.error('Failed to load discussion:', err)
  }
}

onMounted(async () => {
  await loadDiscussionAndBookmark()

  // Auto-focus input Document Object Model
  nextTick(() => {
    document.querySelector('input')?.focus()
  })

  // Join room & setup real-time listeners
  if (discussionId) {
    socketStore.joinDiscussion(discussionId)
    store.setupRealtime(discussionId)
  }
})

onBeforeUnmount(() => {
  socketStore.leaveDiscussion()
  store.clearPassedData()
})

// Handle navigation between discussions
watch(() => route.params.discussionId, (newId, oldId) => {
  if (oldId) socketStore.leaveDiscussion()
  if (newId) {
    socketStore.joinDiscussion(newId)
    store.setupRealtime(newId)
  }
})

const sortedComments = computed(() => {
  if (!discussion.value?.comments) return []
  return [...discussion.value.comments].sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
  )
})

const topLevelComments = computed(() => {
  return sortedComments.value.filter(c => !c.replyTo) || []
})

const getReplies = (parentId) => {
  return sortedComments.value
    .filter(c => c.replyTo && c.replyTo._id === parentId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))  // ← This line fixes it!
}

const isOwnMessage = (comment) => String(comment.user?._id) === String(decoded?._id)

const isNewDay = (current, previous) => !previous || new Date(current).toDateString() !== new Date(previous).toDateString()

const formatFullDate = (iso) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

const formatTime = (iso) => {
//   if (!iso) return 'Invalid Date' // fallback if null/undefined
    // console.log(iso)

  const date = new Date(iso)
  if (isNaN(date.getTime())) return 'Invalid Date' // invalid ISO string

  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// Bookmark toggle
const toggleBookmark = async () => {
  if (!userId || !discussionId) return

  const previous = isBookmarked.value
  isBookmarked.value = !previous  // optimistic UI

  try {
    const res = await fetch(`/api/users/${userId}/bookmark`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discussionId })
    })

    if (!res.ok) throw new Error('Failed')

    const data = await res.json()
    const bookmarkIds = data.discussionsBookmark.map(id => id.toString())
    isBookmarked.value = bookmarkIds.includes(discussionId.toString())
  } catch (err) {
    console.error('Bookmark failed:', err)
    isBookmarked.value = previous
  }
}

// Other functions (unchanged)
const addEmoji = (emoji) => {
  newMessage.value += emoji.native || emoji.i || ''
  showEmojiPicker.value = false
}

function replyToComment(c) {
  replyTarget.value = { _id: c._id, user_id: c.user._id, username: c.user.username, message: c.message }
  console.log("REply",replyTarget.value)
  nextTick(() => document.querySelector('input')?.focus())
  openDropdown.value = null
}

async function sendMessage() {
  if (!newMessage.value.trim() || !discussion.value || !decoded) return

  const messageText = newMessage.value.trim()
  const isEdit = !!editingTarget.value
  const isReply = !!replyTarget.value && !isEdit

  const tempId = isEdit ? null : `temp_${Date.now()}_${Math.random().toString(36)}`

  let targetIndex = -1

  // === OPTIMISTIC UI ===
  if (isEdit) {
    targetIndex = discussion.value.comments.findIndex(c => c._id === editingTarget.value._id)
    if (targetIndex !== -1) {
      discussion.value.comments[targetIndex] = {
        ...discussion.value.comments[targetIndex],
        message: messageText,
        isOptimistic: true,
        isEdit: true // mark as edited
        // timestamp preserved
      }
    }
  } else {
    const optimisticComment = {
      _id: tempId,
      message: messageText,
      user: {
        _id: userId,
        username: decoded.username,
        profileEmoji: decoded.profileEmoji || 'smile',
        profilePicture: decoded.profilePicture
      },
      timestamp: new Date().toISOString(),
      replyTo: isReply ? {
        _id: replyTarget.value._id,
        user_id: replyTarget.value.user_id,
        username: replyTarget.value.username,
        message: replyTarget.value.message,
        timestamp: new Date().toISOString(),
      } : null,
      isOptimistic: true,
      failed: false
    }

    discussion.value.comments.push(optimisticComment)
    targetIndex = discussion.value.comments.length - 1
  }

  // === RE-SORT ALL COMMENTS BY TIMESTAMP ===
  discussion.value.comments = [...discussion.value.comments].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  )

  nextTick(() => {
    const container = document.querySelector('.flex-grow-1.overflow-auto')
    if (container) container.scrollTop = container.scrollHeight
  })

  try {
    const url = isEdit
      ? `/api/discussions/${discussionId}/comment/${editingTarget.value._id}`
      : `/api/discussions/${discussionId}/comment`

    const payload = isEdit
      ? { message: messageText }
      : {
          user: {
            _id: decoded._id,
            username: decoded.username,
            profileEmoji: decoded.profileEmoji || 'smile',
            profilePicture: decoded.profilePicture
          },
          message: messageText,
          replyTo: isReply ? {
            _id: replyTarget.value._id,
            user_id: replyTarget.value.user_id,
            username: replyTarget.value.username,
            message: replyTarget.value.message,
            timestamp: new Date().toISOString(),
          } : null
        }

    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) throw new Error('Failed to send comment')

    const result = await res.json()

    let realComment
    if (isEdit) {
      realComment = result.comment || result
      const original = discussion.value.comments.find(c => c._id === editingTarget.value._id)
      if (original) {
        realComment.user = original.user
        realComment.timestamp = original.timestamp // ✅ preserve timestamp
      }
      realComment.isEdit = true
    } else {
      realComment = result.comment || result

      // === UPDATE USER'S COMMENTED DISCUSSIONS ===
      try {
        fetch(`/api/users/${decoded._id}/commented-discussions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ discussionId })
        })
      } catch (markErr) {
        console.warn('Failed to update commentedDiscussions (non-critical):', markErr)
      }

      if (!realComment.timestamp) {
        realComment.timestamp = new Date().toISOString()
      }
    }

    if (targetIndex !== -1) {
      discussion.value.comments.splice(targetIndex, 1, {
        ...realComment,
        isOptimistic: false,
        failed: false
      })
    }

    // === RE-SORT AGAIN AFTER SERVER RESPONSE ===
    discussion.value.comments = [...discussion.value.comments].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    )

  } catch (err) {
    console.error('Send failed:', err)
    if (targetIndex !== -1) {
      discussion.value.comments[targetIndex].isOptimistic = false
      discussion.value.comments[targetIndex].failed = true
    }
  } finally {
    newMessage.value = ''
    replyTarget.value = null
    editingTarget.value = null
    showEmojiPicker.value = false
  }
}

function editComment(c) {
  editingTarget.value = c
  newMessage.value = c.message
  nextTick(() => document.querySelector('input')?.focus())
  openDropdown.value = null
}
function cancelReplyOrEdit() {
  replyTarget.value = null
  editingTarget.value = null
  newMessage.value = ''
}

const toggleDropdown = (id) => {
  openDropdown.value = openDropdown.value === id ? null : id
}

const reportComment = (c) => {
  reportTarget.value = c
  reportReason.value = ''
  reportDetails.value = ''
  const modal = new Modal(document.getElementById('reportModal'))
  modal.show()
  openDropdown.value = null
}

const submitReport = async () => {
  if (!reportReason.value) return alert('Select a reason')
  try {
    await fetch('/api/users/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commentId: reportTarget.value._id,
        discussionId,
        reportedUser: reportTarget.value.user,
        reason: reportReason.value,
        details: reportDetails.value,
        reporter: decoded
      })
    })
    alert('Report submitted!')
    Modal.getInstance(document.getElementById('reportModal')).hide()
  } catch (err) {
    alert('Failed')
  }
}
</script>

<template>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"/>
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

  <div class="container py-4" style="position: relative; z-index: 2;">
      <div class="row justify-content-center">
        <div class="col-lg-9 col-xl-8">
          <!-- Header -->
          <div class="d-flex justify-content-between align-items-start mb-4 mt-4 bg-white rounded-4 shadow-sm p-4">
            <div>
              <h2 class="fw-bold text-primary mb-2">{{ discussion?.title || 'Loading...' }}</h2>
              <p class="text-muted mb-2">{{ $t('description') }} {{ discussion?.description }}</p>
              <div v-if="discussion?.hashtags?.length" class="mb-2">
                <span v-for="tag in discussion.hashtags" :key="tag" class="badge bg-info text-white me-2 px-3 py-2">
                  {{ tag }}
                </span>
              </div>
            </div>
            <div class="d-flex align-items-center gap-3">
              <button @click="router.back()" class="btn btn-outline-primary">{{ $t('back') }}</button>
              <div v-if="decoded" class="bookmark-btn" @click.stop="toggleBookmark(discussion?._id)">
                <i :class="isBookmarked ? 'bi bi-bookmark-fill text-warning' : 'bi bi-bookmark text-muted'" class="fs-2"></i>
              </div>
            </div>
          </div>
<!-- WhatsApp Chat -->
<div class="bg-white rounded-4 shadow-lg overflow-hidden" style="height: 68vh; display: flex; flex-direction: column;">
  <!-- Messages -->
  <div class="flex-grow-1 overflow-auto p-4">
    <div v-if="!discussion" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>
    <div v-else-if="!discussion.comments?.length" class="text-center text-muted py-5">
      <font-awesome-icon :icon="['fas', 'comments']" class="fs-1 mb-3 opacity-50" />
      <p>{{ $t('noComments') }}</p>
    </div>

<div class="flex-grow-1 overflow-auto p-4">
  <div v-for="(comment, index) in sortedComments" :key="comment._id">
    <!-- Date separator -->
    <div v-if="index === 0 || isNewDay(comment.timestamp, sortedComments[index-1]?.timestamp)"
         class="text-center my-4">
      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">
        {{ formatFullDate(comment.timestamp) }}
      </span>
    </div>

    <!-- Single message bubble -->
    <div class="d-flex mb-4" :class="{ 'justify-content-end': isOwnMessage(comment) }">
      <!-- Avatar (left for others) -->
      <div v-if="!isOwnMessage(comment)" class="me-3 align-self-end">
        <div v-if="comment.user?.profilePicture" class="rounded-circle overflow-hidden" style="width:40px;height:40px;">
          <img :src="comment.user.profilePicture" class="w-100 h-100 object-fit-cover">
        </div>
        <div v-else class="fs-2">{{ comment.user?.profileEmoji || '👤' }}</div>
      </div>

     <div class="rounded-3 px-4 py-3 shadow-sm position-relative"
     :class="isOwnMessage(comment) ? 'bg-success text-black' : 'bg-light'"
     style="max-width: 75%;">

  <!-- Username -->
  <div v-if="!isOwnMessage(comment)" class="small fw-bold text-primary mb-1">
    {{ comment.user?.username }}
  </div>

  <!-- Quoted preview -->
  <div v-if="comment.replyTo" class="bg-white bg-opacity-30 rounded-2 px-3 py-2 mb-2 border-start border-3 border-primary">
    <div class="small opacity-80 text-truncate" style="max-width: 280px;">
      <strong>{{ comment.replyTo.username }}</strong>: {{ comment.replyTo.message }}
    </div>
  </div>

  <!-- Message text -->
  <div class="mb-2">{{ comment.message }}</div>

  <!-- Bottom row: timestamp + more options button -->
  <div class="d-flex justify-content-between align-items-center">
    <div class="small opacity-75">
      {{ formatTime(comment.timestamp) }}
      <span v-if="comment.isOptimistic"> sending...</span>
      <span v-if="comment.failed" class="text-danger"> failed</span>
    </div>

    <!-- More Options Button (only when hovered and logged in) -->
    <div v-if="decoded" class="ms-2">
      <button 
        class="btn btn-sm btn-light rounded-circle shadow" 
        @click.stop="toggleDropdown(comment._id)"
        style="width: 32px; height: 32px;">
        ⋯
      </button>

      <!-- Dropdown menu -->
      <ul v-if="openDropdown === comment._id" 
          class="dropdown-menu show shadow-lg end-0"
          style="position: absolute; bottom: 40px; min-width: 120px;">
        <li><a class="dropdown-item small" @click.stop="replyToComment(comment)">{{ $t('reply') }}</a></li>
        <li v-if="isOwnMessage(comment)">
          <a class="dropdown-item small text-primary" @click.stop="editComment(comment)">{{ $t('edit') }}</a>
        </li>
        <li v-else>
          <a class="dropdown-item small text-danger" @click.stop="reportComment(comment)">{{ $t('report') }}</a>
        </li>
      </ul>
    </div>
  </div>
</div>
</div>
</div>
</div>
</div>

  <!-- Reply/Edit Banner (while typing) -->
  <div v-if="replyTarget || editingTarget" class="bg-light border-top px-4 py-3 small">
    <div class="d-flex justify-content-between align-items-start">
      <div class="flex-grow-1 me-3">
        <div class="fw-bold text-primary mb-1">
          {{ editingTarget ? $t('editingMessage') : $t('replyingToYou', { username: replyTarget?.user_id === decoded?._id ? $t('you') : replyTarget?.username }) }}
        </div>
        <div class="text-muted small text-truncate">
          {{ editingTarget?.message || replyTarget?.message }}
        </div>
      </div>
      <button class="btn-close" @click="cancelReplyOrEdit"></button>
    </div>
  </div>

    <!-- Input -->
    <div class="border-top bg-white p-3">
    <!-- Logged-in: Full chat input -->
    <div v-if="decoded" class="input-group">
        <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        type="text"
        class="form-control border-0 shadow-none rounded-pill px-4"
        placeholder="Type a message..."
        style="height: 48px;"
        />
        <button class="btn btn-outline-secondary rounded-circle mx-2" @click="showEmojiPicker = !showEmojiPicker">
        😊
        </button>
        <button class="btn btn-success rounded-circle" @click="sendMessage">
        <i class="bi bi-send-fill"></i>
        </button>
    </div>

    <!-- Not logged in: Show message with Sign Up link -->
    <div v-else class="text-center py-3">
        <p class="text-muted mb-3">
        {{ $t('signUpToChat') }}
        </p>
        <router-link to="/signup" class="btn btn-primary rounded-pill px-5">
        {{ $t('signUpMoreFeatures') }}
        </router-link>
        <div class="mt-3">
        <small class="text-muted">
            {{ $t('alreadyAccount') }}
            <router-link to="/login" class="text-primary fw-semibold">{{ $t('logIn') }}</router-link>
        </small>
        </div>
    </div>

    <!-- Emoji Picker (only for logged-in users) -->
    <Teleport to="body">
        <div
        v-if="showEmojiPicker && decoded"
        class="position-fixed shadow-lg rounded-4 overflow-hidden"
        style="bottom: 100px; right: 20px; z-index: 9999; background: white;"
        >
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
            <h5 class="modal-title">{{ $t('reportComment') }}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
            <p>{{ $t('reportingUser') }} <strong>{{ reportTarget?.user?.username }}</strong></p>
            <blockquote class="border-start border-danger ps-3">{{ reportTarget?.message }}</blockquote>
            <select v-model="reportReason" class="form-select mb-3">
            <option value="">{{ $t('selectReason') }}</option>
            <option value="Spam">{{ $t('reportSpam') }}</option>
            <option value="Harassment">{{ $t('reportHarassment') }}</option>
            <option value="Inappropriate">{{ $t('reportInappropriate') }}</option>
            </select>
            <textarea v-model="reportDetails" class="form-control" rows="3" :placeholder="$t('moreDetails')"></textarea>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">{{ $t('cancel') }}</button>
            <button class="btn btn-danger" @click="submitReport">{{ $t('submitReport') }}</button>
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
.btn-outline-primary{
  position: absolute;
  top: 70px;
  right: 20px; /* leaves space for Back button */
  z-index: 20;
  padding: 8px 12px;
  margin-top: 4px;
  cursor: pointer;
}

.bookmark-btn:hover {
  transform: scale(1.15);
}

</style>