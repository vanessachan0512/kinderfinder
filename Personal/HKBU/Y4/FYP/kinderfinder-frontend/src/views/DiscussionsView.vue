<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const discussions = ref([])
const page = ref(1)
const totalPages = ref(1)
const search = ref('')
const sortDesc = ref(true)


async function loadDiscussions() {
  const res = await fetch(`/api/discussions?page=${page.value}&search=${search.value}`)
  if (res.ok) {
    const data = await res.json()
    discussions.value = data.discussions
    totalPages.value = data.totalPages
  }
}

function clearDiscussionSearch() {
  search.value = ''
  page.value = 1
  loadDiscussions()
}

function sortByDate() {
  sortDesc.value = !sortDesc.value
  discussions.value.sort((a, b) => {
    const dateA = new Date(a.updatedAt)
    const dateB = new Date(b.updatedAt)
    return sortDesc.value ? dateB - dateA : dateA - dateB
  })
}

function goToAdd() {
  router.push('/discussion/add')
}

function goToDetail(discussionId) {
  router.push(`/discussion/detail/${discussionId}`)
}

onMounted(loadDiscussions)
</script>

<template>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"/>

  <div class="container mt-4">
    <h1 class="mb-3">Discussion Board</h1>

    <!-- Search + Add + Clear -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="input-group" style="max-width: 300px;">
        <input
          v-model="search"
          type="text"
          class="form-control"
          placeholder="Search discussions..."
        />
        <button class="btn btn-outline-secondary" @click="loadDiscussions">
          <i class="fas fa-search"></i>
        </button>
      </div>

      <div>
        <button class="btn btn-primary me-2" @click="goToAdd">Add</button>
        <button class="btn btn-secondary" @click="clearDiscussionSearch">Clear</button>
      </div>
    </div>

    <!-- Sort -->
    <div class="d-flex justify-content-end mb-2">
      <button class="btn btn-sm btn-outline-dark" @click="sortByDate">
        Order By Date <i class="fas fa-sort"></i>
      </button>
    </div>

    <!-- Discussion Cards -->
    <div id="discussionContainer">
      <div
        v-for="d in discussions"
        :key="d._id"
        class="card mb-3"
        @click="goToDetail(d._id)"
        style="cursor: pointer;"
      >
        <div class="card-body">
          <div class="d-flex align-items-center">
            <img
              :src="d.image ? d.image : '/images/logo.png'"
              class="me-3"
              style="width: 60px; height: 60px; object-fit: cover;"
            />
            <div>
              <h5 class="card-title mb-1">{{ d.title }}</h5>
              <div v-if="d.hashtags && d.hashtags.length">
                <span
                  v-for="tag in d.hashtags"
                  :key="tag"
                  class="badge bg-info text-dark me-1"
                >
                  {{ tag }}
                </span>
              </div>
              <br />
              <small class="text-muted">
                Last updated
                {{
                  new Date(d.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                }}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <nav>
      <ul class="pagination justify-content-center">
        <li v-if="page > 1" class="page-item">
          <button class="page-link" @click="page--; loadDiscussions()">&laquo;</button>
        </li>
        <li
          v-for="i in totalPages"
          :key="i"
          class="page-item"
          :class="{ active: i === page }"
        >
          <button class="page-link" @click="page = i; loadDiscussions()">{{ i }}</button>
        </li>
        <li v-if="page < totalPages" class="page-item">
          <button class="page-link" @click="page++; loadDiscussions()">&raquo;</button>
        </li>
      </ul>
    </nav>
  </div>
</template>
