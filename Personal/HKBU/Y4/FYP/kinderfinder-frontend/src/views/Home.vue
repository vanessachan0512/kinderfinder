<style scoped>
 /* Carousel height adjustment */
    .carousel-item img {
      height: 300px; /* Set your desired height */
      width: 100%;
      object-fit: cover; /* Maintain aspect ratio */
    }
    .card {
        background-color: #f9f9f9; /* Light background for emphasis */
    }
    .card-text {
        font-size: 1.1rem; /* Slightly larger font for readability */
    } 
    #calendar {
    max-width: 1100px;
    margin: 40px auto;
    }
</style>
<!-- <script setup>
import { onMounted } from 'vue'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import bootstrap5Plugin from '@fullcalendar/bootstrap5'

// Function to fetch events from backend
async function fetchKindergartenEvents() {
  try {
    const res = await fetch('/api/kindergartens/dates') // ✅ ensure correct path
    const data = await res.json()
    return data.events || []
  } catch (err) {
    console.error('Error fetching kindergarten dates:', err)
    return []
  }
}

onMounted(async () => {
  const calendarEl = document.getElementById('calendar')
  if (calendarEl) {
    const events = await fetchKindergartenEvents()

    const calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, timeGridPlugin, listPlugin, bootstrap5Plugin],
      timeZone: 'UTC',
      themeSystem: 'bootstrap5',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
      },
      weekNumbers: true,
      dayMaxEvents: true,
      eventDisplay: 'block',
      events,

      // Force times to show "am/pm" instead of "a/p"
      slotLabelFormat: {
        hour: 'numeric',
        minute: '2-digit',
        meridiem: 'short' // will show "am"/"pm"
      },
      eventTimeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        meridiem: 'short' // also applies to event times
      },

      eventDidMount: function(info) {
        if (info.view.type === 'dayGridMonth') {
          info.el.style.fontSize = '0.95rem'
          info.el.style.padding = '6px'
          info.el.style.borderRadius = '4px'
          info.el.style.whiteSpace = 'normal'
          info.el.style.color = '#fff'
        }
      }
    })
    calendar.render()
  }
})

</script> -->
<script setup>
import { onMounted } from 'vue'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import bootstrap5Plugin from '@fullcalendar/bootstrap5'

async function fetchKindergartenEvents() {
  try {
    const res = await fetch('/api/kindergartens/dates')
    const data = await res.json()
    return data.events || []
  } catch (err) {
    console.error('Error fetching kindergarten dates:', err)
    return []
  }
}

onMounted(async () => {
  const calendarEl = document.getElementById('calendar')
  if (calendarEl) {
    const events = await fetchKindergartenEvents()

    const calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, timeGridPlugin, listPlugin, bootstrap5Plugin],
      timeZone: 'UTC',
      themeSystem: 'bootstrap5',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
      },
      weekNumbers: true,
      dayMaxEvents: true, // keep collapse behavior
      eventDisplay: 'block',
      events,
      // displayEventTime: false,

      slotLabelFormat: {
        hour: 'numeric',
        minute: '2-digit',
        meridiem: 'short'
      },
      eventTimeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        meridiem: 'short'
      },

      eventDidMount: function(info) {
        if (info.view.type === 'dayGridMonth') {
          info.el.style.fontSize = '0.95rem'
          info.el.style.padding = '6px'
          info.el.style.borderRadius = '4px'
          info.el.style.whiteSpace = 'normal'
          info.el.style.color = '#fff'
        }
      },

    moreLinkContent: function(args) {
      const container = document.createElement('div')
      container.style.fontSize = '0.8rem'
      container.style.textAlign = 'center'

      if (Array.isArray(args.hiddenSegs) && args.hiddenSegs.length > 0) {
        args.hiddenSegs.forEach(seg => {
          const ev = seg.event
          const nameDiv = document.createElement('div')
          // show English name or fallback to title
          nameDiv.textContent = ev.extendedProps?.ENGLISH_NAME
          nameDiv.style.backgroundColor = ev.color
          nameDiv.style.color = '#fff'
          nameDiv.style.margin = '2px 0'
          nameDiv.style.padding = '2px'
          nameDiv.style.borderRadius = '3px'
          container.appendChild(nameDiv)
        })
      } else {
        const nameDiv = document.createElement('div')

        // Try to get the first event segment for that day
        const firstSeg = args.segs && args.segs.length > 0 ? args.segs[0] : null
        const ev = firstSeg ? firstSeg.event : null

        if (ev) {
          // ✅ Show the kindergarten name instead of "+n more"
          nameDiv.textContent = `${ev.extendedProps.ENGLISH_NAME} (+${args.num} more)`
          // ✅ Use the event’s backgroundColor (mapped from your "color" field)
          nameDiv.style.backgroundColor = ev.backgroundColor || '#007bff'
        } else {
          // fallback if no event found at all
          nameDiv.textContent = `+${args.num} more`
          nameDiv.style.backgroundColor = '#007bff'
        }

        nameDiv.style.color = '#fff'
        nameDiv.style.padding = '2px 4px'
        nameDiv.style.borderRadius = '3px'
        nameDiv.style.fontSize = '0.8rem'
        nameDiv.style.textAlign = 'center'

        container.appendChild(nameDiv)
      }


      return { domNodes: [container] }
    },


      moreLinkClick: 'popover' // still opens popover with full list
    })
    calendar.render()
  }
})
</script>


