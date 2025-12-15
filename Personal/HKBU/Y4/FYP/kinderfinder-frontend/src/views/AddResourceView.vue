<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Form fields
const embedLink = ref('')
const description = ref('')
const title = ref('')
const sectionName = ref('')

// Edit mode
const isEditMode = ref(false)
const sectionID = ref('')
const articleId = ref('')

// UI state
const isLoading = ref(false)
const isSaving = ref(false)
const message = ref('')
const messageType = ref('')

// Auto-focus
const titleInput = ref(null)

// INSTANT LOAD FROM ROUTER STATE (from Resources page)
function loadFromNavigationState() {
  const state = history.state
  if (!state?.article) return false

  title.value = state.article.title || ''
  description.value = state.article.description || ''
  embedLink.value = state.article.embedLink || ''
  sectionName.value = state.section?.name || ''

  sectionID.value = state.section._id
  articleId.value = state.article.objectId || route.params.articleId

  return true
}

// Fallback: Load from DB (only if direct link or refresh)
async function loadFromDatabase() {
  isLoading.value = true
  try {
    const res = await fetch(`/api/resources/edit/${sectionID.value}/${articleId.value}`)
    if (!res.ok) throw new Error('Failed to load')

    const data = await res.json()
    title.value = data.article.title || ''
    description.value = data.article.description || ''
    embedLink.value = data.article.embedLink || ''
    sectionName.value = data.section.name || ''
  } catch (err) {
    showMessage('Failed to load article', 'danger')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  // Detect edit mode
  if (route.params.sectionID && route.params.articleId) {
    isEditMode.value = true
    sectionID.value = route.params.sectionID
    articleId.value = route.params.articleId

    // FIRST: Try instant load from state
    const loadedFromState = loadFromNavigationState()

    // If not from Resources page → fetch from DB
    if (!loadedFromState) {
      await loadFromDatabase()
    }
  }

  // Auto-focus title
  nextTick(() => titleInput.value?.focus())
})

// Save article
async function saveArticle() {
  if (!title.value.trim() || !embedLink.value.trim()) {
    showMessage('Title and Embed Link are required', 'danger')
    return
  }

  isSaving.value = true

  try {
    const url = isEditMode.value
      ? `/api/resources/update/${sectionID.value}/${articleId.value}`
      : '/api/resources/add'

    const payload = {
      title: title.value.trim(),
      description: description.value.trim(),
      embedLink: embedLink.value.trim(),
      ...(isEditMode.value ? {} : { section: sectionName.value.trim() })
    }

    const res = await fetch(url, {
      method: isEditMode.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) throw new Error('Save failed')

    showMessage(isEditMode.value ? 'Updated successfully!' : 'Added successfully!', 'success')

    setTimeout(() => router.push('/resources'), 1200)
  } catch (err) {
    showMessage('Failed to save', 'danger')
  } finally {
    isSaving.value = false
  }
}

// Delete
async function deleteArticle() {
  if (!confirm('Delete this article permanently?')) return

  isSaving.value = true
  try {
    const res = await fetch(`/api/resources/delete/${sectionID.value}/${articleId.value}`, {
      method: 'DELETE'
    })

    if (!res.ok) throw new Error('Delete failed')

    showMessage('Deleted successfully!', 'success')
    setTimeout(() => router.push('/resources'), 1200)
  } catch (err) {
    showMessage('Failed to delete', 'danger')
  } finally {
    isSaving.value = false
  }
}

// Message helper
function showMessage(text, type = 'success') {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    if (message.value === text) message.value = ''
  }, 4000)
}
</script>

<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-lg-10">

        <!-- Header -->
        <div class="d-flex align-items-center justify-content-between mb-5">
          <div>
            <h2 class="mb-1 fw-bold text">
              {{ isEditMode ? 'Edit Article' : 'Add New Article' }}
            </h2>
            <p class="text-muted mb-0">
              {{ isEditMode ? 'Update your article details' : 'Share helpful resources with parents' }}
            </p>
          </div>
          <RouterLink to="/resources" class="btn btn-outline-secondary btn-lg">
            Back to Resources
          </RouterLink>
        </div>

        <!-- Skeleton -->
        <div v-if="isLoading" class="card border-0 shadow-sm">
          <div class="card-body p-5 placeholder-glow">
            <div class="row g-4">
              <div class="col-lg-7">
                <div class="placeholder col-12 mb-4" style="height: 58px;"></div>
                <div class="placeholder col-12 mb-4" style="height: 120px;"></div>
                <div class="placeholder col-9" style="height: 58px;"></div>
              </div>
              <div class="col-lg-5">
                <div class="placeholder col-12" style="height: 58px;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Real Form -->
        <div v-else class="card border-0 shadow-lg">
          <div class="card-body p-5">

            <!-- Tip for Add mode -->
            <div v-if="!isEditMode" class="alert alert-light border mb-5">
              <strong>Quick Tip:</strong> Use Google Docs → <strong>File → Share → Publish to web</strong> → Copy link → Paste below
            </div>

            <form @submit.prevent="saveArticle">
              <div class="row g-5">
                <div class="col-lg-8">
                  <div class="mb-4">
                    <label class="form-label fw-bold text-dark">Embed Link (Google Docs)</label>
                    <input
                      v-model="embedLink"
                      type="url"
                      class="form-control form-control-lg"
                      placeholder="https://docs.google.com/document/d/..."
                      required
                      :disabled="isSaving"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="form-label fw-bold text-dark">Description</label>
                    <textarea
                      v-model="description"
                      class="form-control"
                      rows="5"
                      placeholder="Brief summary for parents..."
                      :disabled="isSaving"
                    ></textarea>
                  </div>

                  <div class="mb-4" v-if="!isEditMode">
                    <label class="form-label fw-bold text-dark">Section Name</label>
                    <input
                      v-model="sectionName"
                      type="text"
                      class="form-control"
                      placeholder="e.g. Parenting Tips, School Updates"
                      required
                      :disabled="isSaving"
                    />
                  </div>
                </div>

                <div class="col-lg-4">
                  <div class="mb-4">
                    <label class="form-label fw-bold text-dark">Article Title</label>
                    <input
                      ref="titleInput"
                      v-model="title"
                      type="text"
                      class="form-control form-control-lg"
                      placeholder="Enter a clear, helpful title..."
                      required
                      :disabled="isSaving"
                    />
                  </div>
                </div>
              </div>

              <!-- Buttons & Message -->
              <div class="d-flex flex-wrap align-items-center gap-3 mt-5 pt-4 border-top">
                <button
                  type="submit"
                  class="btn btn-success btn-lg px-5"
                  :disabled="isSaving || !title.trim() || !embedLink.trim()"
                >
                  <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                  {{ isSaving ? 'Saving...' : (isEditMode ? 'Update Article' : 'Add Article') }}
                </button>

                <button
                  v-if="isEditMode"
                  type="button"
                  class="btn btn-danger btn-lg"
                  @click="deleteArticle"
                  :disabled="isSaving"
                >
                  Delete Article
                </button>

                <div v-if="message" class="ms-auto">
                  <div
                    class="alert py-2 px-4 mb-0 d-inline-block fw-medium"
                    :class="messageType === 'success' ? 'alert-success' : 'alert-danger'"
                  >
                    {{ message }}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.spinner-border-sm { width: 1rem; height: 1rem; }
.alert { animation: fadeIn 0.4s; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
}
.card {
  border-radius: 1rem;
}
</style>