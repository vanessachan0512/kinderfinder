<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { jwtDecode } from 'jwt-decode'

// Pinia Stores
import { useDiscussionDetailStore } from '@/store/discussionDetail'
import { useKindergartenDetailStore } from '@/store/kindergartenDetail'
import { useResourceDetailStore } from '@/store/resourceDetail'
import { useBookmarkDataStore } from '@/store/bookmarkData'

const bookmarkDataStore = useBookmarkDataStore()

const router = useRouter()

const discussionStore = useDiscussionDetailStore()
const kindergartenStore = useKindergartenDetailStore()
const resourceStore = useResourceDetailStore()

const activeTab = ref('kindergartens')
const isLoading = ref(true)
const user = ref(null)

// Full populated data
const populatedKindergartens = computed(() => bookmarkDataStore.populatedKindergartens)
const populatedDiscussions = computed(() => bookmarkDataStore.populatedDiscussions)
const populatedResources = computed(() => bookmarkDataStore.populatedResources)

let userId = null
let token = null
onMounted(async () => {
  token = localStorage.getItem('token')
  
  if (!token) {
    alert('Please log in to view your bookmarks.')
    router.push('/login')
    return
  }

  try {
    const decoded = jwtDecode(token)
    userId = decoded._id

    if (!userId) throw new Error('Invalid token')

    // === Check Pinia first — if data exists, use it ===
    if (bookmarkDataStore.populatedDiscussions.length > 0 ||
        bookmarkDataStore.populatedKindergartens.length > 0 ||
        bookmarkDataStore.populatedResources.length > 0) {
      console.log('Using cached data from Pinia — no refetch needed')
      return // Skip fetch
    }

    // === Fetch only if no data in Pinia ===
    const userRes = await fetch(`/api/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!userRes.ok) throw new Error('Failed to fetch user')

    const userData = await userRes.json()
    console.log('Full userData from server:', userData)
    console.log('resourcesBookmark field:', userData.resourcesBookmark)
    console.log('Type of resourcesBookmark:', typeof userData.resourcesBookmark)
    user.value = userData

    // Populate and store in Pinia
    if (userData.discussionsBookmark?.length > 0) {
      const promises = userData.discussionsBookmark.map(id =>
        fetch(`/api/discussions/${id}`).then(r => r.ok ? r.json() : null)
      )
      const results = await Promise.all(promises)
      const filtered = results.filter(d => d !== null)
      populatedDiscussions.value = filtered
      bookmarkDataStore.setDiscussions(filtered)
    }

    if (userData.kindergartensBookmark?.length > 0) {
      const promises = userData.kindergartensBookmark.map(kg =>
        fetch(`/api/kindergartens/${kg.id}`).then(r => r.ok ? r.json() : null)
      )
      const results = await Promise.all(promises)
      const filtered = results.filter(kg => kg !== null)
      populatedKindergartens.value = filtered
      bookmarkDataStore.setKindergartens(filtered)
    }

    // === Populate Resources ===
    if (userData.resourcesBookmark && userData.resourcesBookmark.length > 0) {
    console.log('Starting resources fetch for:', userData.resourcesBookmark)

    const promises = userData.resourcesBookmark.map(async (b, index) => {
        try {
        console.log(`Fetching resource ${index}: ${b.sectionID}/${b.articleId}`)
        const res = await fetch(`/api/resources/detail/${b.sectionID}/${b.articleId}`)
        if (!res.ok) {
            console.warn(`Fetch failed for ${b.articleId}: ${res.status}`)
            return null
        }
        const data = await res.json()
        console.log(`Resource ${index} loaded:`, data)

        if (!data.article) {
            console.warn(`No article in response for ${b.articleId}`)
            return null
        }

        return {
            _id: data.article._id || b.articleId,
            title: data.article.title,
            description: data.article.description || '',
            embedLink: data.article.embedLink || '',
            image: data.article.image || '',
            section: data.section?.section || 'Unknown',
            sectionID: data.section?._id || b.sectionID
        }
        } catch (err) {
        console.error(`Error fetching resource ${index}:`, err)
        return null
        }
    })

    const results = await Promise.all(promises)
    console.log('All resources fetched:', results)
    const filtered = results.filter(r => r !== null)
    console.log('Filtered resources:', filtered)
    populatedResources.value = filtered
    bookmarkDataStore.setResources(filtered)
    } else {
    console.log('No resourcesBookmark in userData')
    populatedResources.value = []
    bookmarkDataStore.setResources([])
    }
  } catch (err) {
    console.error('Failed to load bookmarks:', err)
  } finally {
    isLoading.value = false
  }
})

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return 'Recently'
  const date = new Date(dateStr)
  return isNaN(date.getTime()) 
    ? 'Recently' 
    : date.toLocaleDateString('en-HK', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Navigation
const goToDiscussion = (discussion) => {
  discussionStore.setPassedData(discussion, true)
  router.push(`/discussion/detail/${discussion._id}`)
}

const goToKindergarten = (kg) => {
  kindergartenStore.setPassedData(kg, true)
  router.push(`/kindergarten/detail/${kg._id}`)
}

const goToResource = (resource) => {
  if (!resource.sectionID) {
    console.error('Missing sectionID', resource)
    return
  }

  console.log("Reasource", resource)

  resourceStore.setPassedData(resource, true)
  router.push(`/resources/detail/${resource.sectionID}/${resource._id}`)
}
</script>

<template>
  <div class="container py-5">
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status" style="width: 4rem; height: 4rem;">
        <span class="visually-hidden">{{ $t('loading') }}</span>
      </div>
      <p class="mt-4 fs-5 text-muted">{{ $t('loadingBookmarks') }}</p>
    </div>

    <!-- Main Content -->
    <div v-else-if="user" class="mb-5">
      <hr class="my-5 border-2 border-light">
      <h4 class="mb-4 text-center fw-bold text-primary">{{ $t('myBookmarks') }}</h4>

      <!-- Tabs -->
      <ul class="nav nav-pills nav-fill mb-5 rounded-pill overflow-hidden shadow-sm mx-auto" style="max-width: 900px;">
        <li class="nav-item">
          <button class="nav-link rounded-pill px-4 py-3 fw-medium" 
                  :class="{ active: activeTab === 'kindergartens' }" 
                  @click="activeTab = 'kindergartens'">
            {{ $t('bookmarkedKindergartens') }}
            <span class="badge bg-success ms-2">{{ user.kindergartensBookmark?.length || 0 }}</span>
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link rounded-pill px-4 py-3 fw-medium" 
                  :class="{ active: activeTab === 'discussions' }" 
                  @click="activeTab = 'discussions'">
            {{ $t('bookmarkedDiscussions') }}
            <span class="badge bg-info ms-2">{{ user.discussionsBookmark?.length || 0 }}</span>
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link rounded-pill px-4 py-3 fw-medium" 
                  :class="{ active: activeTab === 'resources' }" 
                  @click="activeTab = 'resources'">
            {{ $t('savedResources') }}
            <span class="badge bg-warning text-dark ms-2">{{ user.resourcesBookmark?.length || 0 }}</span>
          </button>
        </li>
      </ul>

      <!-- Tab Content -->
      <div class="tab-content">

        <!-- Kindergartens -->
        <div v-show="activeTab === 'kindergartens'" class="row g-4">
          <div v-if="!populatedKindergartens.length" class="col-12 text-center py-5">
            <p class="lead text-muted mb-4">{{ $t('noKindergartensBookmarked') }}</p>
            <router-link to="/kindergartens" class="btn btn-success btn-lg rounded-pill px-5 shadow-sm">
              {{ $t('exploreKindergartens') }}
            </router-link>
          </div>

          <div v-else v-for="kg in populatedKindergartens" :key="kg.id" class="col-md-6 col-lg-4">
            <div class="card h-100 border-0 shadow-sm hover-lift transition rounded-4">
              <div class="card-body p-4">
                <h6 class="fw-bold mb-2">{{ kg.ENGLISH_NAME }}</h6>
                <p class="small text-muted mb-3">{{ kg['中文名稱'] || '' }}</p>
                <small class="text-muted d-block mb-3">
                  {{ formatDate(kg.createdAt || kg.updatedAt) }}
                </small>
                <button @click="goToKindergarten(kg)" class="btn btn-sm btn-outline-success rounded-pill w-100">
                  {{ $t('viewDetails') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Discussions -->
        <div v-show="activeTab === 'discussions'" class="row g-4">
          <div v-if="!populatedDiscussions.length" class="col-12 text-center py-5">
            <p class="lead text-muted mb-4">{{ $t('noDiscussionsBookmarked') }}</p>
            <router-link to="/discussions" class="btn btn-info text-white btn-lg rounded-pill px-5 shadow-sm">
              {{ $t('browseDiscussions') }}
            </router-link>
          </div>

          <div v-else v-for="discussion in populatedDiscussions" :key="discussion._id" class="col-md-6 col-lg-4">
            <div class="card h-100 border-0 shadow-sm hover-lift transition rounded-4">
              <div class="card-body p-4">
                <div class="fs-1 mb-3 text-info text-center">💬</div>
                <h6 class="fw-bold mb-2 text-truncate">{{ discussion.title }}</h6>
                <p class="small text-muted mb-3 text-truncate-3-lines">{{ discussion.description }}</p>
                
                <div class="d-flex flex-wrap gap-1 mb-3">
                  <span v-for="tag in discussion.hashtags" :key="tag" class="badge bg-info text-white small">
                    {{ tag }}
                  </span>
                </div>

                <small class="text-muted d-block mb-4">
                  {{ formatDate(discussion.createdAt) }}
                </small>

                <button @click="goToDiscussion(discussion)" class="btn btn-sm btn-outline-info rounded-pill w-100">
                  {{ $t('viewDiscussion') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Resources — Full Data -->
        <div v-show="activeTab === 'resources'" class="row g-4">
          <div v-if="!populatedResources.length" class="col-12 text-center py-5">
            <p class="lead text-muted mb-4">{{ $t('noResourcesSaved') }}</p>
            <router-link to="/resources" class="btn btn-warning btn-lg rounded-pill px-5 shadow-sm">
              {{ $t('exploreResources') }}
            </router-link>
          </div>

          <div v-else v-for="resource in populatedResources" :key="resource._id" class="col-md-6 col-lg-4">
            <div class="card h-100 border-0 shadow-sm hover-lift transition rounded-4">
              <div class="card-body p-4 text-center">
                <i class="bi bi-file-earmark-text fs-1 text-primary mb-4"></i>
                <h6 class="fw-bold mb-3 text-truncate">{{ resource.title }}</h6>
                <p class="small text-muted mb-3 text-truncate-3-lines">{{ resource.description }}</p>
                <small class="text-muted d-block mb-3">{{ resource.section }}</small>
                <a :href="resource.embedLink" target="_blank" class="btn btn-sm btn-outline-primary rounded-pill w-100 mb-2">
                  {{ $t('openLink') }}
                </a>
                <button 
                @click="goToResource(resource, user.resourcesBookmark.find(b => b.articleId === resource._id))"
                class="btn btn-sm btn-primary rounded-pill w-100">
                {{ $t('view') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else class="text-center py-5">
      <p class="lead text-danger">{{ $t('unableToLoadBookmarks') }}</p>
      <button @click="router.push('/login')" class="btn btn-primary rounded-pill px-5">
        {{ $t('goToLogin') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.nav-pills .nav-link {
  background: #f8f9fa;
  color: #495057;
  font-weight: 500;
}
.nav-pills .nav-link.active {
  background: linear-gradient(135deg, #7aefce 0%, #98edd5 100%);
  color: #0f172a;
  font-weight: 600;
}

.hover-lift {
  transition: all 0.3s ease;
}
.hover-lift:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
}

.text-truncate-3-lines {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>