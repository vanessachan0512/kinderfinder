<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { jwtDecode } from "jwt-decode"
import { useDiscussionDetailStore } from '@/store/discussionDetail'

const router = useRouter()

const token = localStorage.getItem('token')
const decoded = token ? jwtDecode(token) : null
const userId = decoded?._id

// Data from backend
const discussions = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
const search = ref('')
const isLoading = ref(true)

const bookmarks = ref([])

// Pinia store
const store = useDiscussionDetailStore()

if (decoded && Array.isArray(decoded.discussionsBookmark)) {
  bookmarks.value = decoded.discussionsBookmark
    .map(id => typeof id === 'string' ? id : id.toString())
  console.log('Bookmarks instantly loaded from JWT:', bookmarks.value)
}

// Load user's bookmarks once on mount
onMounted(async () => {
  if (!userId) {
    console.log('No logged-in user — skipping bookmark load')
    return
  }

  try {
    const res = await fetch(`/api/users/${userId}`)
    if (!res.ok) throw new Error('Failed to fetch user data')

    const data = await res.json()

    // This overwrites the JWT version with the latest from server
    const serverBookmarks = (data.discussionsBookmark || [])
      .map(id => typeof id === 'string' ? id : id.toString())

    bookmarks.value = serverBookmarks
    console.log('Bookmarks synced from server:', bookmarks.value)

  } catch (err) {
    console.error('Failed to load discussion bookmarks from server:', err)
    // If server fails, keep the JWT version (better than empty)
  }
})

// Optimistic toggle with backend sync
const toggleBookmark = async (discussionId) => {
  const idStr = discussionId.toString()
  const previous = [...bookmarks.value]

  // Instant UI update
  if (bookmarks.value.includes(idStr)) {
    bookmarks.value = bookmarks.value.filter(id => id !== idStr)
  } else {
    bookmarks.value.push(idStr)
  }

  try {
    const res = await fetch(`/api/users/${userId}/bookmark`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discussionId })
    })

    if (!res.ok) throw new Error("Backend failed")

    const data = await res.json()
    bookmarks.value = data.discussionsBookmark.map(id => id.toString())
  } catch (err) {
    console.error("Bookmark toggle failed:", err)
    bookmarks.value = previous // rollback
  }
}

