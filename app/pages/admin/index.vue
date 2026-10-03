<template>
  <div class="admin-dashboard">
    <header class="admin-dashboard__header">
      <div>
        <h1 class="admin-dashboard__title">Overview</h1>
        <p class="admin-dashboard__lede">
          {{ isAdmin ? 'All resources on the platform.' : 'Your resources.' }}
        </p>
      </div>
      <NuxtLink to="/admin/upload" class="admin-dashboard__cta">Upload resource</NuxtLink>
    </header>

    <p v-if="pending" class="admin-dashboard__state">Loading…</p>
    <p v-else-if="error" class="admin-dashboard__state admin-dashboard__state--error">
      Unable to load dashboard data.
    </p>

    <template v-else>
      <div class="stats-grid">
        <div class="stats-grid__item">
          <p class="stats-grid__label">Total resources</p>
          <p class="stats-grid__value">{{ stats.totalResources }}</p>
        </div>
        <div class="stats-grid__item">
          <p class="stats-grid__label">Published</p>
          <p class="stats-grid__value">{{ stats.published }}</p>
        </div>
        <div class="stats-grid__item">
          <p class="stats-grid__label">Drafts</p>
          <p class="stats-grid__value">{{ stats.drafts }}</p>
        </div>
        <div class="stats-grid__item">
          <p class="stats-grid__label">Archived</p>
          <p class="stats-grid__value">{{ stats.archived }}</p>
        </div>
        <div class="stats-grid__item">
          <p class="stats-grid__label">Storage used</p>
          <p class="stats-grid__value">{{ formatBytes(stats.totalBytes) }}</p>
        </div>
        <div class="stats-grid__item">
          <p class="stats-grid__label">Total downloads</p>
          <p class="stats-grid__value">{{ stats.totalDownloads }}</p>
        </div>
      </div>

      <section class="resource-table">
        <header class="resource-table__header">
          <h2 class="resource-table__title">Resources</h2>
          <div class="resource-table__filter" role="tablist" aria-label="Status filter">
            <button
              v-for="filter in statusFilters"
              :key="filter.value"
              type="button"
              role="tab"
              :aria-selected="status === filter.value"
              :class="['resource-table__filter-btn', { 'resource-table__filter-btn--active': status === filter.value }]"
              @click="status = filter.value"
            >
              {{ filter.label }}
            </button>
          </div>
        </header>

        <p v-if="filtered.length === 0" class="resource-table__empty">
          {{ emptyMessage }}
        </p>

        <div v-else class="resource-table__wrapper">
          <table class="resource-table__table">
            <thead>
              <tr>
                <th>Title</th>
                <th v-if="isAdmin">Owner</th>
                <th>Category</th>
                <th>Visibility</th>
                <th>Status</th>
                <th>Size</th>
                <th>Downloads</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filtered" :key="item.slug">
                <td class="resource-table__cell-title">
                  <NuxtLink :to="`/admin/resource/${item.slug}`" class="resource-table__link">
                    {{ item.title }}
                  </NuxtLink>
                  <span class="resource-table__slug">{{ item.slug }}</span>
                </td>
                <td v-if="isAdmin" class="resource-table__cell-owner">
                  <NuxtLink :to="`/u/${item.ownerUsername}`" class="resource-table__owner-link">
                    {{ item.ownerDisplayName }}
                  </NuxtLink>
                </td>
                <td>{{ item.category }}</td>
                <td>
                  <span :class="['badge', `badge--vis-${item.visibility}`]">{{ item.visibility }}</span>
                </td>
                <td>
                  <span :class="['badge', `badge--status-${item.status}`]">{{ item.status }}</span>
                </td>
                <td class="resource-table__cell-num">{{ formatBytes(item.size) }}</td>
                <td class="resource-table__cell-num">{{ item.downloads }}</td>
                <td class="resource-table__cell-actions">
                  <NuxtLink :to="`/admin/resource/${item.slug}`" class="resource-table__action">
                    Edit
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ResourceCategory, ResourceStatus, ResourceVisibility } from '~~/shared/resource'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

useHead({
  title: 'Dashboard',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

interface AdminResource {
  slug: string
  title: string
  category: ResourceCategory
  visibility: ResourceVisibility
  status: ResourceStatus
  size: number
  downloads: number
  ownerUsername: string
  ownerDisplayName: string
  canEdit: boolean
}

type StatusFilter = 'all' | ResourceStatus

const { isAdmin } = useTeamSession()
const status = ref<StatusFilter>('all')

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
  { value: 'archived', label: 'Archived' }
]

const { data: resourceData, pending, error } = await useFetch<{ resources: AdminResource[], scope: string }>(
  '/api/admin/resources',
  { key: 'admin-resources' }
)

const resources = computed<AdminResource[]>(() => resourceData.value?.resources ?? [])

const filtered = computed(() => {
  if (status.value === 'all') return resources.value
  return resources.value.filter(r => r.status === status.value)
})

const emptyMessage = computed(() => {
  if (resources.value.length === 0) {
    return isAdmin.value ? 'Nothing uploaded yet. Click Upload resource to begin.' : 'You have not uploaded anything yet.'
  }
  return `No ${status.value} resources.`
})

const stats = computed(() => {
  const list = resources.value
  let published = 0
  let drafts = 0
  let archived = 0
  let totalBytes = 0
  let totalDownloads = 0
  for (const record of list) {
    if (record.status === 'published') published += 1
    else if (record.status === 'draft') drafts += 1
    else if (record.status === 'archived') archived += 1
    totalBytes += Number(record.size) || 0
    totalDownloads += Number(record.downloads) || 0
  }
  return {
    totalResources: list.length,
    published,
    drafts,
    archived,
    totalBytes,
    totalDownloads
  }
})

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0
  let value = bytes
  while (value >= 1024 && index < units.length - 1) { value /= 1024; index += 1 }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}
