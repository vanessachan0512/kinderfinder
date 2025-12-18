<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { jwtDecode } from "jwt-decode"
import { useResourceDetailStore } from '@/store/resourceDetail'

const route = useRoute()
const router = useRouter()

const token = localStorage.getItem('token')
const decoded = token ? jwtDecode(token) : null
const userId = decoded?._id;
const bookmarks = ref([]);

if (decoded && Array.isArray(decoded.resourcesBookmark)) {
  // If your backend puts resourcesBookmark directly in the JWT payload
  bookmarks.value = decoded.resourcesBookmark
    .map(id => typeof id === 'string' ? id : id.toString())
  console.log('Bookmarks loaded instantly from JWT:', bookmarks.value)
}

// ✅ Load bookmarks from backend
onMounted(async () => {
  if (!userId) {
    console.log('No user logged in — no bookmarks to load')
    return
  }

  try {
    const res = await fetch(`/api/users/${userId}`)
    if (!res.ok) throw new Error('Failed to fetch user data')

    const data = await res.json()

    // This overwrites the instant JWT version with the authoritative server version
    const serverBookmarks = (data.resourcesBookmark || []).map(id => 
      typeof id === 'string' ? id : id.toString()
    )

    bookmarks.value = serverBookmarks
    console.log('Bookmarks synced from server:', bookmarks.value)

  } catch (err) {
    console.error("Failed to load resource bookmarks from server:", err)
    // Keep the JWT version if server fails (better than nothing)
  }
})

// ✅ Optimistic UI toggle
const toggleBookmark = async (articleId) => {
  const idStr = articleId.toString();

  // Save previous state for rollback
  const previous = [...bookmarks.value];

  // ✅ Instant UI update
  if (bookmarks.value.includes(idStr)) {
    bookmarks.value = bookmarks.value.filter(id => id !== idStr);
  } else {
    bookmarks.value.push(idStr);
  }

  // ✅ Backend update
  try {
    const res = await fetch(`/api/users/${decoded._id}/bookmark`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId })
    });

    if (!res.ok) throw new Error("Backend failed");

    const data = await res.json();

    // Sync with backend
    bookmarks.value = data.resourcesBookmark.map(id => id.toString());

  } catch (err) {
    console.error("Bookmark toggle failed:", err);

    // Rollback UI
    bookmarks.value = previous;
  }
};

// Data
const sections = ref([])
const page = ref(parseInt(route.query.page) || 1)
const perPage = ref(6)
const totalPages = ref(1)
const activeSection = ref('')

// Loading states
const isLoading = ref(false)
const isFirstLoad = ref(true)

// Magic cache: page number → data
const pageCache = ref(new Map())

// Fetch + cache + instant UI
async function fetchPage(pageNum) {
  if (pageCache.value.has(pageNum)) {
    const cached = pageCache.value.get(pageNum)
    sections.value = cached.sections
    totalPages.value = cached.totalPages
    page.value = pageNum
    activeSection.value = sections.value[0]?.section || ''
    isLoading.value = false
    return
  }

  if (isFirstLoad.value) isLoading.value = true

  try {
    const res = await fetch(`/api/resources?page=${pageNum}&perPage=${perPage.value}`)
    if (!res.ok) throw new Error('Failed to fetch')

    const data = await res.json()

    pageCache.value.set(pageNum, {
      sections: data.sections || [],
      totalPages: data.totalPages || 1
    })

    sections.value = data.sections || []
    totalPages.value = data.totalPages || 1
    page.value = pageNum

    if (sections.value.length > 0 && !activeSection.value) {
      activeSection.value = sections.value[0].section
    }

    router.replace({ query: { ...route.query, page: pageNum } }).catch(() => {})
  } catch (err) {
    console.error('Load failed:', err)
    sections.value = []
  } finally {
    isLoading.value = false
    isFirstLoad.value = false
  }
}

// INSTANT EDIT: Pass full article data via state
function goToEdit(section, article) {
  router.push({
    name: 'Edit Resource', // make sure your edit route has this name
    params: {
      sectionID: section._id,
      articleId: article.objectId
    },
    state: {
      article: {
        title: article.title,
        description: article.description || '',
        embedLink: article.embedLink || '',
        image: article.image || ''
      },
      section: {
        _id: section._id,
        name: section.section
      }
    }
  })
}

const goToDetail = (sectionId, article) => {
  const store = useResourceDetailStore()
  store.setPassedData(article, bookmarks.value.includes(article.objectId.toString()))

  router.push({
    name: "DetailResources",
    params: {
      sectionID: sectionId,
      articleId: article.objectId
    }
  })
}

