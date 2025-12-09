<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { jwtDecode } from "jwt-decode"
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css' 
import { Modal } from 'bootstrap'

const reportTarget = ref(null)
const reportReason = ref('')
const reportDetails = ref('')
const openDropdown = ref(null)


function reportComment(comment) {
  reportTarget.value = comment
  reportReason.value = ''
  reportDetails.value = ''

  // Show Bootstrap modal
  const modalEl = document.getElementById('reportModal')
  const modal = new Modal(modalEl)
  modal.show()
}

async function submitReport() {
  if (!reportReason.value) return alert("Please select a reason")

  const res = await fetch(`/api/users/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commentId: reportTarget.value._id,
      discussionId: discussionId,
      reportedUser: reportTarget.value.user,
      reason: reportReason.value,
      details: reportDetails.value,
      reporter: decoded // current logged-in user
    })
  })

  if (res.ok) {
    alert("Report submitted successfully! Please wait for admin review. (5-10 working days)")
    const modalEl = document.getElementById('reportModal')
    const modal = Modal.getInstance(modalEl)
    modal.hide()
  } else {
    alert("Failed to submit report")
  }
}


const route = useRoute()
const discussionId = route.params.id || route.params.discussionId
const discussion = ref(null)
const newMessage = ref('')
const message = ref('')
const token = localStorage.getItem('token')
const decoded = jwtDecode(token)

const hoveredComment = ref(null)
const replyTarget = ref(null)
const showEmojiPicker = ref(false)

async function loadDiscussion() {
  if (!discussionId) return
  const res = await fetch(`/api/discussions/${discussionId}`)
  if (res.ok) {
    discussion.value = await res.json()
  }
}

// Track which comment is being edited
const editingCommentId = ref(null)

function editComment(comment) {
  // Prefill the input with the existing message
  newMessage.value = comment.message
  // Store the comment ID so we know this is an edit
  editingCommentId.value = comment._id
}

// Update sendMessage to handle both new and edited comments
async function sendMessage() {
  if (!newMessage.value.trim()) return

  if (editingCommentId.value) {
    // Editing existing comment
    const res = await fetch(`/api/discussions/${discussionId}/comment/${editingCommentId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: newMessage.value,
        timestamp: new Date().toISOString() // update timestamp
      })
    })

    const data = await res.json()
    message.value = data.message
    editingCommentId.value = null // reset edit state
  } else {
    // Normal new comment
    const res = await fetch(`/api/discussions/${discussionId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: {
          _id: decoded?._id,
          username: decoded?.username,
          email: decoded?.email,
          profileEmoji: decoded?.profileEmoji || '🙂',
          profilePicture: decoded?.profilePicture || null
        },
        message: newMessage.value,
        replyTo: replyTarget.value || null,
        timestamp: new Date().toISOString()
      })
    })

    const data = await res.json()
    message.value = data.message
    replyTarget.value = null
  }

  newMessage.value = '' // clear input
  await loadDiscussion()
}



function addEmoji(emoji) {
  newMessage.value += emoji.i
  showEmojiPicker.value = false // close after selecting
}

function toggleDropdown(commentId) {
  // Toggle open/close based on the unique comment._id
  openDropdown.value = openDropdown.value === commentId ? null : commentId
}

function replyToComment(comment) {
  replyTarget.value = {
    comment_id: comment._id,
    user_id: comment.user._id,
    username: comment.user.username,
    message: comment.message,
    timestamp: comment.timestamp // original message time
  }
}


function cancelReply() {
  replyTarget.value = null
}


onMounted(loadDiscussion)
</script>
<template>
  <div class="container mt-4 d-flex flex-column" style="height: 80vh;">
    <!-- Header -->
    <h2 class="mb-2">Discussion Board - {{ discussion?.title }}</h2>

    <!-- Description -->
    <p class="text-muted mb-2">Description: {{ discussion?.description }}</p>

    <!-- Hashtags -->
    <div v-if="discussion?.hashtags?.length" class="mb-3">
    <span
        v-for="tag in discussion.hashtags"
        :key="tag"
        class="badge bg-info text-dark me-1"
    >
        {{ tag }}
    </span>
    </div>

    <!-- Chat area -->
    <div class="flex-grow-1 border rounded p-3 mb-3 overflow-auto" style="background:#e5ddd5;">
      <template v-if="discussion?.comments?.length">
        <template v-for="(comment, index) in discussion.comments" :key="comment._id">
          <!-- Date separator -->
          <div
            v-if="index === 0 ||
                   new Date(comment.timestamp).toDateString() !== new Date(discussion.comments[index-1].timestamp).toDateString()"
            class="text-center my-2"
          >
            <span class="badge bg-secondary">
              {{ new Date(comment.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
            </span>
          </div>

          <!-- Message bubble row -->
          <div
            :class="[
              'd-flex mb-2',
              comment.user._id === decoded?._id ? 'justify-content-end' : 'justify-content-start'
            ]"
          >
            <!-- Profile emoji/picture (only for other users) -->
            <div v-if="comment.user._id !== decoded?._id">
              <div v-if="comment.user.profilePicture" class="me-2">
                <img
                  :src="comment.user.profilePicture"
                  class="rounded-circle"
                  style="width:30px;height:30px;"
                />
              </div>
              <div v-else-if="comment.user.profileEmoji" class="me-2" style="font-size:24px;">
                {{ comment.user.profileEmoji }}
              </div>
              <div v-else class="me-2">
                <i class="bi bi-person-circle" style="font-size:24px;"></i>
              </div>
            </div>

            <!-- Bubble -->
            <div
              class="position-relative"
              :class="[
                'p-2 rounded',
                comment.user._id === decoded?._id ? 'text-dark' : 'bg-light'
              ]"
              :style="comment.user._id === decoded?._id ? 'background-color:#d4edda;' : ''"
              style="max-width:70%;"
              @mouseenter="hoveredComment = comment._id"
              @mouseleave="hoveredComment = null"
            >
              <!-- Show username if it's not the logged-in user -->
              <div v-if="comment.user._id !== decoded?._id" class="fw-bold mb-1">
                <span style="color:#3b82f6;">{{ comment.user.username }}</span>
              </div>

              <!-- Reply bubble -->
              <div v-if="comment.replyTo" class="border-start ps-2 mb-1 text-muted small">
                <strong style="color:#3b82f6;">
                  {{ comment.replyTo.user_id === decoded?._id ? 'You' : comment.replyTo.username }}
                </strong><br />
                {{ comment.replyTo.message }}<br />
                <small>
                  {{ new Date(comment.replyTo.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }}
                </small>
              </div>

              <!-- Message text -->
              <div>{{ comment.message }}</div>

              <!-- Timestamp -->
              <small class="text-muted d-block text-end">
                {{ new Date(comment.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }}
              </small>

              <!-- More options (Vue-controlled dropdown) -->
            <div v-if="hoveredComment === comment._id" class="position-absolute top-0 end-0 me-1 mt-1">
            <div class="dropdown">
                <button
                class="btn btn-sm btn-link text-dark p-0"
                @click="toggleDropdown(comment._id)"
                >
                <i class="bi bi-three-dots-vertical"></i>
                </button>
                <ul
                v-if="openDropdown === comment._id"
                class="dropdown-menu show"
                :class="comment.user._id === decoded?._id ? 'dropdown-menu-end' : ''"
                :style="{
                    position: 'absolute',
                    zIndex: 1050,
                    top: '100%',
                    right: comment.user._id === decoded?._id ? '0' : 'auto',
                    left: comment.user._id !== decoded?._id ? '0' : 'auto'
                }"
                >
                <li><a class="dropdown-item" @click="replyToComment(comment)">Reply</a></li>
                <li v-if="comment.user._id === decoded?._id">
                    <a class="dropdown-item" @click="editComment(comment)">Edit</a>
                </li>
                <li v-else>
                    <a class="dropdown-item text-danger" @click="reportComment(comment)">Report</a>
                </li>
                </ul>
            </div>
            </div>
            </div>
          </div>
        </template>
      </template>

      <div v-else class="text-muted text-center mt-5">
        No messages yet. Start the conversation below 👇
      </div>
    </div>

    <!-- Reply preview -->
    <div v-if="replyTarget" class="border rounded p-2 mb-2 bg-light position-relative">
      <strong style="color:#3b82f6;">
        Replying to {{ replyTarget.user_id === decoded?._id ? 'You' : replyTarget.username }}
      </strong>
      <div class="text-muted small">{{ replyTarget.message }}</div>
      <small class="text-muted">
        {{ new Date(replyTarget.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }}
      </small>
      <button class="btn-close position-absolute top-0 end-0 me-2 mt-2" @click="cancelReply"></button>
    </div>

    <!-- Input bar -->
    <div class="position-relative flex-shrink-0">
      <div class="input-group">
        <input
          v-model="newMessage"
          type="text"
          class="form-control"
          placeholder="Type a message"
        />
        <button class="btn btn-light" @click="showEmojiPicker = !showEmojiPicker">😊</button>
        <button class="btn btn-primary" @click="sendMessage">Send</button>
      </div>

      <!-- Emoji picker -->
      <div v-if="showEmojiPicker" class="position-absolute" style="bottom: 50px; right: 0; z-index: 1000;">
        <EmojiPicker @select="addEmoji" />
      </div>
    </div>

    <!-- Status message -->
    <p v-if="message" class="text-success mt-2">{{ message }}</p>

    <!-- Report Modal -->
    <div class="modal fade" id="reportModal" tabindex="-1" aria-labelledby="reportModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="reportModalLabel">Report Comment</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p class="small text-muted">
              You are reporting a comment by <strong>{{ reportTarget?.user?.username }}</strong>:
            </p>
            <blockquote class="border-start ps-2">{{ reportTarget?.message }}</blockquote>

            <div class="mb-3">
              <label class="form-label">Reason</label>
              <select v-model="reportReason" class="form-select">
                <option disabled value="">Select a reason</option>
                <option>Spam</option>
                <option>Harassment</option>
                <option>Inappropriate content</option>
                <option>Other</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Additional details</label>
              <textarea v-model="reportDetails" class="form-control" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" @click="submitReport">Submit Report</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
