
<script setup>
import { useCompareStore } from '@/store/useCompareStore'
import { ref,computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet' // Will be loaded from CDN in onMounted
import { useI18n } from 'vue-i18n'; // ← ADD THIS

const { t } = useI18n(); // ← ADD THIS LINE

const translateDbValue = (value) => {
  if (!value) return '-'
  const key = typeof value === 'string' ? value.toUpperCase().trim() : value
  return t(key, key) // fallback to original if no translation
}

const compareStore = useCompareStore()
const compareItems = computed(() => compareStore.compareItems)
const router = useRouter()
const showPersonalizedComment = ref(false)

const removeFromCompare = (id) => compareStore.removeFromCompare(id)
const clearCompare = () => compareStore.clearCompare()

const defaultImg = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWDMW6ntfY590jhxvrUeuObzhRb8t7LaRkvQ&s'

const addressSearch = ref('')

const searchAddress = async () => {
  if (!addressSearch.value.trim()) return

  const query = encodeURIComponent(addressSearch.value.trim())
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`

  try {
    const res = await fetch(url)
    const data = await res.json()

    if (data && data.length > 0) {
        // take the searched location of latitude and longitude
      const { lat, lon } = data[0]
      const latlng = [parseFloat(lat), parseFloat(lon)] 

      map.setView(latlng, 15)

      // Add or move user-like marker
      if (userMarker) {
        userMarker.setLatLng(latlng)
      } else {
        userMarker = L.marker(latlng).addTo(map)
      }
      userMarker.bindPopup(`<strong>${addressSearch.value}</strong>`).openPopup()

      // Optional: add circle like locate
      if (searchCircle) map.removeLayer(searchCircle)
      searchCircle = L.circle(latlng, { radius: 500, color: '#3388ff' }).addTo(map)
    } else {
      alert(t('addressNotFound'))
    }
  } catch (err) {
    alert(t('searchError'))
  }
}

// Add this to clean up
let searchCircle = null

// Update locateUser to also clean search circle if needed

// Check if we have valid coordinates for at least one kindergarten
const hasValidCoordinates = computed(() => {
  return compareItems.value.some(kg => 
    kg.LONGITUDE && kg.LATITUDE && 
    !isNaN(kg.LONGITUDE) && !isNaN(kg.LATITUDE)
  )
})

// Map instance
let map = null
let userMarker = null

// Initialize map when modal is shown
const initMap = () => {
  nextTick(() => {
    if (map) map.remove() // clean previous

    map = L.map('comparisonMap').setView([22.3193, 114.1694], 11) // Default HK center

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)

    const validKgs = compareItems.value.filter(kg => 
      kg.LONGITUDE && kg.LATITUDE && 
      !isNaN(kg.LONGITUDE) && !isNaN(kg.LATITUDE)
    )

    const bounds = []

    validKgs.forEach(kg => {
      const lat = parseFloat(kg.LATITUDE)
      const lng = parseFloat(kg.LONGITUDE)
      const marker = L.marker([lat, lng]).addTo(map)
      marker.bindPopup(`
        <strong>${kg.ENGLISH_NAME}</strong><br>
        ${kg.中文名稱 || ''}
      `).openPopup()

      bounds.push([lat, lng])
    })

    // Fit map to show all markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  })
}

// Locate user
const locateUser = () => {
  if (!navigator.geolocation) {
    alert(t('geolocationNotSupported'))
    return
  }

  map.locate({ setView: true, maxZoom: 16 })

  map.on('locationfound', (e) => {
    const radius = e.accuracy / 2

    if (userMarker) map.removeLayer(userMarker)
    userMarker = L.marker(e.latlng).addTo(map)
      .bindPopup(t('youAreHere')).openPopup()

    L.circle(e.latlng, radius).addTo(map)
  })

  map.on('locationerror', () => {
    alert($t('unableToLocate'))
  })
}

// Load Leaflet from CDN and init map when modal opens
onMounted(() => {
  const bootstrapModal = document.getElementById('mapModal')
  if (bootstrapModal) {
    bootstrapModal.addEventListener('shown.bs.modal', () => {
      // Load Leaflet only when needed
      if (typeof L === 'undefined') {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = initMap
        document.head.appendChild(script)
      } else {
        initMap()
      }
    })
  }
})
</script>

<template>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>

    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

  <div class="container py-5">
    <h2 class="text-center mb-5 fw-bold">{{ $t('kindergartenComparison') }}</h2>

     <button @click="router.back()" class="btn btn-outline-primary">{{ $t('back') }}</button>

    <div class="d-flex justify-content-end mb-4">

    <!-- Personalized Comment Button -->
    <button v-if="compareItems.length > 0"
      @click="showPersonalizedComment = true"
      class="btn btn-warning btn-lg d-flex align-items-center gap-2 shadow-sm"
      style="margin-right: 2%;"
    >
      <i class="bi bi-chat-heart-fill"></i>
      {{ $t('viewPersonalizedComment') }}
    </button>

    <button
        v-if="hasValidCoordinates"
        class="btn btn-outline-success btn-lg d-flex align-items-center gap-2 shadow-sm"
        data-bs-toggle="modal"
        data-bs-target="#mapModal"
    >
        <i class="bi bi-geo-alt-fill"></i>
        {{ $t('viewOnMap') }}
    </button>
    </div>

    <!-- Empty State -->
    <div v-if="compareItems.length === 0" class="text-center py-5">
      <p class="text-muted fs-4">{{ $t('noKindergartensSelected') }}</p>
      <router-link to="/kindergartens" class="btn btn-primary btn-lg">
        {{ $t('browseKindergartens') }}
      </router-link>
    </div>

    <!-- Comparison Cards -->
    <div v-else class="row g-5">
      <!-- Loop over compareItems (works for 1 or 2) -->
      <div class="col-lg-6" v-for="kg in compareItems" :key="kg._id">
        <div class="card h-100 shadow-lg border-0 rounded-4 overflow-hidden">
          <img
            :src="kg.photo || defaultImg"
            class="card-img-top"
            style="height: 320px; object-fit: cover;"
            :alt="kg.ENGLISH_NAME"
          />

          <div class="card-body p-4">
            <h4 class="card-title text-primary fw-bold">{{ kg.ENGLISH_NAME }}</h4>
            <h5 class="text-muted mb-4">{{ kg.中文名稱 }}</h5>

            <!-- Parent Ratings - Using direct icons (NO COMPONENT) -->
            <div class="mb-4">
              <h6 class="fw-bold text-primary mb-3">{{ $t('parentRatings') }}</h6>

              <!-- Overall Rating (larger) -->
              <div class="d-flex align-items-center mb-3">
                <span class="fw-medium text-muted me-4">{{ $t('overall') }}:</span>
                <div class="d-flex align-items-center">
                  <i
                    v-for="n in 5"
                    :key="n"
                    :class="n <= Math.round(kg.Total || 0) ? 'bi bi-star-fill text-warning' : 'bi bi-star text-muted'"
                    class="fs-4 me-1"
                  ></i>
                  <strong class="ms-2 fs-5">{{ (kg.Total || 0).toFixed(1) }}/5</strong>
                </div>
              </div>

              <!-- Other Ratings -->
              <div class="small text-muted">
                <div class="d-flex align-items-center mb-2">
                  <span class="me-4" style="width: 100px;">{{ $t('environment') }}:</span>
                  <i
                    v-for="n in 5"
                    :key="n"
                    :class="n <= Math.round(kg.Envrionment || 0) ? 'bi bi-star-fill text-warning' : 'bi bi-star text-muted'"
                    class="fs-5 me-1"
                  ></i>
                </div>
                <div class="d-flex align-items-center mb-2">
                  <span class="me-4" style="width: 100px;">{{ $t('teachers') }}:</span>
                  <i
                    v-for="n in 5"
                    :key="n"
                    :class="n <= Math.round(kg.Teacher || 0) ? 'bi bi-star-fill text-warning' : 'bi bi-star text-muted'"
                    class="fs-5 me-1"
                  ></i>
                </div>
                <div class="d-flex align-items-center mb-2">
                  <span class="me-4" style="width: 100px;">{{ $t('resources') }}:</span>
                  <i
                    v-for="n in 5"
                    :key="n"
                    :class="n <= Math.round(kg.Resrouces || 0) ? 'bi bi-star-fill text-warning' : 'bi bi-star text-muted'"
                    class="fs-5 me-1"
                  ></i>
                </div>
                <div class="d-flex align-items-center mb-2">
                  <span class="me-4" style="width: 100px;">{{ $t('convenience') }}:</span>
                  <i
                    v-for="n in 5"
                    :key="n"
                    :class="n <= Math.round(kg.Convenient || 0) ? 'bi bi-star-fill text-warning' : 'bi bi-star text-muted'"
                    class="fs-5 me-1"
                  ></i>
                </div>
              </div>
            </div>

            <hr class="my-4">

            <!-- Key Information -->
            <div class="row g-3 mb-4">
              <div class="col-5 fw-semibold text-muted">{{ $t('tuitionFee') }}:</div>
              <div class="col-7">
                <span class="badge bg-warning text-dark fs-6 px-3">
                  {{ kg.Tuition_fee === "Free" ? $t('free') : kg.Tuition_fee }}
                </span>
              </div>

              <div class="col-5 fw-semibold text-muted">{{ $t('studentGender') }}:</div>
              <div class="col-7">
                <span class="badge bg-success fs-6">{{ translateDbValue(kg.STUDENTS_GENDER) }}</span>
              </div>

              <div class="col-5 fw-semibold text-muted">{{ $t('religion') }}:</div>
              <div class="col-7">{{ translateDbValue(kg.RELIGION) || $t('none') }}</div>

              <div class="col-5 fw-semibold text-muted">{{ $t('sessionTypes') }}:</div>
              <div class="col-7">
                <div class="d-flex flex-wrap gap-2">
                  <span v-if="kg.SESSION_WHOLE_DAY" class="badge bg-info text-dark">{{ $t('wholeDay') }}</span>
                  <span v-if="kg.SESSION_AM" class="badge bg-info text-dark">{{ $t('amSession') }}</span>
                  <span v-if="kg.SESSION_PM" class="badge bg-info text-dark">{{ $t('pmSession') }}</span>
                </div>
              </div>

              <div class="col-5 fw-semibold text-muted">{{ $t('preClass') }}:</div>
              <div class="col-7">
                <span class="badge px-3" :style="{ backgroundColor: kg.N_Class ? '#6610f2' : '#6c757d', color: 'white' }">
                  {{ kg.N_Class ? $t('yes') : $t('no') }}
                </span>
              </div>
            </div>

            <hr class="my-4">

            <!-- Atmosphere Tags -->
            <div class="mb-4">
            <h6 class="fw-bold text-primary mb-3">{{ $t('atmosphere') }}</h6>
            <div class="d-flex flex-wrap gap-2">
                <template v-if="kg.ATMOSPHERER_ENGLISH && kg.ATMOSPHERER_ENGLISH.length > 0">
                <span 
                    v-for="atm in kg.ATMOSPHERER_ENGLISH" 
                    :key="atm"
                    class="badge"
                    style="background:#ff9999; color:white;"
                >
                    {{ $t(`atmosphereOptions.${atm}`) }}
                </span>
                </template>
                <span v-else class="text-muted small">{{ $t('none') }}</span>
            </div>
            </div>

            <!-- Teaching Method Tags -->
            <div class="mb-4">
            <h6 class="fw-bold text-success mb-3">{{ $t('teachingMethod') }}</h6>
            <div class="d-flex flex-wrap gap-2">
                <template v-if="kg.TEACHING_METHOD_ENGLISH && kg.TEACHING_METHOD_ENGLISH.length > 0">
                <span 
                    v-for="method in kg.TEACHING_METHOD_ENGLISH" 
                    :key="method"
                    class="badge bg-purple text-white px-3 py-2"
                >
                    {{ $t(`teachingMethodOptions.${method}`) }}
                </span>
                </template>
                <span v-else class="text-muted small">{{ $t('none') }}</span>
            </div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex gap-2">
              <router-link
                :to="{ name: 'Detail kindergarten', params: { kindergartenId: kg._id } }"
                class="btn btn-outline-primary flex-fill"
              >
                {{ $t('viewDetails') }}
              </router-link>
              <!-- <button @click="router.back()" class="btn btn-outline-primary">{{ $t('viewDetails') }}</button> -->
              <button @click="removeFromCompare(kg._id)" class="btn btn-outline-danger flex-fill">
                {{ $t('remove') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Clear All Button -->
    <div class="text-center mt-5" v-if="compareItems.length > 0">
      <button @click="clearCompare" class="btn btn-outline-secondary btn-lg px-5">
        {{ $t('clearComparison') }}
      </button>
    </div>
  </div>

 <!-- Map Modal with Address Search -->
<div class="modal fade" id="mapModal" tabindex="-1" aria-labelledby="mapModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="mapModalLabel">
          <i class="bi bi-geo-alt me-2"></i>{{ $t('kindergartensLocation') }}
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <!-- Address Search Bar -->
      <div class="modal-body p-0">
        <div class="p-3 bg-light border-bottom">
          <div class="input-group">
            <input
              type="text"
              class="form-control"
              :placeholder="$t('searchAddressPlaceholder')"
              v-model="addressSearch"
              @keyup.enter="searchAddress"
            />
            <button class="btn btn-primary" @click="searchAddress">
              <i class="bi bi-search"></i>
            </button>
          </div>
        </div>

        <div id="comparisonMap" style="height: 600px; width: 100%;"></div>
      </div>

      <div class="modal-footer justify-content-between">
        <button @click="locateUser" class="btn btn-outline-primary">
          <i class="bi bi-crosshair me-2"></i>{{ $t('locateMe') }}
        </button>
        <small class="text-muted">{{ $t('mapHint') }}</small>
      </div>
    </div>
  </div>
</div>

<!-- Personalized Comment Modal -->
<div class="modal fade" :class="{ show: showPersonalizedComment }" :style="{ display: showPersonalizedComment ? 'block' : 'none' }" tabindex="-1">
  <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header bg-warning text-dark">
        <h5 class="modal-title">
          <i class="bi bi-chat-heart-fill me-2"></i>
          {{ $t('personalizedRecommendation') }}
        </h5>
        <button type="button" class="btn-close" @click="showPersonalizedComment = false"></button>
      </div>
      <div class="modal-body">
        <!-- Replace this with your actual AI-generated message -->
        <p class="lead">
          Based on your preferences and the comparison between 
          <strong>{{ compareItems[0]?.ENGLISH_NAME }}</strong>
          <template v-if="compareItems.length > 1">
            and <strong>{{ compareItems[1]?.ENGLISH_NAME }}</strong>
          </template>
          , here is a personalized recommendation:
        </p>

        <div class="bg-light p-4 rounded-3 border">
          <p class="mb-0">
            <!-- Example message - replace with real AI output -->
            Both kindergartens offer excellent environments, but 
            <strong>{{ compareItems[0]?.ENGLISH_NAME }}</strong> stands out with its 
            creative and supportive atmosphere, while 
            <template v-if="compareItems.length > 1">
              <strong>{{ compareItems[1]?.ENGLISH_NAME }}</strong> excels in structured teaching methods.
            </template>
            If you're looking for a more playful learning experience, we recommend the first one.
          </p>
        </div>

        <small class="text-muted d-block mt-3">
          {{ $t('aiGeneratedNote') }}
        </small>
      </div>
      <div class="modal-footer">
        <button @click="showPersonalizedComment = false" class="btn btn-secondary">
          {{ $t('close') }}
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Backdrop -->
<div v-if="showPersonalizedComment" class="modal-backdrop fade show" @click="showPersonalizedComment = false"></div>
</template>
<style scoped>
/* Optional: make labels same width for alignment */
.me-4[style*="width"] {
  width: 120px !important;
}

.bg-purple {
  background-color: #f37e50 !important;
}
</style>