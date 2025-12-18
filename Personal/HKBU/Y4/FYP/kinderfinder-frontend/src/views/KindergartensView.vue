<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { jwtDecode } from "jwt-decode"
import { useKindergartenDetailStore } from '@/store/kindergartenDetail'

const router = useRouter()

const token = localStorage.getItem('token')
const decoded = token ? jwtDecode(token) : null
const userId = decoded?._id;

const kindergartens = ref([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const perPage = ref(6)
const search = ref('')
const filtersVisible = ref(false)

const region = ref('')
const district = ref('')
const section = ref('')
const gender = ref('')
const religion = ref('')
const tuition = ref('')
const atmosphere = ref([])
const teachingMethods = ref([])
const N_Class = ref("")  

const bookmarks = ref([]);  // Will store kindergarten _id as strings

// ✅ Load from JWT (instant)
if (decoded && Array.isArray(decoded.kindergartensBookmark)) {
  bookmarks.value = decoded.kindergartensBookmark
    .map(k => k.id?.toString())
    .filter(Boolean)

  console.log('Kindergarten bookmarks instantly loaded from JWT:', bookmarks.value)
}

// ✅ Load bookmarks AND then fetch kindergartens
onMounted(async () => {
  if (!userId) {
    await fetchData()
    loading.value = false
    return
  }

  try {
    const res = await fetch(`/api/users/${userId}`)
    if (!res.ok) throw new Error('Failed to fetch user')

    const data = await res.json()

    // ✅ Extract inner id from object
    const serverBookmarks = (data.kindergartensBookmark || [])
      .map(k => k.id?.toString())
      .filter(Boolean)

    bookmarks.value = serverBookmarks
    console.log("Kindergarten bookmarks synced from server:", bookmarks.value)

  } catch (err) {
    console.error("Failed to load kindergarten bookmarks:", err)
  }

  await fetchData()
  loading.value = false
})

// ✅ Optimistic toggle bookmark
const toggleBookmark = async (kg) => {
  const idStr = kg._id.toString();

  // Save previous state for rollback
  const previous = [...bookmarks.value];

  // ✅ 1. Instant UI update
  if (bookmarks.value.includes(idStr)) {
    bookmarks.value = bookmarks.value.filter(id => id !== idStr);
  } else {
    bookmarks.value.push(idStr);
  }

  try {
    // ✅ 2. Send full kindergarten data to backend
    const res = await fetch(`/api/users/${userId}/bookmark`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kindergartenId: kg._id,
        ENGLISH_NAME: kg.ENGLISH_NAME || null,
        中文名稱: kg.中文名稱 || null,
        WEBSITE: kg.WEBSITE || null,
        openday: kg.openday || null,
        Application_Deadline: kg.Application_Deadline || null,
        Interview_Date: kg.Interview_Date || null,
        Results_Announcement: kg.Results_Announcement || null
      })
    });

    if (!res.ok) throw new Error("Backend update failed");

    const data = await res.json();

    // ✅ 3. Convert backend objects → string IDs
    bookmarks.value = (data.kindergartensBookmark || [])
      .map(k => k.id?.toString())
      .filter(Boolean);

  } catch (err) {
    console.error("Bookmark toggle failed:", err);

    // ✅ 4. Rollback UI if backend fails
    bookmarks.value = previous;
  }
};

function toggleFilters() {
  filtersVisible.value = !filtersVisible.value
}

