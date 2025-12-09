<script setup>
import { ref, onMounted } from 'vue'

const kindergartens = ref([])
const page = ref(1)
const totalPages = ref(1)
const perPage = ref(6)
const search = ref('')
const filtersVisible = ref(false)

// Filters
const region = ref('')
const district = ref('')
const section = ref('')
const gender = ref('')
const religion = ref('')
const tuition = ref('')
const atmosphere = ref([])
const teachingMethods = ref([])

function toggleFilters() {
  filtersVisible.value = !filtersVisible.value
}

async function loadKindergartens() {
  const res = await fetch(`/api/kindergartens?page=${page.value}&perPage=${perPage.value}`)
  if (res.ok) {
    const data = await res.json()
    kindergartens.value = data.kindergartens
    totalPages.value = data.totalPages
  }
}

async function applyFilters() {
  const params = new URLSearchParams({
    Region_English: region.value,
    DISTRICT: district.value,
    STUDENTS_GENDER: gender.value,
    RELIGION: religion.value,
    Tuition_fee: tuition.value,
    SESSION_WHOLE_DAY: section.value === 'Whole Day',
    SESSION_AM: section.value === 'AM',
    SESSION_PM: section.value === 'PM',
    ATMOSPHERER_ENGLISH: atmosphere.value.join(','),
    TEACHING_METHOD_ENGLISH: teachingMethods.value.join(','),
    search: search.value,
    page: page.value,
    perPage: perPage.value
  })

  const res = await fetch(`/api/kindergartens/filter?${params.toString()}`)
  if (res.ok) {
    const data = await res.json()
    kindergartens.value = data.kindergartens
    totalPages.value = data.totalPages
  }
}

function clearFilters() {
  region.value = ''
  district.value = ''
  section.value = ''
  gender.value = ''
  religion.value = ''
  tuition.value = ''
  atmosphere.value = []
  teachingMethods.value = []
  search.value = ''
  page.value = 1
  loadKindergartens()
}

onMounted(loadKindergartens)
</script>

