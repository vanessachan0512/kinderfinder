<script setup>
import { ref, onMounted } from 'vue'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import bootstrap5Plugin from '@fullcalendar/bootstrap5'
import { jwtDecode } from "jwt-decode"
import { useI18n } from 'vue-i18n'; // ← ADD THIS

const { t } = useI18n(); // ← ADD THIS LINE

const token = localStorage.getItem('token')
const decoded = token ? jwtDecode(token) : null
const userId = decoded?._id

const calendarApi = ref(null)

// Modal state
const showModal = ref(false)
const isAddMode = ref(false)  // true = add new custom event, false = edit note
const modalEvent = ref(null)  // FullCalendar event object
const modalEventKey = ref('') // For kindergarten events (eventKey)
const modalTitle = ref('')
const modalRemark = ref('')
const modalFinished = ref(false)
const modalDate = ref('')
const modalStartTime = ref('')
const modalEndTime = ref('')
const modalEventColor = ref('#6f42c1')  // default purple color
// Reactive state
const isLoading = ref(true)

function closeModal() {
  showModal.value = false
  // Optional: reset form when closing
  modalTitle.value = ''
  modalRemark.value = ''
  modalFinished.value = false
  modalStartTime.value = ''
  modalEndTime.value = ''
  modalEventColor.value = '#6f42c1'
}

function openAddPersonalEvent() {
  isAddMode.value = true
  modalEvent.value = null

  // reset fields
  modalTitle.value = ''
  modalStartTime.value = ''
  modalEndTime.value = ''
  modalEventColor.value = '#6f42c1'
  modalRemark.value = ''
  modalFinished.value = false

  showModal.value = true
}

function openEventNote(event) {
  isAddMode.value = false   // ✅ reset here
  modalEvent.value = event

  // populate fields from event
  modalTitle.value = event.title
  modalRemark.value = event.extendedProps?.remark || ''
  modalFinished.value = event.extendedProps?.finished || false
  modalStartTime.value = event.startStr || ''
  modalEndTime.value = event.endStr || ''
  modalEventColor.value = event.backgroundColor || '#3788d8'

  showModal.value = true
}

