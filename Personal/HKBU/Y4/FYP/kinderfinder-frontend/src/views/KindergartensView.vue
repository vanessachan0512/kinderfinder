<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { jwtDecode } from "jwt-decode"
import { useKindergartenDetailStore } from '@/store/kindergartenDetail'
import { useCompareStore } from '@/store/useCompareStore'
import { useI18n } from 'vue-i18n'; // ← ADD THIS

const { t } = useI18n(); // ← ADD THIS LINE


const translateDbValue = (value) => {
  if (!value) return '-'
  const key = typeof value === 'string' ? value.toUpperCase().trim() : value
  return t(key, key) // fallback to original if no translation
}

const normalizeDistrict = (dbValue) => {
  if (!dbValue) return ''
  return dbValue
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')  // Replace spaces with underscores
}


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
const atmosphereInput = ref('')
const activitiesInput = ref('')
const teachingInput = ref('')
const facilitiesInput = ref('')  

const compareStore = useCompareStore()
const compareCount = computed(() => compareStore.count)
const compareItems = computed(() => compareStore.compareItems)

const bookmarks = ref([]);  // Will store kindergarten _id as strings

// ✅ Load from JWT (instant)
if (decoded && Array.isArray(decoded.kindergartensBookmark)) {
  bookmarks.value = decoded.kindergartensBookmark
    .map(k => k.id?.toString())
    .filter(Boolean)

  console.log('Kindergarten bookmarks instantly loaded from JWT:', bookmarks.value)
}

const handleAddToCompare = (kg) => {
  console.log('Button clicked for:', kg.ENGLISH_NAME, kg._id)
  console.log('Current compareItems before:', compareStore.compareItems)

  if (compareStore.isInCompare(kg._id)) {
    // Already in compare → remove it
    compareStore.removeFromCompare(kg._id)
    console.log('Removed! New list:', compareStore.compareItems.map(i => i.ENGLISH_NAME))
  } else {
    // Not in compare → add it
    compareStore.addToCompare(kg)
    console.log('Added! New list:', compareStore.compareItems.map(i => i.ENGLISH_NAME))
  }
}


onMounted(async () => {
    console.log('onMounted running!');
    await fetchData();
})

