<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const title = ref('')
const description = ref('')
const hashtags = ref([])
const notify = ref(false)
const selectedIcon = ref('🎈') // default icon
const message = ref('')

// List of child-friendly icons
const icons = [
  '🎈', '🎨', '🧸', '🚀', '🌈', '🦄', '🐥', '🧡',
  '🍎', '📚', '✨', '🐻', '🌟', '🦋', '🎠', '🐰',
  '🌻', '🪁', '🐸', '🍭', '🎪', '🦁', '🌼', '🎉'
]

const newTag = ref('')

function addTag() {
  let tag = newTag.value.trim()

  if (!tag) return // empty, do nothing

  // If it already starts with #, use as-is (but ensure only one #)
  if (tag.startsWith('#')) {
    tag = '#' + tag.slice(1).replace(/^#+/, '') // remove extra #s, keep only one
  } else {
    // No # → add one
    tag = '#' + tag
  }

  // Check for duplicates (exact match)
  if (!hashtags.value.includes(tag)) {
    hashtags.value.push(tag)
  }

  // Clear input
  newTag.value = ''
}

function removeTag(tag) {
  hashtags.value = hashtags.value.filter(t => t !== tag)
}

async function saveDiscussion(draft = false) {
  try {
    const formData = new FormData()
    formData.append('title', title.value)
    formData.append('description', description.value)
    formData.append('image', selectedIcon.value) // send icon emoji
    formData.append('notify', notify.value ? 'on' : '')
    formData.append('draft', draft ? 'true' : 'false')
    formData.append('hashtags', hashtags.value.join(','))

    const res = await fetch('/api/discussions/add', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    message.value = data.message || (draft ? 'Saved as draft!' : 'Discussion created!')

    if (!draft && res.ok) {
      router.push('/discussions')
    }
  } catch (err) {
    console.error('Error:', err)
    message.value = 'Something went wrong. Please try again.'
  }
}
</script>

<template>
  <div class="container py-4 px-3" style="max-width: 900px; margin: 0 auto;">
    <div class="text-center mb-4">
      <h2 class="fw-bold text">🌟 Start a New Discussion</h2>
      <p class="text-muted">Share stories, tips, or questions with other parents!</p>
    </div>

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

          <!-- Message Feedback -->
          <div v-if="message" class="alert alert-success alert-dismissible fade show" role="alert">
            {{ message }}
            <button type="button" class="btn-close" @click="message = ''"></button>
          </div>

          <!-- Action Buttons -->
          <div class="d-flex flex-column flex-sm-row gap-3 justify-content-end">
            <button
              type="button"
              class="btn btn-outline-warning btn-lg px-4"
              @click="saveDiscussion(true)"
            >
              💾 Save as Draft
            </button>
            <button type="submit" class="btn btn-primary btn-lg px-5 shadow-sm">
              🚀 Create Discussion
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="text-center mt-4 text-muted small">
      Made with ❤️ for kindergarten parents and teachers
    </div>
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

@media (max-width: 576px) {
  .icon-option {
    font-size: 1.7rem !important;
    padding: 0.8rem !important;
  }
}
</style>