</script>

<style lang="scss" scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  color: #f5f5f6;
}

.admin-dashboard__header {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
  justify-content: space-between;
}

.admin-dashboard__title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: clamp(1.5rem, 3vw, 2rem);
  letter-spacing: -0.025em;
  line-height: 1.15;
  margin-bottom: 0.35rem;
  color: #f5f5f6;
}

.admin-dashboard__lede {
  font-size: 0.9rem;
  color: rgba(245, 245, 246, 0.55);
}

.admin-dashboard__cta {
  display: inline-flex;
  align-items: center;
  padding: 0.7rem 1.4rem;
  font-family: var(--font-sans);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #0a0a0b;
  background-color: #f5f5f6;
  border: 1px solid #f5f5f6;
  border-radius: 8px;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.15s, border-color 0.15s;
}

.admin-dashboard__cta:hover { background-color: #ffffff; border-color: #ffffff; }
.admin-dashboard__cta:focus-visible { outline: 2px solid #f5f5f6; outline-offset: 2px; }

.admin-dashboard__state {
  padding: 2rem 0;
  text-align: center;
  color: rgba(245, 245, 246, 0.55);
  font-size: 0.9rem;
}

.admin-dashboard__state--error { color: #f87171; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  gap: 1rem;
}

.stats-grid__item {
  padding: 1.1rem 1.25rem;
  border: 1px solid rgba(245, 245, 246, 0.08);
  border-radius: 10px;
  background: rgba(245, 245, 246, 0.015);
}

.stats-grid__label {
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.35);
  margin-bottom: 0.5rem;
}

.stats-grid__value {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 1.35rem;
  letter-spacing: -0.02em;
  color: #f5f5f6;
}

.resource-table {
  border: 1px solid rgba(245, 245, 246, 0.08);
  border-radius: 12px;
  background: rgba(245, 245, 246, 0.01);
  overflow: hidden;
}

.resource-table__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.5rem;
  border-bottom: 1px solid rgba(245, 245, 246, 0.08);
}

.resource-table__title {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: -0.005em;
  color: #f5f5f6;
}

.resource-table__filter { display: flex; gap: 0.2rem; }

.resource-table__filter-btn {
  padding: 0.35rem 0.7rem;
  font-family: inherit;
  font-size: 0.72rem;
  color: rgba(245, 245, 246, 0.55);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 5px;
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s, border-color 0.15s;
}

.resource-table__filter-btn:hover { color: #f5f5f6; }
.resource-table__filter-btn:focus-visible { outline: 2px solid #f5f5f6; outline-offset: 2px; }
.resource-table__filter-btn--active {
  color: #f5f5f6;
  background: rgba(245, 245, 246, 0.06);
  border-color: rgba(245, 245, 246, 0.15);
}

.resource-table__empty {
  padding: 2.5rem 1.5rem;
  text-align: center;
  color: rgba(245, 245, 246, 0.55);
  font-size: 0.88rem;
}

.resource-table__wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }

.resource-table__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.resource-table__table th,
.resource-table__table td {
  text-align: left;
  padding: 0.8rem 1.5rem;
  border-bottom: 1px solid rgba(245, 245, 246, 0.08);
  vertical-align: middle;
  color: #f5f5f6;
}

.resource-table__table thead th {
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.35);
  background: rgba(245, 245, 246, 0.015);
}

.resource-table__table tbody tr:last-child td { border-bottom: none; }
.resource-table__table tbody tr:hover { background: rgba(245, 245, 246, 0.02); }

.resource-table__cell-title {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.resource-table__link {
  color: #f5f5f6;
  text-decoration: none;
  font-weight: 500;
}

.resource-table__link:hover { text-decoration: underline; text-underline-offset: 3px; }

.resource-table__slug {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: rgba(245, 245, 246, 0.35);
}

.resource-table__cell-owner {
  font-size: 0.82rem;
  color: rgba(245, 245, 246, 0.7);
}

.resource-table__owner-link {
  color: inherit;
  text-decoration: none;
}

.resource-table__owner-link:hover { text-decoration: underline; text-underline-offset: 3px; }

.resource-table__cell-num {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: rgba(245, 245, 246, 0.8);
  white-space: nowrap;
}

.resource-table__cell-actions { text-align: right; white-space: nowrap; }

.resource-table__action {
  color: rgba(245, 245, 246, 0.55);
  text-decoration: none;
  font-size: 0.78rem;
  transition: color 0.15s;
}

.resource-table__action:hover { color: #f5f5f6; }

.badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: 4px;
  border: 1px solid;
}

.badge--vis-general { color: #6ee7b7; border-color: rgba(110, 231, 183, 0.35); background: rgba(110, 231, 183, 0.06); }
.badge--vis-intern { color: #fb923c; border-color: rgba(251, 146, 60, 0.35); background: rgba(251, 146, 60, 0.06); }
.badge--vis-closed { color: #f87171; border-color: rgba(248, 113, 113, 0.35); background: rgba(248, 113, 113, 0.06); }

.badge--status-published { color: #6ee7b7; border-color: rgba(110, 231, 183, 0.35); }
.badge--status-draft { color: #fb923c; border-color: rgba(251, 146, 60, 0.35); }
.badge--status-archived { color: rgba(245, 245, 246, 0.35); border-color: rgba(245, 245, 246, 0.08); }
</style>