async function fetchAllEvents() {
  isLoading.value = true;

  if (!token) {
    console.warn('No token — user not logged in');
    isLoading.value = false;
    return [];
  }

  try {
    const res = await fetch(`/api/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('Failed to fetch user data:', res.status);
      isLoading.value = false;
      return [];
    }

    const user = await res.json();
    const bookmarks = user.kindergartensBookmark || [];
    const customEvents = user.customEvents || [];
    const events = [];

    // ==================================================================
    // 1. Process Bookmarked Kindergarten Events
    // ==================================================================
    bookmarks.forEach(kg => {
      const englishName = kg.ENGLISH_NAME || 'Unknown Kindergarten';
      const chineseName = kg['中文名稱'] || '';
      const website = kg.WEBSITE || '';
      const kindergartenId = kg.id?.toString();

      // Helper to create a kindergarten event
      const createKgEvent = (eventData, eventTypeKey, defaultColor) => {
        if (!eventData || !eventData.start) return;

        // Use custom time from note if available, otherwise use eventData.start/end
        const note = eventData.note || {};
        const start = note.start || eventData.start;
        const end = note.end || eventData.end;

        const isFinished = note.finished || false;
        const color = isFinished ? '#28a745' : defaultColor;

        events.push({
          title: `${englishName} - ${t(eventTypeKey)}`,
          start,
          end,
          allDay: false,
          backgroundColor: color,
          borderColor: color,
          textColor: '#fff',
          extendedProps: {
            type: 'kindergarten',
            ENGLISH_NAME: englishName,
            CHINESE_NAME: chineseName,
            EVENT_TYPE_KEY: eventTypeKey,        // keep key for later use if needed
            EVENT_TYPE: t(eventTypeKey),
            WEBSITE: website,
            kindergartenId,
            id: kindergartenId,
            remark: note.remark || '',
            finished: isFinished,
          },
          classNames: isFinished ? ['event-finished'] : [],
        });
      };

      // === NEW STRUCTURE: kg.events.{openday, ...}.note ===
      if (kg.events) {
        createKgEvent(kg.events.openday, 'openDay', '#3788d8');
        createKgEvent(kg.events.Application_Deadline, 'applicationDeadline', '#dc3545');
        createKgEvent(kg.events.Interview_Date, 'interviewDate', '#ffc107');
        createKgEvent(kg.events.Results_Announcement, 'resultsAnnouncement', '#17a2b8');
      }
      // === LEGACY SUPPORT (remove later when all data migrated) ===
      else if (kg.openday || kg.Application_Deadline || kg.Interview_Date || kg.Results_Announcement) {
        console.warn('Legacy kindergarten format detected (will be removed soon):', kg);

        const legacyAdd = (dateStr, typeKey, note, color) => {
          if (!dateStr) return;
          const dateOnly = dateStr.split('T')[0];
          const start = note?.start || `${dateOnly}T09:00:00`;
          const end = note?.end || `${dateOnly}T18:00:00`;

          const isFinished = note?.finished || false;
          const bgColor = isFinished ? '#28a745' : color;

          events.push({
            title: `${englishName} - ${t(typeKey)}`,
            start,
            end,
            allDay: false,
            backgroundColor: bgColor,
            borderColor: bgColor,
            textColor: '#fff',
            extendedProps: {
              type: 'kindergarten',
              ENGLISH_NAME: englishName,
              CHINESE_NAME: chineseName,
              EVENT_TYPE_KEY: typeKey,
              EVENT_TYPE: t(typeKey),
              WEBSITE: website,
              kindergartenId,
              id: kindergartenId,
              remark: note?.remark || '',
              finished: isFinished,
            },
            classNames: isFinished ? ['event-finished'] : [],
          });
        };

        legacyAdd(kg.openday, 'openDay', kg.opendayNote, '#3788d8');
        legacyAdd(kg.Application_Deadline, 'applicationDeadline', kg.Application_DeadlineNote, '#dc3545');
        legacyAdd(kg.Interview_Date, 'interviewDate', kg.Interview_DateNote, '#ffc107');
        legacyAdd(kg.Results_Announcement,'resultsAnnouncement', kg.Results_AnnouncementNote, '#17a2b8');
      }
    });

    // ==================================================================
    // 2. Process Custom Personal Events
    // ==================================================================
    customEvents.forEach(ev => {
      if (!ev.start) {
        console.warn('Skipping custom event without start date:', ev);
        return;
      }

      const isFinished = ev.finished || false;
      const color = isFinished ? '#28a745' : (ev.color || '#6f42c1');

      events.push({
        id: ev._id?.toString(),
        title: ev.title || 'Untitled Event',
        start: ev.start,
        end: ev.end || undefined,
        allDay: false,
        backgroundColor: color,
        borderColor: color,
        textColor: '#fff',
        extendedProps: {
          type: 'custom',
          remark: ev.remark || '',
          finished: isFinished,
        },
        classNames: isFinished ? ['event-finished'] : [],
      });
    });

    console.log(`Loaded ${events.length} events (${customEvents.length} custom + ${bookmarks.length} kindergartens)`);
    return events;

  } catch (err) {
    console.error('Error fetching events:', err);
    alert('Failed to load calendar data. Please try refreshing the page.');
    return [];
  } finally {
    isLoading.value = false;
  }
}

// Save note for kindergarten event OR custom event
async function saveEventNote() {
  // === 1. Validate inputs first ===
  const isCustomEvent = isAddMode.value || modalEvent.value?.extendedProps.type === 'custom';

  if (isCustomEvent) {
    if (!modalTitle.value || !modalStartTime.value) {
      alert('Title and start time are required');
      return;
    }
  } else {
    // Kindergarten event
    if (!modalEvent.value) {
      alert('No event selected');
      return;
    }
    const props = modalEvent.value.extendedProps;
    if (!props.kindergartenId && !props.id) {
      alert('Cannot identify kindergarten. Please refresh.');
      return;
    }
  }

  // === 2. Build payload ===
  let payload = {
    remark: modalRemark.value || '',
    finished: modalFinished.value || false
  };

  let url = '';
  let method = 'POST';

  if (isCustomEvent) {
    payload.title = modalTitle.value;
    payload.start = modalStartTime.value || null;
    payload.end = modalEndTime.value || null;
    payload.color = modalEventColor.value || '#6f42c1';

    if (modalEvent.value && modalEvent.value.id) {
      url = `/api/users/${userId}/custom-event/${modalEvent.value.id}`;
      method = 'PATCH';
    } else {
      url = `/api/users/${userId}/event-note`;
    }
  } else {
    const props = modalEvent.value.extendedProps;
    payload.kindergartenId = props.kindergartenId || props.id;
    payload.eventType = props.EVENT_TYPE;

    if (modalStartTime.value) payload.start = modalStartTime.value;
    if (modalEndTime.value) payload.end = modalEndTime.value;

    url = `/api/users/${userId}/event-note`;
  }

  // === 3. Optimistically update the calendar UI immediately ===
  let newEventAdded = null; // To track if we added a new event (for rollback if needed)

  if (isCustomEvent) {
    if (isAddMode.value) {
      // Adding new custom event
      const newEventObj = {
        id: 'temp-' + Date.now(), // temporary ID
        title: payload.title,
        start: payload.start ? payload.start + ':00' : null,
        end: payload.end ? payload.end + ':00' : undefined,
        backgroundColor: payload.finished ? '#28a745' : payload.color,
        borderColor: payload.finished ? '#28a745' : payload.color,
        textColor: '#fff',
        extendedProps: {
          type: 'custom',
          remark: payload.remark,
          finished: payload.finished
        },
        classNames: payload.finished ? ['event-finished'] : []
      };

      newEventAdded = calendarApi.value.addEvent(newEventObj);
    } else if (modalEvent.value) {
      // Updating existing custom event
      modalEvent.value.setProp('title', payload.title);
      if (payload.start) modalEvent.value.setStart(payload.start + ':00');
      if (payload.end) modalEvent.value.setEnd(payload.end + ':00');

      const displayColor = payload.finished ? '#28a745' : payload.color;
      modalEvent.value.setProp('backgroundColor', displayColor);
      modalEvent.value.setProp('borderColor', displayColor);

      modalEvent.value.setExtendedProp('remark', payload.remark);
      modalEvent.value.setExtendedProp('finished', payload.finished);

      let classNames = modalEvent.value.classNames?.filter(c => c !== 'event-finished') || [];
      if (payload.finished) classNames.push('event-finished');
      modalEvent.value.setProp('classNames', classNames);
    }
  } else if (modalEvent.value) {
    // Updating kindergarten event
    const isFinished = payload.finished;
    const bgColor = isFinished ? '#28a745' : '#3788d8';

    modalEvent.value.setExtendedProp('remark', payload.remark);
    modalEvent.value.setExtendedProp('finished', isFinished);

    if (payload.start) modalEvent.value.setStart(payload.start + ':00');
    if (payload.end) modalEvent.value.setEnd(payload.end + ':00');

    modalEvent.value.setProp('backgroundColor', bgColor);
    modalEvent.value.setProp('borderColor', bgColor);
    modalEvent.value.setProp('textColor', '#fff');

    let classNames = modalEvent.value.classNames?.filter(c => c !== 'event-finished') || [];
    if (isFinished) classNames.push('event-finished');
    modalEvent.value.setProp('classNames', classNames);
  }

  // Close modal and give instant feedback
  showModal.value = false;
  alert(isAddMode.value ? 'Event added!' : 'Changes saved!');

  // === 4. Now send to backend ===
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Save failed');
    }

    const data = await res.json();

    // === 5. Sync backend response (especially for new events) ===
    if (isAddMode.value && data.event?._id && newEventAdded) {
      // Replace temporary event with real one from server
      newEventAdded.remove();
      calendarApi.value.addEvent({
        id: data.event._id,
        title: payload.title,
        start: payload.start ? payload.start + ':00' : null,
        end: payload.end ? payload.end + ':00' : undefined,
        backgroundColor: payload.finished ? '#28a745' : payload.color,
        borderColor: payload.finished ? '#28a745' : payload.color,
        textColor: '#fff',
        extendedProps: {
          type: 'custom',
          remark: payload.remark,
          finished: payload.finished
        },
        classNames: payload.finished ? ['event-finished'] : []
      });
    }

    // Success — UI already updated
  } catch (err) {
    console.error('Backend save failed:', err);
    alert('Failed to save on server. Your changes may not be permanent.\nPlease refresh and try again.');

    // Optional: refetch all events to restore correct state
    // await refetchEvents();
  }
}

async function deleteCustomEvent() {
  if (!confirm('Permanently delete this personal event?')) return;

  const eventId = modalEvent.value?.id;
  if (!eventId) return alert('Error: Event ID missing');

  // 1. Optimistically remove from calendar immediately
  const eventToRemove = modalEvent.value;
  eventToRemove.remove();
  showModal.value = false;
  alert('Event deleted'); // Instant feedback

  try {
    const res = await fetch(`/api/users/${userId}/custom-event/${eventId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(await res.text());

    // Success: already removed from UI, nothing to do
  } catch (err) {
    // 2. Backend failed → alert and optionally refetch events
    alert('Failed to delete on server. The event may still exist.\nPlease refresh and try again.');

    // Optional: Refetch all events to restore correct state
    // await refetchEvents();
  }
}

async function deleteSingleKindergartenEvent() {
  if (!confirm('Delete only this event (e.g., Open Day) from the bookmark? The kindergarten will stay bookmarked.')) return;

  const kindergartenId = modalEvent.value.extendedProps.kindergartenId;
  const eventType = modalEvent.value.extendedProps.EVENT_TYPE;

  if (!kindergartenId || !eventType) return alert('Missing event info');

  // 1. Optimistically remove this specific event from UI
  const eventToRemove = modalEvent.value;
  eventToRemove.remove();
  showModal.value = false;
  alert('Event removed from bookmark');

  try {
    const res = await fetch(`/api/users/${userId}/kindergarten-event`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ kindergartenId, eventType })
    });

    if (!res.ok) throw new Error(await res.text());

    // Success: already removed
  } catch (err) {
    alert('Failed to remove on server. Please refresh to see correct state.');
    // await refetchEvents();
  }
}