// Unified fetch function
async function fetchData() {
  loading.value = true

  let tuitionParam = ''
  if (tuition.value === 'Free') tuitionParam = 'Free'
  else if (tuition.value === '<=10000') tuitionParam = '<=10000'
  else if (tuition.value === '>10000') tuitionParam = '>10000'

  const params = new URLSearchParams({
    Region_English: region.value,
    DISTRICT: district.value,
    STUDENTS_GENDER: gender.value,
    RELIGION: religion.value,
    Tuition_fee: tuitionParam,
    SESSION_WHOLE_DAY: section.value === 'Whole Day' ? 'true' : '',
    SESSION_AM: section.value === 'AM' ? 'true' : '',
    SESSION_PM: section.value === 'PM' ? 'true' : '',
    ATMOSPHERER_ENGLISH: atmosphere.value.join(','),
    TEACHING_METHOD_ENGLISH: teachingMethods.value.join(','),
    N_Class: N_Class.value,
    search: search.value.trim(),
    page: page.value,
    perPage: perPage.value
  })

  try {
    const res = await fetch(`/api/kindergartens/filter?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      kindergartens.value = data.kindergartens || []
      totalPages.value = data.totalPages || 1
    } else {
      kindergartens.value = []
    }
  } catch (err) {
    console.error(err)
    kindergartens.value = []
  } finally {
    loading.value = false
  }
}

// Debounced search
let timeout
watch(search, () => {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    page.value = 1
    fetchData()
  }, 600)
})

watch(page, () => {
  fetchData()
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

watch([region, district, section, gender, religion, tuition, N_Class, atmosphere, teachingMethods], () => {
  page.value = 1
  fetchData()
}, { deep: true })

function clearFilters() {
  region.value = district.value = section.value = gender.value = religion.value = N_Class.value = tuition.value = ''
  atmosphere.value = []
  teachingMethods.value = []
  search.value = ''
  page.value = 1
  fetchData()
}

function goToDetail(kg) {
  const store = useKindergartenDetailStore()

  const isBookmarked = bookmarks.value.includes(kg._id.toString())

  store.setPassedData(kg, isBookmarked)

  router.push({
    name: 'Detail kindergarten',
    params: { kindergartenId: kg._id }
  })
}
</script>

<template>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />

  <div class="container py-4">
    <h2 class="my-4 text fw-bold">Kindergarten</h2>

    <!-- Search + Filter Toggle -->
    <div class="d-flex flex-wrap gap-3 align-items-center mb-4">
      <button class="btn btn-outline-secondary btn-lg" @click="toggleFilters">
        <i class="fas fa-filter me-2"></i>
        {{ filtersVisible ? 'Hide' : 'Show' }} Filters
      </button>

      <div class="input-group flex-grow-1" style="max-width: 400px;">
        <input
          v-model="search"
          type="search"
          class="form-control form-control-lg"
          placeholder="Search by school name..."
        />
        <span class="input-group-text">
          <i class="fas fa-search"></i>
        </span>
      </div>
    </div>

    <!-- Full Filter Panel (exactly as you had) -->
    <div v-if="filtersVisible" class="card shadow-sm mb-4 border-light">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-2">
            <select v-model="region" class="form-select">
              <option value="">Region</option>
              <option value="Kowloon">Kowloon</option>
              <option value="New Territories">New Territories</option>
              <option value="Hong Kong Island">Hong Kong Island</option>
            </select>
          </div>
          <div class="col-md-2">
            <select v-model="district" class="form-select">
              <option value="">District</option>
              <option value="KOWLOON CITY">Kowloon City</option>
              <option value="KWUN TONG">Kwun Tong</option>
              <option value="SHAM SHUI PO">Sham Shui Po</option>
              <option value="WONG TAI SIN">Wong Tai Sin</option>
              <option value="YAU TSIM MONG">Yau Tsim Mong</option>
              <option value="ISLANDS">Islands</option>
              <option value="KWAI TSING">Kwai Tsing</option>
              <option value="NORTH">North</option>
              <option value="SAI KUNG">Sai Kung</option>
              <option value="SHA TIN">Sha Tin</option>
              <option value="TAI PO">Tai Po</option>
              <option value="TSUEN WAN">Tsuen Wan</option>
              <option value="TUEN MUN">Tuen Mun</option>
              <option value="YUEN LONG">Yuen Long</option>
              <option value="CENTRAL AND WESTERN">Central and Western</option>
              <option value="EASTERN">Eastern</option>
              <option value="SOUTHERN">Southern</option>
              <option value="WAN CHAI">Wan Chai</option>
            </select>
          </div>
          <div class="col-md-2">
            <select v-model="section" class="form-select">
              <option value="">Section</option>
              <option value="Whole Day">Whole Day</option>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
          <div class="col-md-2">
            <select v-model="gender" class="form-select">
              <option value="">Student Gender</option>
              <option value="CO-ED">Co-Ed</option>
              <option value="BOYS">Boys</option>
              <option value="GIRLS">Girls</option>
            </select>
          </div>
          <div class="col-md-2">
            <select v-model="N_Class" class="form-select">
                <option value="">Pre Class</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
            </select>
          </div>
        </div>

        <div class="row mt-3 g-3">
          <div class="col-md-3">
            <select v-model="religion" class="form-select">
              <option value="">Religion</option>
              <option value="BUDDHISM">Buddhism</option>
              <option value="CATHOLICISM">Catholicism</option>
              <option value="PROTESTANTISM / CHRISTIANITY">Protestantism / Christianity</option>
              <option value="TAOISM">Taoism</option>
              <option value="NOT APPLICABLE">Not Applicable</option>
            </select>
          </div>
          <div class="col-md-3">
            <select v-model="tuition" class="form-select">
              <option value="">Tuition Fee</option>
              <option value="Free">Free</option>
              <option value="<=10000">≤ $10,000</option>
              <option value=">10000">> $10,000</option>
            </select>
          </div>

          <!-- Atmosphere Checkboxes -->
          <div class="col-md-3">
            <label class="form-label fw-bold text-primary">Atmosphere</label>
            <div class="d-flex flex-wrap gap-2">
              <div v-for="opt in ['Lively','Joyful','Serious','Relaxed','Interactive','Tense','Dull','Creative','Supportive','Exploratory']" :key="opt">
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="checkbox" :value="opt" :id="'atm-'+opt" v-model="atmosphere">
                  <label class="form-check-label small" :for="'atm-'+opt">{{ opt }}</label>
                </div>
              </div>
            </div>
          </div>

          <!-- Teaching Methods Checkboxes -->
          <div class="col-md-3">
            <label class="form-label fw-bold text-success">Teaching Method</label>
            <div class="d-flex flex-wrap gap-2">
              <div v-for="method in ['Traditional Teaching','Constructivism','Cooperative Learning','Problem-Based Learning','Inquiry-Based Learning','Flipped Classroom','Multiple Intelligences Theory','Lecture Mode','Discussion Mode','Practical Mode','Case Study','Role Play','Gamified Learning','Individualized Learning']" :key="method">
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="checkbox" :value="method" :id="'tm-'+method" v-model="teachingMethods">
                  <label class="form-check-label small" :for="'tm-'+method">{{ method.split(' ')[0] }}</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 text-end">
          <button class="btn btn-danger me-2" @click="clearFilters">Clear All</button>
        </div>
      </div>
    </div>

    <!-- Results Header -->
    <h2 class="mt-4 mb-3 text-success">Order By Ranking</h2>

    <!-- Long Vertical Cards (your exact layout, but prettier) -->
    <div class="kindergarten-container">
      <!-- Loading Skeleton -->
      <template v-if="loading">
        <div v-for="n in 6" :key="n" class="kindergarten-card mb-4">
          <div class="card shadow-sm">
            <div class="row g-0">
              <div class="col-md-4">
                <div class="bg-light border rounded-start" style="height: 220px;"></div>
              </div>
              <div class="col-md-8">
                <div class="card-body">
                  <div class="placeholder-glow">
                    <div class="placeholder col-7 mb-3" style="height: 32px;"></div>
                    <div class="placeholder col-5" style="height: 28px;"></div>
                    <div class="placeholder col-12 mt-4" style="height: 60px;"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Real Cards -->
      <div
        v-for="kg in kindergartens"
        :key="kg._id"
        class="kindergarten-card mb-4 position-relative"
      >
      <div class="bookmark-btn" @click.stop="toggleBookmark(kg)">
        <i 
            :class="bookmarks.includes(kg._id.toString()) 
                    ? 'bi bi-bookmark-fill text-warning' 
                    : 'bi bi-bookmark'"
            class="fs-3"
        ></i>
        </div>

        <div class="card shadow-lg border-0 rounded-4 overflow-hidden hover-lift" @click="goToDetail(kg)" style="cursor: pointer;">
          <div class="row g-0">
            <div class="col-md-4">
              <img
                :src="kg.photo || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWDMW6ntfY590jhxvrUeuObzhRb8t7LaRkvQ&s'"
                class="img-fluid rounded-start"
                :alt="kg.ENGLISH_NAME"
                style="width: 100%; height: 240px; object-fit: cover;"
                loading="lazy"
              />
            </div>
            <div class="col-md-8">
              <div class="card-body p-4">
                <h4 class="card-title text-primary fw-bold mb-1">{{ kg.ENGLISH_NAME }}</h4>
                <h5 class="text-muted mb-3">{{ kg.中文名稱 }}</h5>

                <div class="d-flex flex-wrap gap-2 mb-3">
                  <span class="badge bg-warning text-dark fs-6 px-3">
                    {{ kg.Tuition_fee === 0 ? 'FREE' : `${kg.Tuition_fee}` }}
                  </span>
                  <span class="badge bg-primary fs-6">{{ kg.RELIGION || 'None' }}</span>
                  <span class="badge bg-success fs-6">{{ kg.STUDENTS_GENDER }}</span>
                  <span v-if="kg.N_Class" class="badge fs-6" style="background-color: #6610f2; color: white;" >Pre-Class</span>
                  <span class="badge bg-danger fs-6">{{ kg.DISTRICT?.replace(/_/g, ' ') }}</span>
                </div>

                <div class="d-flex flex-wrap gap-2">
                  <span v-if="kg.SESSION_WHOLE_DAY" class="badge" style="background:#ff9999; color:white;">Whole Day</span>
                  <span v-if="kg.SESSION_AM" class="badge bg-info text-dark">AM Session</span>
                  <span v-if="kg.SESSION_PM" class="badge bg-secondary">PM Session</span>
                </div>

                <div class="mt-3 text-end">
                  <small class="text-primary fw-bold">Click to view details →</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <nav v-if="totalPages > 1" aria-label="Page navigation" class="mt-5">
      <ul class="pagination justify-content-center pagination-lg">
        <li class="page-item" :class="{ disabled: page === 1 }">
          <button class="page-link" @click="page > 1 && page--">&laquo;</button>
        </li>
        <li v-for="i in totalPages" :key="i" class="page-item" :class="{ active: i === page }">
          <button class="page-link" @click="page = i">{{ i }}</button>
        </li>
        <li class="page-item" :class="{ disabled: page === totalPages }">
          <button class="page-link" @click="page < totalPages && page++">&raquo;</button>
        </li>
      </ul>
    </nav>

    <!-- No Results -->
    <div v-if="!loading && kindergartens.length === 0" class="text-center py-5">
      <p class="display-6 text-muted">No kindergartens found matching your filters.</p>
      <button @click="clearFilters" class="btn btn-outline-primary btn-lg">Clear All Filters</button>
    </div>
  </div>
</template>

<style scoped>
.hover-lift {
  transition: all 0.3s ease;
}
.hover-lift:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
}
.badge {
  font-size: 0.9rem;
}
.card-body h4, .card-body h5 {
  margin: 0;
}
@media (max-width: 768px) {
  .row.g-0 > div {
    padding: 0 !important;
  }
}
.bookmark-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  cursor: pointer;
  background: rgba(255,255,255,0.8);
  padding: 6px 10px;
  border-radius: 50%;
  transition: 0.2s ease;
}

.bookmark-btn:hover {
  transform: scale(1.1);
}

</style>