<template>
  <div class="container">
    <!-- Carousel -->
    <div id="carouselExampleControls" class="carousel slide" data-bs-ride="carousel">
      <div class="carousel-inner">
        <div class="carousel-item active">
          <img
            class="d-block w-100"
            src="https://www.tutortime.com.hk/wp-content/uploads/2023/03/early-childhood-education.png"
            alt="Hong Kong Kindergarten Association Pre-school"
          />
        </div>
        <div class="carousel-item">
          <img
            class="d-block w-100"
            src="https://boxhill.edu.hk/wp-content/uploads/2022/08/Box-Hill-Ma-On-Shan-Campus.jpg"
            alt="Box Hill (HK) International Kindergarten & Pre-school"
          />
        </div>
        <div class="carousel-item">
          <img
            class="d-block w-100"
            src="https://kga.ywca.org.hk/uploads/images/source/IMG_E1490.JPG?key=000000000016675565703175lZZ2"
            alt="Athena Kindergarten"
          />
        </div>
      </div>
      <button
        class="carousel-control-prev"
        type="button"
        data-bs-target="#carouselExampleControls"
        data-bs-slide="prev"
      >
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Previous</span>
      </button>
      <button
        class="carousel-control-next"
        type="button"
        data-bs-target="#carouselExampleControls"
        data-bs-slide="next"
      >
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Next</span>
      </button>
    </div>

    <!-- About Us -->
    <h3 class="mt-4" style="margin-left: 1%">About Us</h3>
    <div class="container my-4">
      <div class="card shadow">
        <div class="card-body">
          <p class="card-text">
            At KinderFinder, we understand that choosing the right kindergarten is a crucial step for new parents. Our platform is dedicated to simplifying this process by providing tailored recommendations that align with your family's needs and values. Whether you're looking for a nurturing environment, specific educational philosophies, or convenient locations, KinderFinder is here to guide you. With our user-friendly interface and comprehensive database of kindergartens, we empower parents to make informed decisions, ensuring that your child embarks on a joyful and enriching learning journey. Trust KinderFinder to help you find the perfect starting point for your child's education.
          </p>
        </div>
      </div>
    </div>

    <!-- Calendar -->
    <h3 style="margin-left: 5%">Important Dates:</h3>
    <div id="calendar"></div>
  </div>
</template>

<style scoped>
/* Carousel height adjustment */
.carousel-item img {
  height: 300px;
  width: 100%;
  object-fit: cover;
}
.card {
  background-color: #f9f9f9;
}
.card-text {
  font-size: 1.1rem;
}
#calendar {
  max-width: 1100px;
  margin: 40px auto;
}

.fc-daygrid-event {
  display: block !important;
  width: 100% !important;
  box-sizing: border-box;
  font-size: 0.95rem;
  padding: 8px;
  border-radius: 4px;
  white-space: pre-line !important;
  line-height: 1.4;
  color: #fff;
}



/* Leave list view untouched */
.fc-list-event {
  font-size: inherit;
  padding: inherit;
}
</style>