async function unbookmarkKindergarten() {
  if (!confirm('Remove this entire kindergarten from bookmarks? All events and notes will be lost.')) return;

  const kindergartenId = modalEvent.value.extendedProps.kindergartenId;
  if (!kindergartenId) return alert('Missing kindergarten ID');

  // 1. Optimistically remove ALL events for this kindergarten
  const eventsToRemove = calendarApi.value.getEvents().filter(
    event => event.extendedProps?.kindergartenId === kindergartenId
  );

  eventsToRemove.forEach(event => event.remove());

  showModal.value = false;
  alert('Kindergarten removed from bookmarks');

  try {
    const res = await fetch(`/api/users/${userId}/bookmark`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ kindergartenId })
    });

    if (!res.ok) throw new Error(await res.text());

    // Success: already cleared from UI
  } catch (err) {
    alert('Failed to remove bookmark on server. Please refresh the page.');
    // await refetchEvents(); // Restore correct state if needed
  }
}

onMounted(async () => {
  const calendarEl = document.getElementById('calendar')
  if (!calendarEl) return

  const events = await fetchAllEvents()

  const calendar = new Calendar(calendarEl, {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, bootstrap5Plugin],
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
    displayEventTime: false,  // Hide default time everywhere
    events,

    eventClick: function(info) {
      openEventNote(info.event)
      modalEvent.value = info.event
      modalTitle.value = info.event.title
      modalRemark.value = info.event.extendedProps?.remark || ''
      modalFinished.value = info.event.extendedProps?.finished || false

      const formatDateTime = (date) => {
        if (!date) return ''
        const d = new Date(date)
        return d.toISOString().slice(0, 16)
      }

      modalStartTime.value = formatDateTime(info.event.start)
      modalEndTime.value = formatDateTime(info.event.end)

      isAddMode.value = false
      showModal.value = true
    },

    dateClick: function(info) {
      isAddMode.value = true
      modalEvent.value = null
      modalTitle.value = ''
      modalRemark.value = ''
      modalFinished.value = false
      modalStartTime.value = info.dateStr + 'T09:00'
      modalEndTime.value = info.dateStr + 'T18:00'
      showModal.value = true
    },

    eventContent: function(arg) {
      // Apply custom rendering to ALL views: month, week, day, list
      const p = arg.event.extendedProps
      const isFinished = p.finished || false

      // Extract exact stored time (09:00 → 9:00 AM)
      const extractTime = (dateStr) => {
        if (!dateStr) return ''
        const time = dateStr.split('T')[1]?.slice(0, 5) || ''
        if (!time) return ''
        const [h, m] = time.split(':')
        let hour = parseInt(h)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        hour = hour % 12 || 12
        return `${hour}:${m} ${ampm}`
      }

      const startTime = extractTime(arg.event.startStr)
      const endTime = extractTime(arg.event.endStr)
      const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : startTime || ''

      const htmlContent = p.type === 'custom'
        ? `
          <div class="custom-event ${isFinished ? 'event-finished' : ''}">
            ${isFinished ? '<i class="fas fa-check event-tick"></i> Done' : ''}
           <div class="d-flex align-items-center mb-1">
            <i class="bi bi-clock me-1"></i>
            <span class="text-truncate">${timeRange}</span>
            </div>
            <div class="event-name fw-bold">${arg.event.title || ''}</div>
            ${p.remark ? `<div class="event-remark small">${p.remark}</div>` : ''}
          </div>
          `
        : `
          <div class="custom-event ${isFinished ? 'event-finished' : ''}">
            ${isFinished ? '<i class="fas fa-check event-tick"></i> Done' : ''}
            <div class="d-flex align-items-center mb-1">
            <i class="bi bi-clock me-1"></i>
            <span class="text-truncate">${timeRange}</span>
            </div>
            <div class="event-name fw-bold">${p.ENGLISH_NAME || arg.event.title}</div>
            ${p.CHINESE_NAME ? `<div class="event-chinese small">(${p.CHINESE_NAME})</div>` : ''}
            <div class="event-type fw-bold">${p.EVENT_TYPE || ''}</div>
            
            ${p.WEBSITE ? `
            <div class="event-website mt-1 small">
              <i class="fas fa-globe me-1"></i>
              <a href="${p.WEBSITE}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
                ${p.WEBSITE.replace(/^https?:\/\//, '')}
                <i class="fas fa-external-link-alt ms-1"></i>
              </a>
            </div>` : ''}
          </div>
          `

      // Use this for ALL views
      return { html: htmlContent }
    }
  })

  calendarApi.value = calendar
  calendar.render()
})
</script>

<template>
     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <!-- Main Calendar Section -->
<div class="container py-4 py-lg-5 px-lg-4 mx-auto" style="max-width: 1600px;">
    <!-- Header Card -->
    <div class="card border-0 shadow-sm mb-4 rounded-3 overflow-hidden">
      <div class="card-header bg-gradient-primary text-white py-4">
        <div class="row align-items-center gx-4">
          <div class="col">
            <h2 class="mb-1 fw-bold d-flex align-items-center gap-3">
              <i class="bi bi-calendar3 fs-2"></i>
              {{ $t('myScheduleAndImportantDates') }}
            </h2>
            <p class="mb-0 opacity-90">
              {{ $t('personalEventsBookmarked') }}
            </p>
          </div>
          <div class="col-auto">
            <button
              @click="openAddPersonalEvent"
              class="btn btn-light shadow-sm fw-semibold d-flex align-items-center gap-2 px-4 py-2"
              :disabled="isLoading"
            >
              <i class="bi bi-plus-circle"></i>
              {{ $t('addEvent') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar Card with Loading State -->
    <div class="card border-0 shadow rounded-3 overflow-hidden">
      <div class="card-body p-0 position-relative">
        <!-- Loading Overlay -->
        <div
          v-if="isLoading"
          class="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-white bg-opacity-90 z-10 rounded-3"
        >
          <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">{{ $t('loading') }}</span>
          </div>
          <p class="fs-5 text-muted fw-medium mb-0">{{ $t('loadingYourCalendar') }}</p>
          <small class="text-muted mt-2">{{ $t('fetchingEventsAndBookmarks') }}</small>
        </div>

        <!-- FullCalendar container -->
        <div id="calendar" class="fc fc-theme-standard"></div>
      </div>
    </div>
</div>

<div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.6);">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content shadow-lg border-0">
      <div class="modal-header border-0 pb-2">
        <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
          <i class="bi bi-calendar-event"></i>
          {{ isAddMode ? $t('addPersonalEvent') : $t('eventDetailsAndNote') }}
        </h5>
        <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
      </div>

      <div class="modal-body pt-2">
        <!-- Custom / Add Mode Section -->
        <template v-if="isAddMode || (modalEvent && modalEvent.extendedProps.type === 'custom')">
          <div class="bg-light rounded-3 p-4 mb-4">
            <h6 class="fw-semibold text-primary mb-3">
              <i class="bi bi-pencil-square me-2"></i>{{ $t('eventDetails') }}
            </h6>

            <div class="row g-3 mb-3">
              <div class="col-12 col-md-6">
                <label class="form-label fw-medium">{{ $t('startDateTime') }}<span class="text-danger">*</span></label>
                <input v-model="modalStartTime" type="datetime-local" class="form-control" required />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label fw-medium">{{ $t('endDateTime') }}</label>
                <input v-model="modalEndTime" type="datetime-local" class="form-control" />
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label fw-medium">{{ $t('title') }} <span class="text-danger">*</span></label>
              <input v-model="modalTitle" type="text" class="form-control" :placeholder="$t('title') + ' (e.g., Doctor appointment, Birthday party)'" :required="isAddMode" />
            </div>

            <div class="mb-3">
              <label class="form-label fw-medium d-block">{{ $t('eventColor') }}</label>
              <div class="d-flex align-items-center gap-3">
                <input v-model="modalEventColor" type="color" class="form-control form-control-color" style="width: 64px; height: 48px;" />
                <span class="font-monospace text-muted small">{{ (modalEventColor || '#6F42C1').toUpperCase() }}</span>
                <small class="text-muted ms-auto">{{ $t('chooseColor') }}</small>
              </div>
            </div>
          </div>
        </template>

        <!-- Kindergarten Event (Time adjustable) -->
        <div v-else class="alert alert-info border-0 rounded-3 p-4 mb-4">
          <h6 class="fw-bold text-primary mb-3 d-flex align-items-center gap-2">
            <i class="bi bi-building"></i> {{ $t('bookmarkedKindergartenEvent') }}
          </h6>
          <p class="fs-5 fw-semibold mb-3 text-dark">{{ modalTitle }}</p>

          <div class="row g-3 mb-3">
            <div class="col-12 col-md-6">
              <label class="form-label fw-medium">{{ $t('displayedStartTime') }}</label>
              <input v-model="modalStartTime" type="datetime-local" class="form-control" />
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label fw-medium">{{ $t('displayedEndTime') }}</label>
              <input v-model="modalEndTime" type="datetime-local" class="form-control" />
            </div>
          </div>

          <small class="text-muted d-block">
            {{ $t('adjustTimeNote') }}<br>
          </small>
        </div>

        <!-- Common Section: Remark & Finished -->
        <div class="bg-light rounded-3 p-4">
          <h6 class="fw-semibold text-primary mb-3">
            <i class="bi bi-journal-text me-2"></i>{{ $t('personalNote') }}
          </h6>

          <div class="mb-3">
            <label class="form-label fw-medium">{{ $t('remarkNote') }}</label>
            <textarea
              v-model="modalRemark"
              class="form-control"
              rows="5"
              :placeholder="$t('notePlaceholder')"
            ></textarea>
          </div>

          <div class="form-check form-switch">
            <input v-model="modalFinished" class="form-check-input" type="checkbox" id="finished" style="width: 3em; height: 1.5em;">
            <label class="form-check-label fw-medium" style="margin-left:1%" for="finished">
              {{ $t('markAsFinished') }}
              <span class="text-success ms-2" v-if="modalFinished">{{ $t('done') }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer border-0 pt-3 d-flex justify-content-between align-items-center">
        <!-- Left: Delete Actions -->
        <div class="d-flex gap-2 flex-wrap">
          <!-- Custom Event Delete -->
          <button
            v-if="!isAddMode && modalEvent && modalEvent.extendedProps.type === 'custom'"
            type="button"
            class="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
            @click="deleteCustomEvent"
          >
            <i class="bi bi-trash"></i>{{ $t('deleteEvent') }}
          </button>

          <!-- Kindergarten Event Actions -->
          <template v-if="!isAddMode && modalEvent && modalEvent.extendedProps.type === 'kindergarten'">
            <button
              type="button"
              class="btn btn-outline-danger btn-sm"
              @click="deleteSingleKindergartenEvent"
            >
              {{ $t('deleteThisInstance') }}
            </button>
            <button
              type="button"
              class="btn btn-danger btn-sm d-flex align-items-center gap-1"
              @click="unbookmarkKindergarten"
            >
              <i class="bi bi-bookmark-x"></i> {{ $t('removeWholeBookmark') }}
            </button>
          </template>
        </div>

        <!-- Right: Cancel & Save -->
        <div class="d-flex gap-2">
          <button
            type="button"
            class="btn btn-primary px-4 d-flex align-items-center gap-2"
            @click="saveEventNote"
          >
            <i class="bi bi-check-lg"></i>
            {{ isAddMode ? $t('addEvent') : $t('saveChanges') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<style scoped>
.bg-gradient-primary {
  background: linear-gradient(135deg, #51c3a2, #40d9ad) !important;
}

/* Improve FullCalendar appearance */
#calendar {
  width: 100% !important;
  min-height: 500px;
  font-family: system-ui, -apple-system, sans-serif;
}

.fc-daygrid-day-frame {
  min-height: 100px !important;
}

.fc-daygrid-event {
  min-height: 80px !important;
  padding: 5px 6px !important;
}

.custom-event {
  position: relative;
  font-size: 0.82rem;
}

.event-finished {
  opacity: 0.8;
  text-decoration: line-through;
}

.event-tick {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 1.2rem;
  color: #fff;
  background: rgba(0,0,0,0.4);
  border-radius: 50%;
  padding: 2px 6px;
}

.fc-daygrid-event .fc-event-time {
  display: none !important;
}
.custom-container {
  padding-left: 10rem;  
  padding-right: 10rem;
}
.event-tick {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;          /* circle size */
  height: 20px;
  border-radius: 50%;   /* makes it round */
  background-color: #28a745; /* Bootstrap green */
  color: #fff;          /* white tick */
  font-size: 12px;      /* adjust tick size */
  margin-right: 6px;    /* spacing before text */
}

</style>