<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { jwtDecode } from "jwt-decode"

const router = useRouter()
const route = useRoute()

const token = localStorage.getItem('token')
const decoded = token ? jwtDecode(token) : null
const userId = decoded?._id

const title = ref('')
const description = ref('')
const hashtags = ref([])
const notify = ref(false)
const selectedIcon = ref('🎈')
const message = ref('')
const newTag = ref('')

const isSaving = ref(false)
const currentAction = ref(null)

const discussionId = route.params.discussionId
const isEditMode = ref(discussionId && discussionId !== 'add')

const icons = [ '🎈','🎨','🧸','🚀','🌈','🦄','🐥','🧡','🍎','📚','✨','🐻','🌟','🦋','🎠','🐰','🌻','🪁','🐸','🍭','🎪','🦁','🌼','🎉' ]

function addTag() {
  let tag = newTag.value.trim()
  if (!tag) return
  if (!tag.startsWith('#')) tag = '#' + tag
  if (!hashtags.value.includes(tag)) hashtags.value.push(tag)
  newTag.value = ''
}
function removeTag(tag) {
  hashtags.value = hashtags.value.filter(t => t !== tag)
}

// Load existing draft/discussion if editing
onMounted(async () => {
  if (isEditMode.value) {
    try {
      const res = await fetch(`/api/discussions/${discussionId}`)
      if (!res.ok) throw new Error('Failed to load discussion')
      const d = await res.json()
      title.value = d.title || ''
      description.value = d.description || ''
      selectedIcon.value = d.image || '🎈'
      hashtags.value = Array.isArray(d.hashtags) ? d.hashtags : (d.hashtags ? d.hashtags.split(',') : [])
      notify.value = d.notify === true || d.notify === 'true'
    } catch (err) {
      console.error('Failed to load discussion:', err)
    }
  }
})

