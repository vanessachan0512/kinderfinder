<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const title = ref('')
const description = ref('')
const hashtags = ref([])
const notify = ref(false)
const imageFile = ref(null)
const isDraft = ref(false)
const message = ref('')

// handle hashtag input
const newTag = ref('')
function addTag() {
  if (newTag.value.trim() && !hashtags.value.includes(newTag.value.trim())) {
    hashtags.value.push(newTag.value.trim())
    newTag.value = ''
  }
}
function removeTag(tag) {
  hashtags.value = hashtags.value.filter(t => t !== tag)
}

async function saveDiscussion(draft = false) {
  try {
    const formData = new FormData()
    formData.append('title', title.value)
    formData.append('description', description.value)
    formData.append('notify', notify.value ? 'on' : '')
    formData.append('draft', draft ? 'true' : 'false')
    if (imageFile.value) formData.append('image', imageFile.value)
    formData.append('hashtags', hashtags.value.join(','))

    const res = await fetch('/api/discussions/add', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    message.value = data.message

    if (!draft) {
      router.push('/discussions') // navigate back to board
    }
  } catch (err) {
    console.error('Error creating discussion:', err)
    message.value = 'Error creating discussion'
  }
}
</script>

<template>
  <div class="container mt-3" style="margin-left: 40px; margin-right: 40px;">
    <h2>Create Discussion</h2>

    <form @submit.prevent="saveDiscussion(false)" enctype="multipart/form-data">
      <div class="row">
        <div class="col-md-8">
          <div class="mb-3">
            <label for="title" class="form-label">Title</label>
            <input v-model="title" type="text" id="title" class="form-control" required />
          </div>

          <div class="mb-3">
            <label for="description" class="form-label">Description</label>
            <textarea v-model="description" id="description" class="form-control" rows="4" required></textarea>
          </div>

          <div class="mb-3">
            <label for="schoolTagInput" class="form-label">Hashtags</label>
            <div class="input-group">
              <input
                v-model="newTag"
                list="schoolOptions"
                id="schoolTagInput"
                class="form-control"
                placeholder="Type or select a hashtag"
                @keyup.enter.prevent="addTag"
              />
              <button class="btn btn-outline-secondary" type="button" @click="addTag">Add</button>
            </div>
            <datalist id="schoolOptions">
              <option value="#ABC School" />
              <option value="#B School" />
              <option value="#C School" />
              <option value="#D School" />
            </datalist>

            <!-- Selected tags -->
            <div class="mt-2 d-flex flex-wrap gap-2">
              <span
                v-for="tag in hashtags"
                :key="tag"
                class="badge bg-info text-dark"
                style="cursor:pointer"
                @click="removeTag(tag)"
              >
                {{ tag }} ✕
              </span>
            </div>
          </div>

          <div class="form-check mb-3">
            <input v-model="notify" class="form-check-input" type="checkbox" id="notify" />
            <label class="form-check-label" for="notify">Notify you by email</label>
          </div>
        </div>

        <div class="col-md-4 mt">
          <label for="image" class="form-label">Image</label>
          <input type="file" id="image" class="form-control" @change="e => imageFile.value = e.target.files[0]" />
        </div>
      </div>

      <div class="d-flex justify-content-end mt-4">
        <button type="button" class="btn btn-warning me-2" @click="saveDiscussion(true)">Save Draft</button>
        <button type="submit" class="btn btn-primary">Create</button>
      </div>
    </form>

    <p v-if="message" class="mt-3">{{ message }}</p>
  </div>
</template>
