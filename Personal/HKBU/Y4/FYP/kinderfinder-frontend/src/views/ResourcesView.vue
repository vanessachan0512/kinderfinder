<script setup>
import { ref, onMounted } from 'vue'

const sections = ref([])
const page = ref(1)
const perPage = ref(6)
const totalPages = ref(0)

onMounted(async () => {
  const res = await fetch(`/api/resources?page=${page.value}&perPage=${perPage.value}`)
  const data = await res.json()
  sections.value = data.sections
  totalPages.value = data.totalPages
})

</script>

<template>
  <div class="container mt-4">
    <h2>Resources</h2>
    <div class="d-flex justify-content-end mb-3">
      <div class="me-auto">
        <h6>Click on your interested section!</h6>
      </div>
      <RouterLink class="btn btn-primary" to="/resource/add">Add Resource</RouterLink>
    </div>

    <!-- Tabs for Sections -->
    <ul class="nav nav-tabs" id="myTab" role="tablist">
      <li
        v-for="section in sections"
        :key="section.section"
        class="nav-item"
        role="presentation"
      >
        <a
          class="nav-link"
          :class="{ active: activeSection === section.section }"
          :id="`${section.section}-tab`"
          data-bs-toggle="tab"
          :href="`#${section.section}`"
          role="tab"
          :aria-controls="section.section"
          :aria-selected="activeSection === section.section"
          @click.prevent="activeSection = section.section"
        >
          {{ section.section }}
        </a>
      </li>
    </ul>

    <div class="tab-content" id="myTabContent">
      <div
        v-for="section in sections"
        :key="section.section"
        class="tab-pane fade"
        :class="{ 'show active': activeSection === section.section }"
        :id="section.section"
        role="tabpanel"
        :aria-labelledby="`${section.section}-tab`"
      >
        <div class="row row-cols-1 row-cols-md-3 g-4 mt-3">
          <div
            v-for="article in section.articles"
            :key="article.objectId"
            class="col"
            >
            <!-- Wrap the whole card -->
            <RouterLink
                :to="`/resources/detail/${section._id}/${article.objectId}`"
                class="card h-100"
                style="text-decoration: none; color: inherit;"
            >
                <img
                :src="article.image"
                class="card-img-top"
                alt="Article image"
                />
                <div class="card-body">
                <h5 class="card-title">{{ article.title }}</h5>
                <p class="card-text">{{ article.description }}</p>
                </div>
                <div class="card-footer">
                <!-- Stop propagation so Edit button works independently -->
                <RouterLink
                    :to="`/resource/edit/${section._id}/${article.objectId}`"
                    class="btn btn-outline-primary"
                    @click.stop
                >
                    Edit
                </RouterLink>
                </div>
            </RouterLink>
            </div>
          </div>
        </div>
      </div>
   

    <!-- Pagination Controls -->
    <nav aria-label="Page navigation" class="mt-4">
      <ul class="pagination">
        <li class="page-item" :class="{ disabled: page <= 1 }">
          <RouterLink
            v-if="page > 1"
            class="page-link"
            :to="`/resources?page=${page - 1}&perPage=${perPage}`"
          >
            Previous
          </RouterLink>
          <span v-else class="page-link">Previous</span>
        </li>

        <li
          v-for="i in totalPages"
          :key="i"
          class="page-item"
          :class="{ active: i === page }"
        >
          <span v-if="i === page" class="page-link">{{ i }}</span>
          <RouterLink
            v-else
            class="page-link"
            :to="`/resources?page=${i}&perPage=${perPage}`"
          >
            {{ i }}
          </RouterLink>
        </li>

        <li
          class="page-item"
          :class="{ disabled: page >= totalPages }"
        >
          <RouterLink
            v-if="page < totalPages"
            class="page-link"
            :to="`/resources?page=${page + 1}&perPage=${perPage}`"
          >
            Next
          </RouterLink>
          <span v-else class="page-link">Next</span>
        </li>
      </ul>
    </nav>
  </div>
</template>