// Save discussion (draft or publish)
async function saveDiscussion(draft = false) {
  if (isSaving.value) return;
  if (!title.value.trim() || !description.value.trim()) {
    message.value = 'Please fill in title and description.';
    return;
  }

  isSaving.value = true;
  currentAction.value = draft ? 'draft' : 'publish';
  message.value = '';

  try {
    const payload = {
      title: title.value.trim(),
      description: description.value.trim(),
      image: selectedIcon.value,
      hashtags: hashtags.value,
      notify: notify.value,
      isDraft: draft,
      updatedAt: new Date().toISOString(),
      createdBy: userId
    };

    let url, method;
    if (isEditMode.value) {
      url = `/api/discussions/${discussionId}`;
      method = 'PUT';
    } else {
      url = '/api/discussions/add';
      method = 'POST';
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save discussion');

    // 🔗 Link discussion to user profile
    await fetch(`/api/users/${userId}/discussions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        discussionId: data.discussionId || discussionId, // use returned id if new
        isDraft: draft
      })
    });

    message.value = draft
      ? 'Draft saved!'
      : isEditMode.value
        ? 'Discussion published successfully!'
        : 'Discussion created successfully!';

    isSaving.value = false;

    if (!draft) {
      setTimeout(() => router.push('/discussions'), 800);
    }
  } catch (err) {
    console.error('Save failed:', err);
    message.value = err.message || 'Something went wrong. Please try again.';
    isSaving.value = false;
  }
}

</script>


<template>
  <div class="container py-4 px-3 mt-4" style="max-width: 900px; margin: 0 auto;">
    <div class="text-center mb-4">
      <h2 class="fw-bold text">🌟 Start a New Discussion</h2>
      <p class="text-muted">Share stories, tips, or questions with other parents!</p>
    </div>
    <button @click="router.back()" class="btn btn-outline-primary">{{ $t('back') }}</button>

    <div class="card shadow-sm border-0 rounded-4 overflow-hidden">
      <div class="card-body p-4 p-md-5">
        <form @submit.prevent="saveDiscussion(false)">
          <!-- Title -->
          <div class="mb-4">
            <label class="form-label fw-semibold text-dark">Discussion Title</label>
            <input
              v-model="title"
              type="text"
              class="form-control form-control-lg rounded-3"
              placeholder="e.g. Best Art Activities for 4-Year-Olds?"
              required
            />
          </div>

          <!-- Description -->
          <div class="mb-4">
            <label class="form-label fw-semibold text-dark">What's on your mind?</label>
            <textarea
              v-model="description"
              class="form-control rounded-3"
              rows="5"
              placeholder="Share your thoughts, experiences, or questions..."
              required
            ></textarea>
          </div>

          <!-- Icon Selection -->
          <div class="mb-4">
            <label class="form-label fw-semibold text-dark mb-3">Choose a Fun Icon</label>
            <div class="row g-3">
              <div
                v-for="icon in icons"
                :key="icon"
                class="col-2 col-md-1 text-center"
              >
                <label
                  class="icon-option d-block p-3 rounded-3 border"
                  :class="{ 'border-primary bg-primary-subtle': selectedIcon === icon }"
                  style="cursor: pointer; font-size: 2rem; transition: all 0.2s; margin-right: -10px;"
                
                >
                  <input
                    type="radio"
                    :value="icon"
                    v-model="selectedIcon"
                    class="d-none"
                  />
                  {{ icon }}
                </label>
              </div>
            </div>
          </div>

          <!-- Hashtags -->
          <div class="mb-4">
            <label class="form-label fw-semibold text-dark">Hashtags (optional)</label>
            <div class="input-group mb-2">
              <input
                v-model="newTag"
                @keyup.enter.prevent="addTag"
                type="text"
                class="form-control rounded-start-3"
                placeholder="e.g. #Kindergarten #ParentTips"
              />
              <button @click="addTag" type="button" class="btn btn-outline-primary rounded-end-3">
                Add
              </button>
            </div>

            <div v-if="hashtags.length" class="d-flex flex-wrap gap-2 mt-3">
              <span
                v-for="tag in hashtags"
                :key="tag"
                class="badge bg-soft-primary text-primary px-3 py-2 rounded-pill"
                style="cursor: pointer; font-size: 0.95rem;"
                @click="removeTag(tag)"
              >
                {{ tag }} <strong class="ms-1">×</strong>
              </span>
            </div>
          </div>

          <!-- Notify Checkbox -->
          <div class="form-check mb-4">
            <input v-model="notify" class="form-check-input" type="checkbox" id="notify" />
            <label class="form-check-label text-muted" for="notify">
              Send me email notifications for replies
            </label>
          </div>

          <!-- Success Message -->
          <transition name="fade">
            <div v-if="message" class="alert alert-success alert-dismissible fade show mb-4" role="alert">
              {{ message }}
              <button type="button" class="btn-close" @click="message = ''"></button>
            </div>
          </transition>

          <!-- Action Buttons -->
          <div class="d-flex flex-column flex-sm-row gap-3 justify-content-end">
            <button
              type="button"
              class="btn btn-outline-warning btn-lg px-4 position-relative"
              @click="saveDiscussion(true)"
              :disabled="isSaving"
            >
              <span v-if="isSaving && currentAction === 'draft'" class="spinner-border spinner-border-sm me-2" role="status"></span>
              💾 Save as Draft
            </button>

            <button
              type="submit"
              class="btn btn-primary btn-lg px-5 shadow-sm position-relative"
              :disabled="isSaving"
            >
              <span v-if="isSaving && currentAction === 'publish'" class="spinner-border spinner-border-sm me-2" role="status"></span>
              Create Discussion
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading Overlay -->
    <transition name="fade">
      <div
        v-if="isSaving"
        class="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-white bg-opacity-75"
        style="z-index: 1050; backdrop-filter: blur(4px);"
      >
        <div class="spinner-border text-primary mb-4" role="status" style="width: 4rem; height: 4rem;">
          <span class="visually-hidden">Saving...</span>
        </div>
        <h4 class="text-primary fw-semibold">
          {{ currentAction === 'draft' ? 'Saving your draft...' : 'Creating your discussion...' }}
        </h4>
        <p class="text-muted mt-2">This won't take long!</p>
      </div>
    </transition>
    </div>
</template>

<style scoped>
.icon-option:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.bg-soft-primary {
  background-color: rgba(13, 110, 253, 0.1) !important;
}

.card {
  border-radius: 1.5rem !important;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 576px) {
  .icon-option {
    font-size: 1.7rem !important;
    padding: 0.8rem !important;
  }
}
</style>