<template>
  <div class="container my-5">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">{{ $t('myDiscussions') }}</h2>
      <router-link to="/discussion/add" class="btn btn-primary">
        <i class="bi bi-plus-lg me-2"></i>{{ $t('newDiscussion') }}
      </router-link>
    </div>

    <!-- Tabs -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'created' }"
          @click="activeTab = 'created'"
        >
          {{ $t('created') }}
          <span class="badge bg-secondary ms-1" v-if="createdCount > 0">{{ createdCount }}</span>
        </button>
      </li>
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'commented' }"
          @click="activeTab = 'commented'"
        >
          {{ $t('commented') }}
          <span class="badge bg-secondary ms-1" v-if="commentedCount > 0">{{ commentedCount }}</span>
        </button>
      </li>
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'drafts' }"
          @click="activeTab = 'drafts'"
        >
          {{ $t('drafts') }}
          <span class="badge bg-secondary ms-1" v-if="draftsCount > 0">{{ draftsCount }}</span>
        </button>
      </li>
    </ul>

    <!-- Created Tab Content -->
    <div v-show="activeTab === 'created'">
    <div v-if="loading.created" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">{{ $t('loading') }}</span>
        </div>
    </div>

    <div v-else-if="createdDiscussions.length === 0" class="text-center py-5 text-muted">
        <p class="mb-4">{{ $t('noCreatedDiscussions') }}</p>
        <router-link to="/discussion/add" class="btn btn-outline-primary">
        {{ $t('startFirstDiscussion') }}
        </router-link>
    </div>

    <div v-else>
        <div
        v-for="d in createdDiscussions"
        :key="d._id"
        class="card mb-3 shadow-sm border-0 hover-shadow"
        >
        <router-link :to="`/discussion/detail/${d._id}`" class="text-decoration-none">
            <div class="card-body d-flex align-items-center p-4">
            <!-- Image / Emoji -->
            <div
                class="rounded me-4 bg-light d-flex align-items-center justify-content-center"
                style="width: 90px; height: 90px; font-size: 2.5rem;"
            >
                {{ d.image || '💬' }}
            </div>

            <!-- Content -->
            <div class="flex-grow-1">
                <h5 class="card-title mb-2 fw-bold text-dark fs-4">{{ d.title }}</h5>

                <!-- Hashtags -->
                <div v-if="d.hashtags?.length" class="mb-3">
                <span
                    v-for="tag in d.hashtags"
                    :key="tag"
                    class="badge bg-gradient-primary text-white me-2 fs-6 px-3 py-2"
                    style="border-radius: 50px;"
                >
                    {{ tag }}
                </span>
                </div>

                <small class="text-muted d-block">
                {{ $t('lastUpdated') }}
                {{ new Date(d.updatedAt || d.lastActivity || d.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) }}
                </small>
            </div>
            </div>
        </router-link>
        </div>
    </div>
    </div>

    <!-- Commented Tab Content -->
    <div v-show="activeTab === 'commented'">
    <div v-if="loading.commented" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">{{ $t('loading') }}</span>
        </div>
    </div>

    <div v-else-if="commentedDiscussions.length === 0" class="text-center py-5 text-muted">
        <p>{{ $t('noCommentedDiscussions') }}</p>
    </div>

    <div v-else>
        <div
        v-for="d in commentedDiscussions"
        :key="d._id"
        class="card mb-3 shadow-sm border-0 hover-shadow"
        >
        <router-link :to="`/discussion/detail/${d._id}`" class="text-decoration-none">
            <div class="card-body d-flex align-items-center p-4">
            <!-- Image / Emoji -->
            <div
                class="rounded me-4 bg-light d-flex align-items-center justify-content-center"
                style="width: 90px; height: 90px; font-size: 2.5rem;"
            >
                {{ d.image || '💬' }}
            </div>

            <!-- Content -->
            <div class="flex-grow-1">
                <h5 class="card-title mb-2 fw-bold text-dark fs-4">{{ d.title }}</h5>

                <!-- Hashtags -->
                <div v-if="d.hashtags?.length" class="mb-3">
                <span
                    v-for="tag in d.hashtags"
                    :key="tag"
                    class="badge bg-gradient-primary text-white me-2 fs-6 px-3 py-2"
                    style="border-radius: 50px;"
                >
                    {{ tag }}
                </span>
                </div>

                <small class="text-primary fw-bold d-block">
                {{ $t('youCommented') }} {{ formatRelativeTime(d.userCommentedAt) }}
                </small>
            </div>
            </div>
        </router-link>
        </div>
    </div>
    </div>


    <!-- Drafts Tab Content -->
    <div v-show="activeTab === 'drafts'">
      <div v-if="loading.drafts" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ $t('loading') }}</span>
        </div>
      </div>

      <div v-else-if="drafts.length === 0" class="text-center py-5 text-muted">
        <p>{{ $t('noDrafts') }}</p>
      </div>

      <div v-else>
        <div
          v-for="draft in drafts"
          :key="draft._id"
          class="card mb-3 shadow-sm border-0 hover-shadow"
        >
          <div class="card-body d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
              <h5 class="card-title mb-1">
                {{ draft.title || $t('untitledDraft') }}
              </h5>
              <p class="text-muted small mb-2">
                {{ draft.preview || $t('noContentYet') }}
              </p>
              <small class="text-muted">
                {{ $t('lastEdited') }} {{ formatRelativeTime(draft.updatedAt || draft.createdAt) }}
              </small>
            </div>

            <div class="ms-3">
              <router-link
                :to="`/discussion/edit/${draft._id}`"
                class="btn btn-sm btn-outline-primary me-2"
              >
                {{ $t('continue') }}
              </router-link>
              <button @click="deleteDraft(draft._id)" class="btn btn-sm btn-outline-danger">
                {{ $t('delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'
import { jwtDecode } from "jwt-decode"

const token = localStorage.getItem('token')
const decoded = token ? jwtDecode(token) : null
const userId = decoded?._id

const activeTab = ref('created')

const createdDiscussions = ref([])
const commentedDiscussions = ref([])
const drafts = ref([])

const loading = ref({
  created: false,
  commented: false,
  drafts: false
})

const createdCount = computed(() => createdDiscussions.value.length)
const commentedCount = computed(() => commentedDiscussions.value.length)
const draftsCount = computed(() => drafts.value.length)

async function loadUserData() {
  try {
    const res = await fetch(`/api/users/${userId}`)
    if (!res.ok) throw new Error('Failed to fetch user data')
    const user = await res.json()

    // === CREATED DISCUSSIONS ===
    const createdIds = (user.discussions || []).filter(d => !d.isDraft).map(d => d.discussionId)
    createdDiscussions.value = await Promise.all(
      createdIds.map(id =>
        fetch(`/api/discussions/${id}`).then(r => r.ok ? r.json() : null)
      )
    ).then(arr => arr.filter(Boolean))

    // === COMMENTED DISCUSSIONS ===
    const commentedRaw = user.commentedDiscussions || []

    commentedDiscussions.value = await Promise.all(
    commentedRaw.map(async cd => {
        const res = await fetch(`/api/discussions/${cd.discussionId}`)
        if (!res.ok) return null
        const discussion = await res.json()
        // merge user's commentedAt into the discussion object
        return {
        ...discussion,
        userCommentedAt: cd.commentedAt
        }
    })
    ).then(arr => arr.filter(Boolean))


    // === DRAFTS ===
    const draftIds = (user.discussions || []).filter(d => d.isDraft).map(d => d.discussionId)
    drafts.value = await Promise.all(
      draftIds.map(id =>
        fetch(`/api/discussions/${id}`).then(r => r.ok ? r.json() : null)
      )
    ).then(arr => arr.filter(Boolean))

  } catch (err) {
    console.error('Failed to load user data:', err)
  } finally {
    loading.value.created = false
    loading.value.commented = false
    loading.value.drafts = false
  }
}

onMounted(() => {
  loading.value.created = true
  loading.value.commented = true
  loading.value.drafts = true
  loadUserData()
})

async function deleteDraft(discussionId) {
  if (!discussionId) return;

  if (!confirm("Are you sure you want to delete this draft?")) return;

  try {
    // 1. Delete the discussion itself
    const res = await fetch(`/api/discussions/${discussionId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete draft');

    // 2. Remove reference from user profile
    await fetch(`/api/users/${userId}/discussions/${discussionId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    // 3. Update frontend state immediately
    drafts.value = drafts.value.filter(d => d._id !== discussionId);

    // 4. Show feedback
    message.value = 'Draft deleted successfully!';
  } catch (err) {
    console.error('Delete failed:', err);
    message.value = err.message || 'Something went wrong. Please try again.';
  }
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return 'just now'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.round(diffMs / 60000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
  const diffMonth = Math.floor(diffDay / 30)
  return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`
}
</script>


<style scoped>
.hover-shadow {
  transition: box-shadow 0.2s ease;
}
.hover-shadow:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}
.nav-tabs .nav-link {
  font-weight: 500;
  color: #495057;
}
.nav-tabs .nav-link.active {
  color: #0d6efd;
  border-color: #dee2e6 #dee2e6 #fff;
}
</style>