// Load discussions with pagination + search
async function loadDiscussions() {
  isLoading.value = true

  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      search: search.value.trim()
    })

    const res = await fetch(`/api/discussions?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to load')

    const data = await res.json()
    discussions.value = data.discussions || []
    currentPage.value = data.page || 1
    totalPages.value = data.totalPages || 1
  } catch (err) {
    console.error('Load failed:', err)
    discussions.value = []
    totalPages.value = 1
  } finally {
    isLoading.value = false
  }
}

// Debounced search
let searchTimeout
watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadDiscussions()
  }, 500)
})

// Page navigation
function goToPage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value || isLoading.value) return
  currentPage.value = page
  loadDiscussions()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Navigate to detail with instant data via Pinia
function goToDetail(discussion) {
  const isBookmarked = bookmarks.value.includes(discussion._id.toString())

  // Pass data instantly via store
  store.setPassedData(discussion, isBookmarked)

  router.push({
    name: 'Detaildiscussions',
    params: { discussionId: discussion._id }
  })
}

function goToAdd() {
  router.push('/discussion/add')
}

onMounted(() => {
  loadDiscussions()
})
</script>

<template>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"/>

  <div class="container mt-5 pb-5">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="mb-1 fw-bold text">{{ $t('discussionBoard') }}</h2>
        <p class="text-muted mb-0">
          {{ $t('pageOf', { current: currentPage, total: totalPages }) }}
          <span v-if="search"> • {{ $t('searching', { query: search }) }}</span>
        </p>
      </div>

      <button v-if="decoded" class="btn btn-primary btn-md shadow-sm px-4" @click="goToAdd">
        {{ $t('addDiscussion') }}
      </button>
    </div>

    <!-- Search Bar -->
    <div class="row justify-content-center mb-4">
      <div class="col-lg-8">
        <div class="input-group input-group-lg shadow-sm rounded-pill overflow-hidden">
          <span class="input-group-text bg-white border-0">
            {{ $t('search') }}
          </span>
          <input
            v-model="search"
            type="text"
            class="form-control border-0 shadow-none"
            :placeholder="$t('searchPlaceholder2')"
            autofocus
          />
          <button
            v-if="search"
            class="btn btn-outline-secondary border-0"
            @click="search = ''; currentPage = 1; loadDiscussions()"
          >
            {{ $t('clear') }}
          </button>
        </div>
        <small class="text-muted d-block mt-2 text-center">
          {{ $t('searchHint') }}
        </small>
      </div>
    </div>

    <!-- Loading State: Skeleton Cards (shown on first load AND page changes) -->
    <div v-if="isLoading" class="row row-cols-1 g-4">
      <div v-for="n in 5" :key="n" class="col">
        <div class="card mb-3 placeholder-glow border-0" style="border-radius: 20px;">
          <div class="card-body d-flex align-items-center p-4">
            <div class="placeholder rounded me-4" style="width: 90px; height: 90px;"></div>
            <div class="flex-grow-1">
              <h5 class="placeholder-glow mb-3"><span class="placeholder col-8"></span></h5>
              <div class="placeholder-glow mb-2"><span class="placeholder col-4"></span></div>
              <small class="placeholder-glow"><span class="placeholder col-5"></span></small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actual Discussions (only when not loading) -->
    <div v-else>
      <div class="row row-cols-1 g-4">
        <div
          v-for="d in discussions"
          :key="d._id"
          class="col"
        >
          <div
            class="card shadow-sm hover-shadow transition-all border-0 h-100 position-relative"
            style="border-radius: 20px; cursor: pointer;"
            @click="goToDetail(d)"
            >
            <!-- Bookmark Icon -->
            <div v-if="decoded" class="bookmark-btn" @click.stop="toggleBookmark(d._id)">
            <i 
                :class="bookmarks.includes(d._id) 
                ? 'fa-solid fa-bookmark text-warning' 
                : 'fa-regular fa-bookmark'"
                class="fs-3"
            ></i>
            </div>

            <div class="card-body d-flex align-items-center p-4">
              <div class="rounded me-4 bg-light d-flex align-items-center justify-content-center"
                   style="width: 90px; height: 90px; font-size: 2.5rem;">
                {{ d.image || '💬' }}
              </div>
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
                  {{ $t('lastUpdated', { 
                    date: new Date(d.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  }) }}
                </small>
              </div>
              <div class="text-end" style="margin-top: 5%;">
                <i class="fas fa-chevron-right text-primary fs-3" ></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="discussions.length === 0" class="text-center py-5">
        <i class="fas fa-comments fs-1 text-muted mb-4 opacity-50"></i>
        <h4 class="text-muted">{{ $t('noDiscussions') }}</h4>
        <p class="text-muted">{{ $t('noDiscussionsHint') }}</p>
      </div>

      <!-- Pagination (disabled during loading) -->
      <nav v-if="totalPages > 1" class="mt-5">
        <ul class="pagination justify-content-center pagination-lg">
          <li class="page-item" :class="{ disabled: currentPage === 1 || isLoading }">
            <button class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1 || isLoading">
              {{ $t('previous') }}
            </button>
          </li>

          <!-- Show first 5 pages or smart range -->
          <li
            v-for="pageNum in (totalPages <= 5 ? totalPages : 5)"
            :key="pageNum"
            class="page-item"
            :class="{ active: currentPage === pageNum, disabled: isLoading }"
          >
            <button class="page-link" @click="goToPage(pageNum)" :disabled="isLoading">
              {{ pageNum }}
            </button>
          </li>

          <li v-if="totalPages > 5" class="page-item disabled"><span class="page-link">…</span></li>
          <li v-if="totalPages > 5" class="page-item" :class="{ disabled: isLoading }">
            <button class="page-link" @click="goToPage(totalPages)" :disabled="isLoading">
              {{ totalPages }}
            </button>
          </li>

          <li class="page-item" :class="{ disabled: currentPage === totalPages || isLoading }">
            <button class="page-link" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages || isLoading">
              {{ $t('next') }}
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.hover-shadow {
  transition: all 0.3s ease;
}
.hover-shadow:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
}
.card {
  border-radius: 20px;
  overflow: hidden;
}
.bg-gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.input-group-lg {
  border-radius: 50px;
}
.placeholder-glow .placeholder {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.8s infinite;
}
@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.bookmark-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 20;
  background: rgba(255,255,255,0.9);
  padding: 6px 10px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.bookmark-btn:hover {
  transform: scale(1.15);
}

</style>