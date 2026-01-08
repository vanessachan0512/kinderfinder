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
const sectionID = route.params.sectionID?.toString()  // ← now used

const store = useResourceDetailStore()

// === Instant load from Pinia store (when navigating from list/bookmarks) ===
let loadedFromStore = false

if (store.passedArticle) {
  article.value = store.passedArticle
  loadedFromStore = true
}

if (store.passedIsBookmarked !== null) {
  isBookmarked.value = store.passedIsBookmarked
  console.log('Bookmark status from store:', isBookmarked.value)
  loadedFromStore = true
}

// Clear store when leaving
onUnmounted(() => {
  store.clearPassedData()
})

// === Fallback: Load from backend if not from store ===
const loadArticleAndBookmark = async () => {
  if (!articleId || !sectionID) {
    isLoading.value = false
    return
  }

  try {
    // Load article if not from store
    if (!article.value) {
      const articleRes = await fetch(`/api/resources/detail/${sectionID}/${articleId}`)
      if (!articleRes.ok) throw new Error('Article not found')
      const articleData = await articleRes.json()
      article.value = articleData.article
    }

    // Load bookmark status if not from store
    if (!loadedFromStore && userId) {
      const userRes = await fetch(`/api/users/${userId}`)
      if (userRes.ok) {
        const userData = await userRes.json()

        const serverBookmarks = (userData.resourcesBookmark || []).map(b => ({
          articleId: b.articleId?.toString() || b.articleId,
          sectionID: b.sectionID?.toString() || b.sectionID
        }))

        isBookmarked.value = serverBookmarks.some(
          b => b.articleId === articleId && b.sectionID === sectionID
        )
      }
    }
  } catch (err) {
    console.error('Failed to load article or bookmark:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadArticleAndBookmark()
})

// === Toggle Bookmark (with both IDs) ===
const toggleBookmark = async () => {
  if (!userId || !articleId || !sectionID) return

  const previous = isBookmarked.value

  // Instant UI update
  isBookmarked.value = !isBookmarked.value

  try {
    const res = await fetch(`/api/users/${userId}/bookmark`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        articleId, 
        sectionID 
      })
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed: ${errorText || res.status}`)
    }

    const data = await res.json()

    // Sync with server
    const serverBookmarks = (data.resourcesBookmark || []).map(b => ({
      articleId: b.articleId.toString(),
      sectionID: b.sectionID.toString()
    }))

    isBookmarked.value = serverBookmarks.some(
      b => b.articleId === articleId && b.sectionID === sectionID
    )

  } catch (err) {
    console.error("Bookmark sync failed:", err)
    alert("Failed to update bookmark. Reverted.")
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
    <button @click="router.back()" class="btn btn-outline-secondary">
    <font-awesome-icon icon="arrow-left" class="me-2" />
    Back
    </button>


      <div class="text">
        <h2 class="fw-bold">{{ article.title }}</h2>
        <p class="text-muted lead">{{ article.description }}</p>
      </div>

      <!-- Bookmark Button -->
      <div v-if="decoded" class="bookmark-btn" @click.stop="toggleBookmark">
        <i 
          :class="isBookmarked 
            ? 'bi bi-bookmark-fill text-warning fs-2' 
            : 'bi bi-bookmark text-muted fs-2'"
        ></i>
      </div>

      <div class="iframe-container">
        <iframe
          :src="article.embedLink"
          frameborder="0"
          allowfullscreen
        ></iframe>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="text-center py-5 text-muted">
      <p>Article not found.</p>
      <button @click="router.back()" class="btn btn-outline-primary rounded-pill">
        ← Go Back
      </button>
    </div>
  </div>
</template>

<style scoped>
.iframe-container {
  width: 100%;
  max-width: 300%;
  height: 90vh;
}

iframe {
  width: 100%;
  height: 200%;
  border: none;
}

.bookmark-btn {
  position: absolute;
  top: 10px;
  right: 20px;
  /* z-index: 9999; */
  background: rgba(255,255,255,0.9);
  padding: 10px 14px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.bookmark-btn:hover {
  transform: scale(1.15);
  background: white;
}
</style>