// Page navigation
function goToPage(newPage) {
  if (newPage < 1 || newPage > totalPages.value || newPage === page.value) return
  page.value = newPage
  router.push({ query: { ...route.query, page: newPage } }).catch(() => {})
  fetchPage(newPage)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// First load
onMounted(() => {
  fetchPage(page.value)
})

// Browser back/forward
watch(() => route.query.page, (newVal) => {
  const p = parseInt(newVal) || 1
  if (p !== page.value) goToPage(p)
})

// Preload next page
watch(page, (current) => {
  if (current < totalPages.value) {
    const next = current + 1
    if (!pageCache.value.has(next)) {
      fetch(`/api/resources?page=${next}&perPage=${perPage.value}`)
    }
  }
})
</script>

<template>
  <div class="container mt-4 pb-5">

    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h2 class="mb-1 fw-bold text">Resources</h2>
        <p class="text-muted mb-0">Click on your interested section!</p>
      </div>
        <div v-if="decoded && decoded.isAdmin === false">
            <RouterLink class="btn btn-primary" to="/resource/add">
                Add Resource
            </RouterLink>
        </div>
    </div>

    <!-- SKELETON: Only first load -->
    <div v-if="isFirstLoad && isLoading">
      <ul class="nav nav-tabs mb-4">
        <li v-for="n in 4" :key="n" class="nav-item">
          <a class="nav-link placeholder-glow">
            <span class="placeholder col-5"></span>
          </a>
        </li>
      </ul>
      <div class="row row-cols-1 row-cols-md-3 g-4">
        <div v-for="n in 6" :key="n" class="col">
          <div class="card h-100 placeholder-glow">
            <div class="ratio ratio-16x9 bg-light">
              <div class="placeholder w-100 h-100"></div>
            </div>
            <div class="card-body">
              <h5 class="card-title placeholder-glow">
                <span class="placeholder col-8"></span>
              </h5>
              <p class="card-text placeholder-glow">
                <span class="placeholder col-12"></span>
                <span class="placeholder col-10"></span>
                <span class="placeholder col-7"></span>
              </p>
            </div>
            <div class="card-footer">
              <span class="btn btn-outline-primary disabled placeholder col-4"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- REAL CONTENT -->
    <div v-else>
      <ul class="nav nav-tabs mb-4">
        <li v-for="section in sections" :key="section._id" class="nav-item">
          <button
            class="nav-link"
            :class="{ active: activeSection === section.section }"
            @click="activeSection = section.section"
          >
            {{ section.section }}
            <span class="badge bg-secondary ms-2">{{ section.articles.length }}</span>
          </button>
        </li>
      </ul>

      <div class="tab-content">
        <div
          v-for="section in sections"
          :key="section._id"
          class="tab-pane fade"
          :class="{ 'show active': activeSection === section.section }"
        >
          <div class="row row-cols-1 row-cols-md-3 g-4">
            <div v-for="article in section.articles" :key="article.objectId" class="col">
              <div class="card h-100 shadow-sm hover-shadow transition-all border-0 overflow-hidden position-relative">
                <!-- ✅ Bookmark Icon -->
                <div class="bookmark-btn" @click.stop="toggleBookmark(article.objectId)">
                <i 
                    :class="bookmarks.includes(article.objectId.toString()) 
                    ? 'bi bi-bookmark-fill text-warning' 
                    : 'bi bi-bookmark'"
                    class="fs-3"
                ></i>
                </div>
               <div
                class="text-decoration-none text-dark"
                @click="goToDetail(section._id, article)"
                style="cursor: pointer;"
                >

                  <img
                    :src="article.image || 'https://via.placeholder.com/400x250?text=No+Image'"
                    class="card-img-top"
                    style="height: 200px; object-fit: cover;"
                    alt="Article"
                    loading="lazy"
                  />
                  <div class="card-body d-flex flex-column">
                    <h5 class="card-title mb-2">{{ article.title }}</h5>
                    <p class="card-text text-muted flex-grow-1 small">
                      {{ article.description || 'No description' }}
                    </p>
                  </div>
                </div>
                <div v-if="decoded && decoded.isAdmin === false" class="card-footer bg-white border-top-0 pt-3">
                  <!-- INSTANT EDIT BUTTON -->
                  <button
                    @click.stop="goToEdit(section, article)"
                    class="btn btn-sm btn-outline-primary w-100"
                  >
                    Edit Article
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="section.articles.length === 0" class="text-center py-5 text-muted">
            No articles in this section yet.
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <nav v-if="totalPages > 1" class="mt-5">
        <ul class="pagination justify-content-center">
          <li class="page-item" :class="{ disabled: page <= 1 }">
            <button class="page-link" @click="goToPage(page - 1)" :disabled="page <= 1">
              Previous
            </button>
          </li>

          <template v-for="i in Math.min(totalPages, 7)" :key="i">
            <li
              v-if="i === 1 || i === totalPages || Math.abs(i - page) <= 2"
              class="page-item"
              :class="{ active: i === page }"
            >
              <button class="page-link" @click="goToPage(i)">{{ i }}</button>
            </li>
            <li v-if="i < totalPages && Math.abs(i - page) === 3" class="page-item disabled">
              <span class="page-link">…</span>
            </li>
          </template>

          <li class="page-item" :class="{ disabled: page >= totalPages }">
            <button class="page-link" @click="goToPage(page + 1)" :disabled="page >= totalPages">
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
  transition: all 0.25s ease;
}
.hover-shadow:hover {
  transform: translateY(-6px);
  box-shadow: 0 15px 35px rgba(0,0,0,0.15) !important;
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
.nav-tabs .nav-link {
  border-radius: 12px 12px 0 0;
  font-weight: 500;
}
.card {
  border-radius: 12px;
  overflow: hidden;
}
.bookmark-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 20;
  background: rgba(255,255,255,0.85);
  padding: 6px 10px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.bookmark-btn:hover {
  transform: scale(1.15);
}

</style>