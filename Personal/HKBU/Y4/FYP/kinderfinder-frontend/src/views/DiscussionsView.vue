<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Data from backend
const discussions = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
const search = ref('')
const isLoading = ref(true)  // Will be true during initial load AND page changes

// Load discussions from backend with pagination + search
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

// Detail & Add
function goToDetail(discussion) {
  router.push({
    path: `/discussion/detail/${discussion._id}`,
    state: { discussion }
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

  <div class="container mt-4 pb-5">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="mb-1 fw-bold text-primary">Discussion Board</h2>
        <p class="text-muted mb-0">
          Page {{ currentPage }} of {{ totalPages }} 
          <span v-if="search"> • Searching "{{ search }}"</span>
        </p>
      </div>

      <button class="btn btn-primary btn-md shadow-sm px-4" @click="goToAdd">
        Add Discussion
      </button>
    </div>

    <!-- Search Bar -->
    <div class="row justify-content-center mb-4">
      <div class="col-lg-8">
        <div class="input-group input-group-lg shadow-sm rounded-pill overflow-hidden">
          <span class="input-group-text bg-white border-0">
            Search
          </span>
          <input
            v-model="search"
            type="text"
            class="form-control border-0 shadow-none"
            placeholder="Search by title or #hashtag..."
            autofocus
          />
          <button
            v-if="search"
            class="btn btn-outline-secondary border-0"
            @click="search = ''; currentPage = 1; loadDiscussions()"
          >
            Clear
          </button>
        </div>
        <small class="text-muted d-block mt-2 text-center">
          Type to search instantly • Try: school, parent, #kindergarten
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
            class="card shadow-sm hover-shadow transition-all border-0 h-100"
            style="border-radius: 20px; cursor: pointer;"
            @click="goToDetail(d)"
          >
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
                  Last updated {{ new Date(d.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) }}
                </small>
              </div>
              <div class="text-end">
                <i class="fas fa-chevron-right text-primary fs-3"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="discussions.length === 0" class="text-center py-5">
        <i class="fas fa-comments fs-1 text-muted mb-4 opacity-50"></i>
        <h4 class="text-muted">No discussions found</h4>
        <p class="text-muted">Try a different search or start a new discussion!</p>
      </div>

      <!-- Pagination (disabled during loading) -->
      <nav v-if="totalPages > 1" class="mt-5">
        <ul class="pagination justify-content-center pagination-lg">
          <li class="page-item" :class="{ disabled: currentPage === 1 || isLoading }">
            <button class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1 || isLoading">
              Previous
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
              Next
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
</style>