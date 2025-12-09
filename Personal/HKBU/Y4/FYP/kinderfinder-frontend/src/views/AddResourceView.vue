<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const embedLink = ref('')
const description = ref('')
const section = ref('')
const title = ref('')
const message = ref('')

// detect mode: if route has articleId, we are editing
const isEditMode = ref(false)
const sectionID = ref('')
const articleId = ref('')

onMounted(async () => {
  if (route.params.sectionID && route.params.articleId) {
    isEditMode.value = true
    sectionID.value = route.params.sectionID
    articleId.value = route.params.articleId

    // fetch existing article data
    const res = await fetch(`/api/resources/edit/${sectionID.value}/${articleId.value}`)
    if (res.ok) {
      const data = await res.json()
      const article = data.article
      const section = data.section
      embedLink.value = article.embedLink
      description.value = article.description
      section.value = article.section || '' // if stored
      title.value = article.title

      console.log(section)

      sectionName.value = section.name 
    }
  }
})

async function saveArticle() {
  try {
    let url = '/api/resources/add'
    let method = 'POST'

    if (isEditMode.value) {
      url = `/api/resources/update/${sectionID.value}/${articleId.value}`
      method = 'PUT'
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embedLink: embedLink.value,
        section: section.value,
        title: title.value,
        description: description.value
      })
    })

    if (!res.ok) throw new Error(`Failed: ${res.status}`)
    const data = await res.json()
    message.value = data.message
  } catch (err) {
    console.error('Error saving article:', err)
    message.value = 'Error saving article'
  }
}

async function deleteArticle() {
  try {
    const res = await fetch(`/api/resources/delete/${sectionID.value}/${articleId.value}`, {
      method: 'DELETE'
    })

    if (!res.ok) throw new Error(`Failed: ${res.status}`)
    const data = await res.json()
    message.value = data.message

    // Optionally clear form after delete
    embedLink.value = ''
    description.value = ''
    section.value = ''
    title.value = ''
  } catch (err) {
    console.error('Error deleting article:', err)
    message.value = 'Error deleting article'
  }
}

</script>

<template>
  <div class="container">
    <div class="form-section">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0" v-if="!isEditMode">Add Article</h2>
        <h2 class="mb-0" v-else>Edit Article</h2>
      </div>

      <form @submit.prevent="saveArticle">
        <p class="note" v-if="!isEditMode">
          Please use Google Document for your article and click
          <strong>file → share → Share with people and groups</strong><br />
          → Get shareable link → Drop down to "Viewer", then copy the link and paste it in the input box.
        </p>
        <div class="row">
          <div class="col-md-7">
            <div class="mb-3">
              <label class="form-label">Embed Link</label>
              <input v-model="embedLink" type="text" class="form-control"
                     placeholder="Paste Google Docs shareable link here..." required />
            </div>
            <div class="mb-3">
              <label class="form-label">Description</label>
              <input v-model="description" type="text" class="form-control" required />
            </div>
            <div class="mb-3" v-if="!isEditMode">
              <label class="form-label">Section</label>
              <input v-model="sectionName" type="text" class="form-control"
                     placeholder="e.g. Education Tips, News, Events" required />
            </div>
          </div>
          <div class="col-md-5">
            <div class="mb-3">
              <label class="form-label">Title</label>
              <input v-model="title" type="text" class="form-control" required />
            </div>
          </div>
        </div>
        <div class="d-flex justify-content-between align-items-center mb-4">
          <button type="submit" class="btn btn-primary">
            {{ isEditMode ? 'Update' : 'Save' }}
          </button>

          <!-- Delete button only in edit mode -->
        <button
            v-if="isEditMode"
            type="button"
            class="btn btn-danger"
            @click="deleteArticle"
        >
            Delete
        </button>
        </div>
      </form>

      <p v-if="message" class="mt-3">{{ message }}</p>
    </div>
  </div>
</template>
