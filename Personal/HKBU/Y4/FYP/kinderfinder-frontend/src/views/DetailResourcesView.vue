<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { jwtDecode } from 'jwt-decode'
import { useResourceDetailStore } from '../store/resourceDetail'

const route = useRoute()
const router = useRouter()

const article = ref(null)
const isBookmarked = ref(false)
const isLoading = ref(true)

const token = localStorage.getItem('token')
const decoded = token ? jwtDecode(token) : null
const userId = decoded?._id

const articleId = route.params.articleId?.toString()
const sectionId = route.params.sectionID

const store = useResourceDetailStore()

// === Instant load from Pinia store ===
const loadedFromStore = ref(false)

if (store.passedArticle) {
  article.value = store.passedArticle
  loadedFromStore.value = true
}

if (store.passedIsBookmarked !== null) {
  isBookmarked.value = store.passedIsBookmarked
  console.log('Initial bookmark from store:', isBookmarked.value)
  loadedFromStore.value = true
}

// Clear store when leaving the page (prevents stale data on direct access)
onUnmounted(() => {
  store.clearPassedData()
})

// === Fallback: Load from backend if not from store ===
const loadArticleAndBookmark = async () => {
  if (!articleId || !userId) {
    isLoading.value = false
    return
  }

  try {
    // Fetch article only if not provided by store
    if (!article.value) {
      const articleRes = await fetch(`/api/resources/detail/${sectionId}/${articleId}`)
      if (!articleRes.ok) throw new Error('Article not found')
      const articleData = await articleRes.json()
      article.value = articleData.article
    }

    // Fetch bookmark status only if not provided by store
    if (!loadedFromStore.value) {
      const userRes = await fetch(`/api/users/${userId}`)
      if (userRes.ok) {
        const userData = await userRes.json()
        const bookmarkIds = (userData.resourcesBookmark || []).map(id => id.toString())
        isBookmarked.value = bookmarkIds.includes(articleId)
      }
    }
  } catch (err) {
    console.error('Failed to load article or bookmark status:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadArticleAndBookmark()
})

// === Optimistic Bookmark Toggle ===
const toggleBookmark = async () => {
  if (!userId || !articleId) return

  const previous = isBookmarked.value

  // Instant UI update
  isBookmarked.value = !isBookmarked.value

  try {
    const res = await fetch(`/api/users/${userId}/bookmark`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId })
    })

    if (!res.ok) throw new Error("Failed to update bookmark")

    const data = await res.json()
    const bookmarkIds = data.resourcesBookmark.map(id => id.toString())
    isBookmarked.value = bookmarkIds.includes(articleId)
  } catch (err) {
    console.error("Bookmark failed:", err)
    isBookmarked.value = previous // rollback
  }
}
</script>

<template>
  <div class="container py-5">
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading article...</p>
    </div>

    <!-- Article Content -->
    <div v-else-if="article" class="position-relative">
        <div class="text">
        <h2 class="fw-bold">{{ article.title }}</h2>
        <p class="text-muted lead">{{ article.description }}</p>
      </div>
      <!-- Bookmark Button -->
      <div class="bookmark-btn" @click.stop="toggleBookmark">
        <i 
          :class="isBookmarked 
            ? 'bi bi-bookmark-fill text-warning' 
            : 'bi bi-bookmark text-muted'"
          class="fs-2"
        ></i>
      </div>

       <div class="iframe-container">
      <!-- Vue binding instead of EJS -->
      <iframe
        :src="article.embedLink"
        frameborder="0"
        allowfullscreen
      ></iframe>
    </div>
    </div>

    <!-- Error -->
    <div v-else class="text-center py-5 text-muted">
      <p>Article not found.</p>
      <button @click="router.back()" class="btn btn-outline-primary rounded-pill">
        ← Go Back
      </button>
    </div>
  </div>
</template>

<style scoped>
.content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.iframe-container {
  width: 100%;
  max-width: 300%;
  height: 90vh;
  /* margin-top: 5%; */
}

iframe {
  width: 100%;
  height: 200%;
  border: none;
}
.bookmark-btn {
  position: absolute;
  top: 3px;
  right: 20px;
  z-index: 9999;
  background: rgba(255,255,255,0.85);
  padding: 8px 12px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.bookmark-btn:hover {
  transform: scale(1.15);
}

</style>