<template>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"/>

  <div class="container">
    <h1 class="my-4">Kindergarten</h1>

    <!-- Filters + Search -->
    <div class="d-flex mb-3 align-items-center">
      <button class="btn btn-secondary mb-3" @click="toggleFilters">
        {{ filtersVisible ? 'Hide Filters' : 'Show Filters' }}
      </button>

      <div class="input-group rounded ms-auto" style="max-width: 300px;">
        <input
          v-model="search"
          type="search"
          class="form-control rounded mb-3"
          placeholder="Search by school name (English or Chinese)"
        />
        <button class="input-group-text border-0 mb-3" @click="applyFilters">
          <i class="fas fa-search"></i>
        </button>
      </div>
    </div>

    <!-- Filter Section -->
    <div v-if="filtersVisible" class="filter-section mb-3">
      <div class="row">
        <div class="col-md-3">
          <select v-model="region" class="form-control">
            <option value="">Region</option>
            <option value="Kowloon">Kowloon</option>
            <option value="New Territories">New Territories</option>
            <option value="Hong Kong Island">Hong Kong Island</option>
          </select>
        </div>
        <div class="col-md-3">
          <select v-model="district" class="form-control">
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
        <div class="col-md-3">
          <select v-model="section" class="form-control">
            <option value="">Section</option>
            <option value="Whole Day">Whole Day</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
        <div class="col-md-3">
          <select v-model="gender" class="form-control">
            <option value="">Student Gender</option>
            <option value="CO-ED">Co-Ed</option>
            <option value="BOYS">Boys</option>
            <option value="GIRLS">Girls</option>
          </select>
        </div>
      </div>

      <div class="row mt-3">
        <div class="col-md-3">
          <select v-model="religion" class="form-control">
            <option value="">Religion</option>
            <option value="BUDDHISM">Buddhism</option>
            <option value="CATHOLICISM">Catholicism</option>
            <option value="PROTESTANTISM / CHRISTIANITY">Protestantism / Christianity</option>
            <option value="TAOISM">Taoism</option>
            <option value="NOT APPLICABLE">Not Applicable</option>
          </select>
        </div>
        <div class="col-md-3">
          <select v-model="tuition" class="form-control">
            <option value="">Cost Amount</option>
            <option value="Free">Free</option>
            <option value="~10000">~10000</option>
            <option value=">15000">>15000</option>
          </select>
        </div>
            <div class="col-md-3">
                <label class="form-label">Atmosphere</label>
                <div class="atmosphere-checkboxes">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Lively" id="atmosphere-lively" v-model="atmosphere">
                        <label class="form-check-label" for="atmosphere-lively">Lively</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Joyful" id="atmosphere-joyful" v-model="atmosphere">
                        <label class="form-check-label" for="atmosphere-joyful">Joyful</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Serious" id="atmosphere-serious" v-model="atmosphere">
                        <label class="form-check-label" for="atmosphere-serious">Serious</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Relaxed" id="atmosphere-relaxed" v-model="atmosphere">
                        <label class="form-check-label" for="atmosphere-relaxed">Relaxed</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Interactive" id="atmosphere-interactive" v-model="atmosphere">
                        <label class="form-check-label" for="atmosphere-interactive">Interactive</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Tense" id="atmosphere-tense" v-model="atmosphere">
                        <label class="form-check-label" for="atmosphere-tense">Tense</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Dull" id="atmosphere-dull" v-model="atmosphere">
                        <label class="form-check-label" for="atmosphere-dull">Dull</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Creative" id="atmosphere-creative" v-model="atmosphere">
                        <label class="form-check-label" for="atmosphere-creative">Creative</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Supportive" id="atmosphere-supportive" v-model="atmosphere">
                        <label class="form-check-label" for="atmosphere-supportive">Supportive</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Exploratory" id="atmosphere-exploratory" v-model="atmosphere">
                        <label class="form-check-label" for="atmosphere-exploratory">Exploratory</label>
                    </div>
                </div>
            </div>

            <!-- Teaching Method Checkboxes -->
            <div class="col-md-3">
                <label class="form-label">Teaching Method</label>
                <div class="teaching-checkboxes">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Traditional Teaching" id="teaching-traditional" v-model="teachingMethods">
                        <label class="form-check-label" for="teaching-traditional">Traditional Teaching</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Constructivism" id="teaching-constructivism" v-model="teachingMethods">
                        <label class="form-check-label" for="teaching-constructivism">Constructivism</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Cooperative Learning" id="teaching-cooperative" v-model="teachingMethods">
                        <label class="form-check-label" for="teaching-cooperative">Cooperative Learning</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Problem-Based Learning" id="teaching-problem" v-model="teachingMethods">
                        <label class="form-check-label" for="teaching-problem">Problem-Based Learning</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Inquiry-Based Learning" id="teaching-inquiry" v-model="teachingMethods">
                        <label class="form-check-label" for="teaching-inquiry">Inquiry-Based Learning</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Flipped Classroom" id="teaching-flipped" v-model="teachingMethods">
                        <label class="form-check-label" for="teaching-flipped">Flipped Classroom</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Multiple Intelligences Theory" id="teaching-intelligences" v-model="teachingMethods">
                        <label class="form-check-label" for="teaching-intelligences">Multiple Intelligences</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Lecture Mode" id="teaching-lecture" v-model="teachingMethods">
                        <label class="form-check-label" for="teaching-lecture">Lecture Mode</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Discussion Mode" id="teaching-discussion" v-model="teachingMethods">
                        <label class="form-check-label" for="teaching-discussion">Discussion Mode</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Practical Mode" id="teaching-practical" v-model="teachingMethods">
                        <label class="form-check-label" for="teaching-practical">Practical Mode</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Case Study" id="teaching-case" v-model="teachingMethods">
                        <label class="form-check-label" for="teaching-case">Case Study</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Role Play" id="teaching-roleplay" v-model="teachingMethods">
                        <label class="form-check-label" for="teaching-roleplay">Role Play</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Gamified Learning" id="teaching-gamified" v-model="teachingMethods">
                        <label class="form-check-label" for="teaching-gamified">Gamified Learning</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Individualized Learning" id="teaching-individualized" v-model="teachingMethods">
                        <label class="form-check-label" for="teaching-individualized">Individualized Learning</label>
                    </div>
                </div>
            </div>
      </div>

      <button class="btn btn-success mt-3 me-2" @click="applyFilters">Apply Filters</button>
      <button class="btn btn-primary mt-3" @click="clearFilters">Clear</button>
    </div>

    <!-- Kindergarten Cards -->
    <h2 class="mt-3 mb-2">Order By Ranking</h2>
    <div class="kindergarten-container">
      <div
        v-for="kg in kindergartens"
        :key="kg._id"
        class="kindergarten-card mb-3"
      >
        <router-link :to="`/kindergarten/detail/${kg._id}`" class="text-decoration-none text-dark">
          <div class="card" style="max-width: 100%;">
            <div class="row g-0">
              <div class="col-md-4">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ--5AGZ3D1LpgF7W0ehZ4VARScRKshzTk7AA&s"
                  class="img-fluid rounded-start"
                  :alt="kg.ENGLISH_NAME"
                  style="width: 100%; height: 100%; object-fit: cover;"
                />
              </div>
              <div class="col-md-8">
                <div class="card-body">
                  <h5 class="card-title">{{ kg.ENGLISH_NAME }}</h5>
                  <h5 class="card-title">{{ kg.中文名稱 }}</h5>

                  <span class="badge bg-warning">
                    {{ kg.Tuition_fee === 0 ? 'Free' : kg.Tuition_fee }}
                  </span>
                  <span class="badge bg-primary" style="margin-left: 3px">{{ kg.RELIGION }}</span>
                  <span class="badge bg-success" style="margin-left: 3px">{{ kg.STUDENTS_GENDER }}</span>
                  <span class="badge bg-danger" style="margin-left: 3px">{{ kg.DISTRICT }}</span>

                  <span v-if="kg.SESSION_WHOLE_DAY" class="badge bg-pink" style="margin-left: 3px">WHOLE DAY</span>
                  <span v-if="kg.SESSION_AM" class="badge bg-pink" style="margin-left: 3px">AM</span>
                  <span v-if="kg.SESSION_PM" class="badge bg-pink" style="margin-left: 3px">PM</span>
                </div>
              </div>
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Pagination -->
    <nav aria-label="Page navigation">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: page === 1 }">
          <button class="page-link" @click="page > 1 && (page--, loadKindergartens())">&laquo;</button>
        </li>

        <li
          v-for="i in totalPages"
          :key="i"
          class="page-item"
          :class="{ active: i === page }"
        >
          <button class="page-link" @click="page = i; loadKindergartens()">{{ i }}</button>
        </li>

        <li class="page-item" :class="{ disabled: page === totalPages }">
          <button class="page-link" @click="page < totalPages && (page++, loadKindergartens())">&raquo;</button>
        </li>
      </ul>
    </nav>
  </div>
</template>