<template>
  <div class="fun-page py-5">
    <!-- Hero -->
    <div class="hero text-center py-5 mb-5">
      <h1 class="display-4 fw-bold text-primary mb-3">{{ $t('interviewGuideTitle') }}</h1>
      <p class="fs-5 text-secondary">{{ $t('interviewGuideSubtitle') }}</p>
    </div>

    <!-- Quick Navigation -->
    <div class="sticky-top bg-white shadow-sm py-3 mb-5 rounded-4" style="top: 90px; z-index: 100;">
      <div class="container">
        <div class="row g-3 justify-content-center text-center">
          <div class="col-auto">
            <button @click="scrollTo('formats')" class="btn btn-outline-primary rounded-pill px-4 py-2">
              <i class="bi bi-journal-text me-2"></i>{{ $t('interviewFormats') }}
            </button>
          </div>
          <div class="col-auto">
            <button @click="scrollTo('child')" class="btn btn-outline-warning rounded-pill px-4 py-2">
              <i class="bi bi-people me-2"></i>{{ $t('childQuestions') }}
            </button>
          </div>
          <div class="col-auto">
            <button @click="scrollTo('parent')" class="btn btn-outline-info rounded-pill px-4 py-2">
              <i class="bi bi-person-heart me-2"></i>{{ $t('parentQuestions') }}
            </button>
          </div>
          <div class="col-auto">
            <button @click="scrollTo('tips')" class="btn btn-outline-success rounded-pill px-4 py-2">
              <i class="bi bi-lightbulb me-2"></i>{{ $t('prepTips') }}
            </button>
          </div>
          <div class="col-auto">
            <button @click="scrollTo('dos')" class="btn btn-outline-danger rounded-pill px-4 py-2">
              <i class="bi bi-hand-thumbs-up me-2"></i>{{ $t('dosAndDonts') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Interview Formats -->
    <section id="formats" class="mb-5 scroll-mt-5">
      <h2 class="text-center h3 fw-bold text-success mb-5">{{ $t('interviewFormats') }}</h2>
      <div class="row g-5 justify-content-center">
        <div class="col-md-5">
          <div class="card border-0 shadow-lg rounded-4 text-center p-5 bg-pink">
            <div class="fs-1 mb-4">👩‍🏫💬</div>
            <h4 class="text-primary">{{ $t('individualInterview') }}</h4>
            <p class="fs-5">{{ $t('individualDesc') }}</p>
          </div>
        </div>
        <div class="col-md-5">
          <div class="card border-0 shadow-lg rounded-4 text-center p-5 bg-blue">
            <div class="fs-1 mb-4">👭🎲🎨</div>
            <h4 class="text-primary">{{ $t('groupPlay') }}</h4>
            <p class="fs-5">{{ $t('groupDesc') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Child Questions with Flip Cards + TTS -->
    <section id="child" class="mb-5 scroll-mt-5">
      <h2 class="text-center h3 fw-bold text-warning mb-5">{{ $t('childQuestions') }}</h2>
      <div class="row g-5 justify-content-center">
        <div class="col-lg-9 col-xl-8" v-for="(item, index) in childQA" :key="index">
          <div class="flip-card" @click="toggleFlip(index)">
            <div class="flip-card-inner" :class="{ flipped: flippedCards[index] }">
              <!-- Front: Question -->
              <div class="flip-card-front d-flex flex-column align-items-center justify-content-center p-5 shadow rounded-4 bg-light text-dark">
                <i class="bi bi-question-circle fs-1 text-secondary mb-4"></i>
                <h5 class="text-center mb-0">{{ item.question }}</h5>
                 <button @click.stop="speak(item.question)" class="btn btn-success rounded-pill px-5 shadow-sm mt-2">
                  <i class="bi bi-volume-up-fill me-2"></i>
                  {{ $t('listenButton') }}
                </button>
                <p class="mt-4 small text-muted">Tap to see answer →</p>
              </div>

              <!-- Back: Answer + Listen Button -->
              <div class="flip-card-back d-flex flex-column align-items-center justify-content-center p-5 shadow rounded-4 bg-white">
                <i class="bi bi-chat-heart-fill fs-1 text-success mb-4"></i>
                <p class="fs-5 text-center text-dark fw-medium mb-4">{{ item.answer }}</p>
                <button @click.stop="speak(item.answer)" class="btn btn-success rounded-pill px-5 shadow-sm">
                  <i class="bi bi-volume-up-fill me-2"></i>
                  {{ $t('listenButton') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Parent Questions -->
    <section id="parent" class="mb-5 scroll-mt-5">
      <h2 class="text-center h3 fw-bold text-info mb-5">{{ $t('parentQuestions') }}</h2>
      <div class="row g-5 justify-content-center">
        <div class="col-lg-9" v-for="(item, index) in parentQA" :key="index">
          <div class="card border-0 shadow rounded-4 bg-yellow p-5">
            <div class="d-flex align-items-start">
              <div class="fs-1 text-danger me-4">👨‍👩‍👧</div>
              <div>
                <h5 class="text-dark mb-3">{{ item.question }}</h5>
                <p class="fs-5 text-muted">{{ item.answer }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Preparation Tips -->
    <section id="tips" class="mb-5 scroll-mt-5">
      <h2 class="text-center h3 fw-bold text-purple mb-5">{{ $t('prepTips') }}</h2>
      <div class="row g-5 justify-content-center">
        <div class="col-md-6 col-lg-4" v-for="(tip, i) in tips" :key="i">
          <div class="card border-0 shadow-lg rounded-4 text-center p-5 bg-white">
            <div class="fs-1 text-warning mb-4">💡</div>
            <p class="fs-5 fw-bold text-dark">{{ tip }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Do's & Don'ts -->
    <section id="dos" class="mb-5 scroll-mt-5">
      <h2 class="text-center h3 fw-bold text-danger mb-5">{{ $t('dosAndDonts') }}</h2>
      <div class="row justify-content-center g-5">
        <div class="col-md-5">
          <div class="bg-success text-white rounded-4 p-5 text-center shadow-lg">
            <div class="fs-1 mb-4">👍</div>
            <h4 class="mb-4">{{ $t('dos') }}</h4>
            <ul class="list-unstyled fs-5">
              <li v-for="doItem in dos" :key="doItem" class="mb-3">{{ doItem }}</li>
            </ul>
          </div>
        </div>
        <div class="col-md-5">
          <div class="bg-danger text-white rounded-4 p-5 text-center shadow-lg">
            <div class="fs-1 mb-4">👎</div>
            <h4 class="mb-4">{{ $t('donts') }}</h4>
            <ul class="list-unstyled fs-5">
              <li v-for="dont in donts" :key="dont" class="mb-3">{{ dont }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <div class="text-center my-5">
      <router-link to="/kindergartens" class="btn btn-primary btn-lg rounded-pill px-6 py-4 shadow-lg fs-4">
        <i class="bi bi-heart-fill me-3"></i>{{ $t('searchKindergartens') }}
      </router-link>
    </div>

    <!-- Back to Top -->
    <button @click="scrollToTop" class="btn btn-light rounded-circle shadow position-fixed bottom-0 end-0 m-4"
            style="width:55px; height:55px; z-index:1050; border: 3px solid #ff99cc;">
      <i class="bi bi-arrow-up fs-4 text-primary"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

// Flip card state
const flippedCards = ref({})

// Toggle flip indexed card (question/answer)
const toggleFlip = (index) => {
  flippedCards.value[index] = !flippedCards.value[index]
}

// Text-to-Speech
const speak = (text) => {
  if (!('speechSynthesis' in window)) {
    alert('Your browser does not support text-to-speech 😔')
    return
  }

  // Stop any ongoing speech
  window.speechSynthesis.cancel()

  //create instance
  const utterance = new SpeechSynthesisUtterance(text)

  // Set language
  utterance.lang = locale.value === 'zh' ? 'zh-HK' : 'en-US'
  utterance.rate = 0.9   // Slightly slower for kids
  utterance.pitch = 1.2  // Friendly, higher pitch
  utterance.volume = 1

  // Try to use a better voice
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v => 
    locale.value === 'zh' 
      ? v.lang.includes('zh') || v.lang.includes('cmn') || v.lang.includes('yue')
      : v.lang.includes('en')
  )
  if (preferred) utterance.voice = preferred

  window.speechSynthesis.speak(utterance)
}

// Load voices properly
onMounted(() => {
    // Ensure voices are loaded in browser before using them
  if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => {
      // Voices loaded
    }
  }
})

// Scroll functions
const scrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Your data
const childQA = computed(() => [
  { question: t('qNameAge'), answer: t('aNameAge') },
  { question: t('qFamily'), answer: t('aFamily') },
  { question: t('qBreakfast'), answer: t('aBreakfast') },
  { question: t('qFavorite'), answer: t('aFavorite') },
  { question: t('qHobbies'), answer: t('aHobbies') },
  { question: t('qIdentify'), answer: t('aIdentify') },
  { question: t('qStory'), answer: t('aStory') },
  { question: t('qInstructions'), answer: t('aInstructions') }
])

const parentQA = computed(() => [
  { question: t('pqWhySchool'), answer: t('paWhySchool') },
  { question: t('pqStrengths'), answer: t('paStrengths') },
  { question: t('pqChallenges'), answer: t('paChallenges') },
  { question: t('pqExpectations'), answer: t('paExpectations') },
  { question: t('pqWeekend'), answer: t('paWeekend') }
])

const tips = computed(() => [
  t('tipNatural'),
  t('tipStories'),
  t('tipRolePlay'),
  t('tipManners'),
  t('tipRest')
])

const dos = computed(() => [
  t('doHonest'),
  t('doListen'),
  t('doEncourage')
])

const donts = computed(() => [
  t('dontAnswer'),
  t('dontOverPrepare'),
  t('dontStress')
])
</script>

<style scoped>
.fun-page {
  background: linear-gradient(135deg, #f0f9ff 0%, #fff0f8 100%);
  min-height: 100vh;
  font-family: 'Comic Sans MS', cursive, sans-serif;
}

.hero {
  background: #fff0f8;
  border: 5px dashed #ff99cc;
  border-radius: 30px;
}

.bg-pink { background: #ffebee !important; }
.bg-blue { background: #e3f2fd !important; }
.bg-yellow { background: #fffde7 !important; }

.flip-card {
  perspective: 1000px;
  cursor: pointer;
  height: 280px;
}
.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.flip-card-inner.flipped {
  transform: rotateY(180deg);
}
.flip-card-front, .flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
}
.flip-card-front {
  background: #fdfdfd;
}
.flip-card-back {
  background: #fffaf0;
  transform: rotateY(180deg);
  border: 4px solid #ffccbc;
}

.scroll-mt-5 {
  scroll-margin-top: 120px;
}
</style>