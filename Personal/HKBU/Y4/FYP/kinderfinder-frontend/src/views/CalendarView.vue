<script setup>
import { onMounted } from 'vue'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import bootstrap5Plugin from '@fullcalendar/bootstrap5'
import { jwtDecode } from "jwt-decode"


const token = localStorage.getItem('token')
const decoded = token ? jwtDecode(token) : null
const userId = decoded?._id;

async function fetchBookmarkedKindergartenEvents() {
  const token = localStorage.getItem('token')
  if (!token) {
    console.warn('No token found — user not logged in')
    return []
  }

  try {
    const res = await fetch(`/api/users/${userId}`, {
      headers: {
        // 'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('User fetch status:', res.status)

    if (!res.ok) {
      const text = await res.text()
      console.error('API error response:', text.substring(0, 300))
      return []
    }

    const user = await res.json()
    console.log('Fetched user:', user)

    const bookmarks = user.kindergartensBookmark || []
    if (bookmarks.length === 0) {
      console.log('No bookmarked kindergartens')
      return []
    }

    const events = []

    bookmarks.forEach(bookmark => {
      const kg = bookmark
      const englishName = kg.ENGLISH_NAME || 'Unknown Kindergarten'
      const chineseName = kg['中文名稱'] || ''
      const website = kg.WEBSITE || ''

      const addEvent = (dateStr, eventType, color = '#3788d8') => {
        if (dateStr) {
          const date = dateStr.split('T')[0]

          events.push({
            title: `${englishName} - ${eventType}`,
            start: `${date}T09:00:00`,
            end: `${date}T18:00:00`,
            allDay: false,
            backgroundColor: color,
            borderColor: color,
            textColor: '#fff',
            url: website ? website : undefined,
            extendedProps: {
              ENGLISH_NAME: englishName,
              CHINESE_NAME: chineseName,
              EVENT_TYPE: eventType,
              WEBSITE: website
            }
          })
        }
      }

      addEvent(kg.openday, 'Open Day', '#28a745')
      addEvent(kg.Application_Deadline, 'Application Deadline', '#dc3545')
      addEvent(kg.Interview_Date, 'Interview Date', '#ffc107')
      addEvent(kg.Results_Announcement, 'Results Announcement', '#17a2b8')
    })

    return events

  } catch (err) {
    console.error('Error fetching bookmarked dates:', err)
    return []
  }
}
onMounted(async () => {
  const calendarEl = document.getElementById('calendar')
  if (!calendarEl) return

  const events = await fetchBookmarkedKindergartenEvents()

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
    dayMaxEvents: false,
    eventDisplay: 'block',
    displayEventTime: true,
    events,

    // Open website in new tab
    eventClick: function(info) {
      if (info.event.url) {
        info.jsEvent.preventDefault()
        window.open(info.event.url, '_blank', 'noopener,noreferrer')
      }
    },

    // Custom rendering ONLY for month view
    eventContent: function(arg) {
      if (arg.view.type === 'dayGridMonth') {
        const p = arg.event.extendedProps

        return {
          html: `
            <div class="custom-event ${p.WEBSITE ? 'clickable-event' : ''}">
              <div class="event-time">9:00 AM - 6:00 PM</div>
              <div class="event-name">${p.ENGLISH_NAME || 'Unknown'}</div>
              ${p.CHINESE_NAME ? `<div class="event-chinese">(${p.CHINESE_NAME})</div>` : ''}
              <div class="event-type">${p.EVENT_TYPE || ''}</div>
            </div>
          `
        }
      }
      // For list, week, day views — use default rendering (supports url clicking!)
      return true
    }
  })

  calendar.render()
})
</script>

<template>
  <h3 style="margin-left: 5%; margin-top: 2%;">Important Dates (Bookmarked Kindergartens):</h3>
  <div id="calendar"></div>
</template>

<style scoped>
#calendar {
  max-width: 1100px;
  margin: 40px auto;
}

/* Critical: Make day cells grow taller */
.fc-daygrid-day-frame {
  min-height: 100px !important;
  height: auto !important;
}

.fc-daygrid-day {
  height: auto !important;
}

/* Event block — allow height to grow */
.fc-daygrid-event {
  width: 100% !important;
  height: auto !important;
  min-height: 80px !important;
  padding: 5px 6px !important;
  border-radius: 4px;
  overflow: visible !important;
  color: #fff;
  font-size: 0.82rem;
  box-sizing: border-box;
}

/* Custom content */
.custom-event-content {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  height: 100%;
}

.event-time {
  font-size: 0.72rem;
  font-weight: bold;
  opacity: 0.95;
  margin-bottom: 4px;
  white-space: nowrap;
}

.event-name {
  font-weight: bold;
  font-size: 0.82rem;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  line-height: 1.2;
  margin-bottom: 3px;
}

.event-chinese {
  font-size: 0.76rem;
  opacity: 0.9;
  margin-bottom: 3px;
  white-space: nowrap;
}

.event-type {
  font-size: 0.78rem;
  font-weight: 500;
}

/* Hide default time */
.fc-daygrid-event .fc-event-time {
  display: none !important;
}
</style>