<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const article = ref(null)

onMounted(async () => {
  try {
    const sectionID = route.params.sectionID
    const articleId = route.params.articleId

    console.log('Fetching:', `/api/resources/detail/${sectionID}/${articleId}`)

    const res = await fetch(`/api/resources/detail/${sectionID}/${articleId}`)
    if (!res.ok) {
      throw new Error(`Failed to fetch article: ${res.status}`)
    }
    const data = await res.json()
    article.value = data.article
  } catch (err) {
    console.error('Error loading article:', err)
  }
})
</script>

<template>
  <div class="content" v-if="article">
    <div class="iframe-container">
      <!-- Vue binding instead of EJS -->
      <iframe
        :src="article.embedLink"
        frameborder="0"
        allowfullscreen
      ></iframe>
    </div>
  </div>

  <div v-else class="content">
    <p>Loading article...</p>
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
}

iframe {
  width: 100%;
  height: 200%;
  border: none;
}
</style>