// ✅ Optimistic toggle bookmark
const toggleBookmark = async (kg) => {
  const idStr = kg._id.toString();

  // Save previous state for rollback
  const previous = [...bookmarks.value];

  // 1. Instant optimistic UI update
  if (bookmarks.value.includes(idStr)) {
    bookmarks.value = bookmarks.value.filter(id => id !== idStr);
  } else {
    bookmarks.value.push(idStr);
  }

  try {
    // 2. Send updated data to backend
    const res = await fetch(`/api/users/${userId}/bookmark`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kindergartenId: kg._id,
        ENGLISH_NAME: kg.ENGLISH_NAME || null,
        中文名稱: kg.中文名稱 || null,
        WEBSITE: kg.WEBSITE || null,

        // Send the full events object (recommended)
        events: {
          openday: kg.events?.openday || null,
          Application_Deadline: kg.events?.Application_Deadline || null,
          Interview_Date: kg.events?.Interview_Date || null,
          Results_Announcement: kg.events?.Results_Announcement || null
        }

      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Backend update failed: ${errorText}`);
    }

    const data = await res.json();

    // 3. Update local bookmarks from backend response
    // Assuming backend returns kindergartensBookmark as array of { id, ...events }
    bookmarks.value = (data.kindergartensBookmark || [])
      .map(bookmark => bookmark.id?.toString())
      .filter(Boolean);

  } catch (err) {
    console.error("Bookmark toggle failed:", err);
    // 4. Rollback on failure
    bookmarks.value = previous;
    alert("Failed to update bookmark. Changes reverted.");
  }
};

function toggleFilters() {
  filtersVisible.value = !filtersVisible.value
}

// Unified fetch function
async function fetchData() {
    console.log("Fetch called")
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

// Delay search fucntion until user stops typing
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
  // scroll to top on page change
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

const form = ref({
  CATEGORY: "Kindergartens",
  中文類別: "幼稚園",
  ENGLISH_NAME: '',
  中文名稱: '',
  Region_English: 'New Territories',
  Region_Chinese: '新界',
  ENGLISH_ADDRESS: '',
  中文地址: '',
  LATITUDE: null,
  LONGITUDE: null,
  STUDENTS_GENDER: 'CO-ED',
  SESSION_WHOLE_DAY: false,
  SESSION_AM: false,
  SESSION_PM: false,
  DISTRICT: '',
  FINANCE_TYPE: 'PRIVATE',
  SCHOOL_LEVEL: 'KINDERGARTEN',
  TELEPHONE: '',
  FAX_NUMBER: '',
  EMAIL: '',
  WEBSITE: '',
  RELIGION: '',
  DESCRIPTION: '',
  DESCRIPTION_ENGLISH: '',
  Tuition_fee: '',
  N_Class: false,
  openday: '',
  Application_Deadline: '',
  Interview_Date: '',
  Results_Announcement: '',
  ATMOSPHERER_ENGLISH: [],
  ACTIVITIES_ENGLISH: [],
  TEACHING_METHOD_ENGLISH: [],
  FACILITIES_ENGLISH: [],
  Rank: null,
  Envrionment: null,
  Teacher: null,
  Resrouces: null,
  Convenient: null,
  Total: null
})

const atmosphereOptions = [
  { value: 'Lively', label: 'atmosphereOptions.Lively' },
  { value: 'Joyful', label: 'atmosphereOptions.Joyful' },
  { value: 'Serious', label: 'atmosphereOptions.Serious' },
  { value: 'Relaxed', label: 'atmosphereOptions.Relaxed' },
  { value: 'Interactive', label: 'atmosphereOptions.Interactive' },
  { value: 'Tense', label: 'atmosphereOptions.Tense' },
  { value: 'Dull', label: 'atmosphereOptions.Dull' },
  { value: 'Creative', label: 'atmosphereOptions.Creative' },
  { value: 'Supportive', label: 'atmosphereOptions.Supportive' },
  { value: 'Exploratory', label: 'atmosphereOptions.Exploratory' }
]

const teachingMethodOptions = [
  { value: 'Traditional Teaching', label: 'teachingMethodOptions.Traditional Teaching' },
  { value: 'Constructivism', label: 'teachingMethodOptions.Constructivism' },
  { value: 'Cooperative Learning', label: 'teachingMethodOptions.Cooperative Learning' },
  { value: 'Problem-Based Learning', label: 'teachingMethodOptions.Problem-Based Learning' },
  { value: 'Inquiry-Based Learning', label: 'teachingMethodOptions.Inquiry-Based Learning' },
  { value: 'Flipped Classroom', label: 'teachingMethodOptions.Flipped Classroom' },
  { value: 'Multiple Intelligences Theory', label: 'teachingMethodOptions.Multiple Intelligences Theory' },
  { value: 'Lecture Mode', label: 'teachingMethodOptions.Lecture Mode' },
  { value: 'Discussion Mode', label: 'teachingMethodOptions.Discussion Mode' },
  { value: 'Practical Mode', label: 'teachingMethodOptions.Practical Mode' },
  { value: 'Case Study', label: 'teachingMethodOptions.Case Study' },
  { value: 'Role Play', label: 'teachingMethodOptions.Role Play' },
  { value: 'Gamified Learning', label: 'teachingMethodOptions.Gamified Learning' },
  { value: 'Individualized Learning', label: 'teachingMethodOptions.Individualized Learning' }
]


// const submitKindergarten = async () => {
//   // Convert comma-separated strings to arrays
//   form.value.ATMOSPHERER_ENGLISH = atmosphereInput.value.split(',').map(s => s.trim()).filter(s => s)
//   form.value.ACTIVITIES_ENGLISH = activitiesInput.value.split(',').map(s => s.trim()).filter(s => s)
//   form.value.TEACHING_METHOD_ENGLISH = teachingInput.value.split(',').map(s => s.trim()).filter(s => s)
//   form.value.FACILITIES_ENGLISH = facilitiesInput.value.split(',').map(s => s.trim()).filter(s => s)

//   // Calculate total rating (optional)
//   const ratings = [form.value.Envrionment, form.value.Teacher, form.value.Resrouces, form.value.Convenient].filter(r => r)
//   form.value.Total = ratings.length ? Math.round(ratings.reduce((a, b) => a + b) / ratings.length) : null

//   try {
//     const res = await fetch('/api/kindergartens', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(form.value)
//     })

//     if (!res.ok) throw new Error('Failed to add')

//     alert('Kindergarten added successfully!')
//     bootstrap.Modal.getInstance(document.getElementById('addKindergartenModal')).hide()
//     form.value = { ...initialFormState } // reset
//     // Refetch list if needed
//   } catch (err) {
//     alert('Error: ' + err.message)
//   }
// }
</script>

<template>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />

  <div class="container py-4 mt-4">
    <div class="d-flex justify-content-between align-items-center my-4">
    <h2 class="mb-0 text fw-bold">{{ $t('kindergarten') }}</h2>

    <!-- Add Kindergarten Button -->
    <button v-if="decoded && decoded.isAdmin"
        type="button" 
        class="btn btn-primary rounded-pill px-4 py-2 shadow-sm d-flex align-items-center gap-2" 
        data-bs-toggle="modal" 
        data-bs-target="#addKindergartenModal"
    >
        <i class="bi bi-plus-lg fs-5"></i>
        Add Kindergarten
    </button>
    </div>

    <!-- Search + Filter Toggle -->
    <div class="d-flex flex-wrap gap-3 align-items-center mb-4">
      <button class="btn btn-outline-secondary btn-lg" @click="toggleFilters">
        <i class="fas fa-filter me-2"></i>
        {{ filtersVisible ? $t('hideFilters') : $t('showFilters') }}
      </button>

      <div class="input-group flex-grow-1" style="max-width: 400px;">
        <input
          v-model="search"
          type="search"
          class="form-control form-control-lg"
          :placeholder="$t('searchPlaceholder')"
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
              <option value="">{{ $t('region') }}</option>
              <option value="Kowloon">{{ $t('kowloon') }}</option>
              <option value="New Territories">{{ $t('newterritories') }}</option>
              <option value="Hong Kong Island">{{ $t('hongkongisland') }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <select v-model="district" class="form-select">
              <option value="">{{ $t('district') }}</option>
              <option value="KOWLOON CITY">{{ $t('districts.KOWLOON_CITY') }}</option>
                <option value="KWUN TONG">{{ $t('districts.KWUN_TONG') }}</option>
                <option value="SHAM SHUI PO">{{ $t('districts.SHAM_SHUI_PO') }}</option>
                <option value="WONG TAI SIN">{{ $t('districts.WONG_TAI_SIN') }}</option>
                <option value="YAU TSIM MONG">{{ $t('districts.YAU_TSIM_MONG') }}</option>
                <option value="ISLANDS">{{ $t('districts.ISLANDS') }}</option>
                <option value="KWAI TSING">{{ $t('districts.KWAI_TSING') }}</option>
                <option value="NORTH">{{ $t('districts.NORTH') }}</option>
                <option value="SAI KUNG">{{ $t('districts.SAI_KUNG') }}</option>
                <option value="SHA TIN">{{ $t('districts.SHA_TIN') }}</option>
                <option value="TAI PO">{{ $t('districts.TAI_PO') }}</option>
                <option value="TSUEN WAN">{{ $t('districts.TSUEN_WAN') }}</option>
                <option value="TUEN MUN">{{ $t('districts.TUEN_MUN') }}</option>
                <option value="YUEN LONG">{{ $t('districts.YUEN_LONG') }}</option>
                <option value="CENTRAL AND WESTERN">{{ $t('districts.CENTRAL_AND_WESTERN') }}</option>
                <option value="EASTERN">{{ $t('districts.EASTERN') }}</option>
                <option value="SOUTHERN">{{ $t('districts.SOUTHERN') }}</option>
                <option value="WAN CHAI">{{ $t('districts.WAN_CHAI') }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <select v-model="section" class="form-select">
              <option value="">{{ $t('section') }}</option>
              <option value="Whole Day">{{ $t('wholeDay') }}</option>
              <option value="AM">{{ $t('amSession') }}</option>
              <option value="PM">{{ $t('pmSession') }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <select v-model="gender" class="form-select">
              <option value="">{{ $t('studentGender') }}</option>
              <option value="CO-ED">{{ $t('coed') }}</option>
              <option value="BOYS">{{ $t('boys') }}</option>
              <option value="GIRLS">{{ $t('girls') }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <select v-model="N_Class" class="form-select">
                <option value="">{{ $t('preClass') }}</option>
                <option value="true">{{ $t('yes') }}</option>
                <option value="false">{{ $t('no') }}</option>
            </select>
          </div>
        </div>

        <div class="row mt-3 g-3">
          <div class="col-md-3">
            <select v-model="religion" class="form-select">
              <option value="">{{ $t('religion') }}</option>
              <option value="BUDDHISM">{{ $t('religionBuddhism') }}</option>
              <option value="CATHOLICISM">{{ $t('religionCatholicism') }}</option>
              <option value="PROTESTANTISM / CHRISTIANITY">{{ $t('religionProtestantism') }}</option>
              <option value="TAOISM">{{ $t('religionTaoism') }}</option>
              <option value="NOT APPLICABLE">{{ $t('religionNotApplicable') }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <select v-model="tuition" class="form-select">
              <option value="">{{ $t('tuitionFee') }}</option>
              <option value="Free">{{ $t('free') }}</option>
              <option value="<=10000">≤ $10,000</option>
              <option value=">10000">> $10,000</option>
            </select>
          </div>

         <div class="col-md-3">
            <label class="form-label fw-bold text-primary">{{ $t('atmosphere') }}</label>
            <div class="d-flex flex-wrap gap-2">
                <div v-for="opt in atmosphereOptions" :key="opt.value">
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="checkbox" :value="opt.value" :id="'atm-'+opt.value" v-model="atmosphere">
                    <label class="form-check-label small" :for="'atm-'+opt.value">
                    {{ $t(opt.label) }}
                    </label>
                </div>
                </div>
            </div>
            </div>

            <!-- Teaching Method Checkboxes -->
            <div class="col-md-3">
            <label class="form-label fw-bold text-success">{{ $t('teachingMethod') }}</label>
            <div class="d-flex flex-wrap gap-2">
                <div v-for="method in teachingMethodOptions" :key="method.value">
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="checkbox" :value="method.value" :id="'tm-'+method.value" v-model="teachingMethods">
                    <label class="form-check-label small" :for="'tm-'+method.value">
                    {{ $t(method.label) }}
                    </label>
                </div>
                </div>
            </div>
            </div>
            </div>

        <div class="mt-4 text-end">
          <button class="btn btn-danger me-2" @click="clearFilters">{{ $t('clearAll') }}</button>
        </div>
      </div>
    </div>

    <!-- Results Header -->
    <h2 class="mt-4 mb-3 text-success">{{ $t('orderByRanking') }}</h2>

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
      <div v-if="decoded" class="action-buttons d-flex align-items-center gap-2">
        <!-- Compare Button -->
        <button 
            @click.stop="handleAddToCompare(kg)"
            class="btn btn-outline-primary btn-sm rounded-pill d-flex align-items-center gap-1 shadow-sm"
            :class="{ 'btn-primary text-white': compareStore.isInCompare(kg._id) }"
        >
            <i class="bi bi-arrow-left-right"></i>
            {{ compareStore.isInCompare(kg._id) ? $t('addedToCompare') : $t('compare') }}
        </button>

        <!-- Bookmark -->
        <button 
            class="bookmark-btn btn btn-light btn-sm rounded-circle shadow-sm d-flex align-items-center justify-content-center"
            @click.stop="toggleBookmark(kg)"
        >
            <i :class="bookmarks.includes(kg._id.toString()) 
                        ? 'bi bi-bookmark-fill text-warning' 
                        : 'bi bi-bookmark'" class="fs-4"></i>
        </button>
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
                    {{ kg.Tuition_fee === "Free" ? $t('free') : `${kg.Tuition_fee}` }}
                  </span>
                  <span class="badge bg-primary fs-6">{{ translateDbValue(kg.RELIGION) || $t('none') }}</span>
                  <span class="badge bg-success fs-6">{{ translateDbValue(kg.STUDENTS_GENDER) }}</span>
                  <span v-if="kg.N_Class" class="badge fs-6" style="background-color: #6610f2; color: white;" >{{ $t('preClassBadge') }}</span>
                  <span class="badge bg-danger fs-6">{{ $t(`districts.${normalizeDistrict(kg.DISTRICT)}`) }}</span>
                </div>

                <div class="d-flex flex-wrap gap-2">
                  <span v-if="kg.SESSION_WHOLE_DAY" class="badge" style="background:#ff9999; color:white;">{{ $t('wholeDay') }}</span>
                  <span v-if="kg.SESSION_AM" class="badge bg-info text-dark">{{ $t('amSession') }}</span>
                  <span v-if="kg.SESSION_PM" class="badge bg-secondary">{{ $t('pmSession') }}</span>
                </div>

                <div class="mt-3 text-end">
                  <small class="text-primary fw-bold">{{ $t('clickToViewDetails') }}</small>
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

    <!-- Floating Compare Bar - WILL NOW SHOW -->
    <div v-if="compareCount > 0" 
        class="position-fixed bottom-0 start-0 end-0 bg-white shadow-lg border-top p-3"
        style="z-index: 1050;">
    <div class="container">
        <div class="d-flex justify-content-between align-items-center">
        <div>
            <strong>{{ $t('comparingKindergartens', { count: compareCount }) }}</strong>
            <span class="ms-3 small text-muted">
            {{ compareItems.map(k => k.ENGLISH_NAME).join(' vs ') }}
            </span>
        </div>
        <div class="d-flex gap-2">
            <router-link to="/compare" class="btn btn-success px-4">
            {{ $t('viewComparison') }}
            </router-link>
            <button @click="compareStore.clearCompare" class="btn btn-outline-secondary">
            {{ $t('clear') }}
            </button>
        </div>
        </div>
    </div>
    </div>
    </div>


  <!-- Add Kindergarten Button (place next to your heading) -->
<!-- <div class="d-flex justify-content-between align-items-center my-4">
  <h2 class="mb-0 fw-bold">{{ $t('kindergarten') }}</h2>

  <button 
    type="button" 
    class="btn btn-primary rounded-pill px-4 py-2 shadow-sm d-flex align-items-center gap-2"
    data-bs-toggle="modal" 
    data-bs-target="#addKindergartenModal"
  >
    <i class="bi bi-plus-lg fs-5"></i>
    {{ $t('addKindergarten') }}
  </button>
</div> -->
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
/* .bookmark-btn {
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

.action-buttons {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
}
.compare-btn {
  background: rgba(154, 35, 35, 0.8);
  padding: 6px 10px;
  border-radius: 50%;
  cursor: pointer;
  transition: 0.2s ease;
}
.compare-btn:hover {
  transform: scale(1.1);
} */
.action-buttons {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  z-index: 10;
}


.bookmark-btn,
.compare-btn {
  background: rgba(255,255,255,0.8);
  padding: 6px 10px;
  border-radius: 50%;
  cursor: pointer;
  transition: 0.2s ease;
  
}

.bookmark-btn:hover,
.compare-btn:hover {
  transform: scale(1.1);
}
/* In your <style> or global CSS */
.compare-floating-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  padding: 1rem 0;
  border-top: 1px solid #e9ecef;
  z-index: 1050;
}
</style>