<template>
  <div class="invites">
    <header class="invites__header">
      <h1 class="invites__title">Invites</h1>
      <p class="invites__lede">Generate one-time tokens for new team members. Tokens expire after a short window.</p>
    </header>

    <section class="creator">
      <h2 class="creator__title">Create invite</h2>

      <div class="creator__form">
        <div class="creator__row">
          <div class="creator__field">
            <span class="creator__label">Role</span>
            <CustomSelect
              :model-value="role"
              :options="roleOptions"
              :disabled="creating"
              @update:model-value="(v) => { role = v as 'admin' | 'member' }"
            />
          </div>

          <div class="creator__field">
            <span class="creator__label">Expires in</span>
            <CustomSelect
              :model-value="String(ttlSeconds)"
              :options="ttlOptions"
              :disabled="creating"
              @update:model-value="(v) => { ttlSeconds = Number(v) }"
            />
          </div>

          <div class="creator__field">
            <span class="creator__label">Uses</span>
            <CustomSelect
              :model-value="String(uses)"
              :options="useOptions"
              :disabled="creating"
              @update:model-value="(v) => { uses = Number(v) }"
            />
          </div>
        </div>

        <div class="creator__field creator__field--full">
          <label class="creator__label" for="invite-note">Note (optional)</label>
          <input
            id="invite-note"
            v-model="note"
            type="text"
            maxlength="200"
            class="creator__input"
            :disabled="creating"
            placeholder="e.g. Alice – dev team"
          >
        </div>

        <button type="button" class="creator__submit" :disabled="creating" @click="create">
          {{ creating ? 'Generating…' : 'Generate token' }}
        </button>
      </div>

      <div v-if="created" class="token">
        <p class="token__label">Invite token — copy now, shown once</p>
        <div class="token__row">
          <code class="token__value">{{ created.token }}</code>
          <button type="button" class="token__copy" @click="copyToken">
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <p class="token__meta">
          Role <strong>{{ created.role }}</strong> · expires
          <strong>{{ formatRelative(created.expiresAt) }}</strong> · uses
          <strong>{{ created.uses }}</strong>
        </p>
        <button type="button" class="token__dismiss" @click="created = null">Dismiss</button>
      </div>

      <p v-if="errorMessage" class="creator__error">{{ errorMessage }}</p>
    </section>

    <section class="history">
      <h2 class="history__title">Recent invites</h2>
      <p v-if="pending" class="state">Loading…</p>
      <p v-else-if="invites.length === 0" class="state">No invites yet.</p>
      <table v-else class="history__table">
        <thead>
          <tr>
            <th>Created</th>
            <th>By</th>
            <th>Role</th>
            <th>Expires</th>
            <th>Uses left</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="invite in invites" :key="invite.hash">
            <td>{{ formatShort(invite.createdAt) }}</td>
            <td>{{ invite.createdBy }}</td>
            <td>{{ invite.role }}</td>
            <td>{{ formatRelative(invite.expiresAt) }}</td>
            <td>{{ invite.usesRemaining }} / {{ invite.totalUses }}</td>
            <td>
              <span :class="['badge', `badge--${inviteState(invite)}`]">{{ inviteState(invite) }}</span>
            </td>
            <td class="history__cell-action">
              <button
                v-if="inviteState(invite) === 'active'"
                type="button"
                class="history__revoke"
                @click="revoke(invite.hash)"
              >
                Revoke
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import CustomSelect from '~/components/ui/CustomSelect.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

useHead({ title: 'Invites', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

interface InviteListEntry {
  hash: string
  role: 'admin' | 'member'
  createdBy: string
  createdAt: string
  expiresAt: string
  usesRemaining: number
  totalUses: number
  note: string
  consumedBy: string[]
  revoked: boolean
}

const { data, pending, refresh } = await useFetch<{ invites: InviteListEntry[] }>('/api/admin/invites', {
  key: 'admin-invites'
})

const invites = computed(() => data.value?.invites ?? [])

const role = ref<'admin' | 'member'>('member')
const ttlSeconds = ref(900)
const uses = ref(1)
const note = ref('')
const creating = ref(false)
const created = ref<{ token: string; role: string; expiresAt: string; uses: number } | null>(null)
const copied = ref(false)
const errorMessage = ref('')

const roleOptions = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' }
]

const ttlOptions = [
  { value: '300', label: '5 minutes' },
  { value: '900', label: '15 minutes' },
  { value: '1800', label: '30 minutes' },
  { value: '3600', label: '1 hour' }
]

const useOptions = [
  { value: '1', label: '1 use' },
  { value: '2', label: '2 uses' },
  { value: '3', label: '3 uses' },
  { value: '5', label: '5 uses' }
]

async function create(): Promise<void> {
  if (creating.value) return
  creating.value = true
  errorMessage.value = ''
  created.value = null

  try {
    const result = await $fetch<{ token: string; role: string; expiresAt: string; uses: number }>(
      '/api/admin/invites',
      {
        method: 'POST',
        body: {
          role: role.value,
          ttlSeconds: ttlSeconds.value,
          uses: uses.value,
          note: note.value
        }
      }
    )
    created.value = result
    note.value = ''
    await refresh()
  } catch {
    errorMessage.value = 'Could not create invite.'
  } finally {
    creating.value = false
  }
}

async function copyToken(): Promise<void> {
  if (!created.value) return
  try {
    await navigator.clipboard.writeText(created.value.token)
    copied.value = true
    window.setTimeout(() => { copied.value = false }, 2000)
  } catch {
    copied.value = false
  }
}

async function revoke(hash: string): Promise<void> {
  try {
    await $fetch(`/api/admin/invites/${hash}`, { method: 'DELETE' })
    await refresh()
  } catch {
    errorMessage.value = 'Could not revoke invite.'
  }
}

type InviteState = 'active' | 'expired' | 'exhausted' | 'revoked'

function inviteState(invite: InviteListEntry): InviteState {
  if (invite.revoked) return 'revoked'
  if (new Date(invite.expiresAt).getTime() < Date.now()) return 'expired'
  if (invite.usesRemaining <= 0) return 'exhausted'
  return 'active'
}

function formatShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatRelative(iso: string): string {
  const target = new Date(iso).getTime()
  if (!Number.isFinite(target)) return '—'
  const diff = target - Date.now()
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60000)
  if (mins < 60) return diff > 0 ? `in ${mins}m` : `${mins}m ago`
  const hours = Math.round(mins / 60)
  return diff > 0 ? `in ${hours}h` : `${hours}h ago`
}
</script>

<style lang="scss" scoped>
.invites {
  max-width: 56rem;
}

.invites__header {
  margin-bottom: 2.5rem;
}

.invites__title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: clamp(1.5rem, 3vw, 2rem);
  letter-spacing: -0.025em;
  line-height: 1.15;
  margin-bottom: 0.4rem;
  color: #f5f5f6;
}

.invites__lede {
  font-size: 0.9rem;
  color: rgba(245, 245, 246, 0.55);
}

.creator {
  padding: 1.5rem;
  border: 1px solid rgba(245, 245, 246, 0.08);
  border-radius: 12px;
  background: rgba(245, 245, 246, 0.015);
  margin-bottom: 3rem;
}

.creator__title {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 1.25rem;
  color: #f5f5f6;
}

.creator__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.creator__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  gap: 1rem;
}

.creator__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}

.creator__field--full {
  grid-column: 1 / -1;
}

.creator__label {
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.35);
}

.creator__input {
  padding: 0.7rem 0.9rem;
  font-family: var(--font-sans);
  font-size: 0.88rem;
  color: #f5f5f6;
  background: rgba(245, 245, 246, 0.03);
  border: 1px solid rgba(245, 245, 246, 0.08);
  border-radius: 8px;
  transition: border-color 0.15s;
}

.creator__input::placeholder {
  color: rgba(245, 245, 246, 0.35);
}

.creator__input:hover:not(:disabled) {
  border-color: rgba(245, 245, 246, 0.15);
}

.creator__input:focus {
  outline: none;
  border-color: rgba(245, 245, 246, 0.55);
}

.creator__submit {
  align-self: flex-start;
  padding: 0.7rem 1.4rem;
  font-family: var(--font-sans);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #0a0a0b;
  background: #f5f5f6;
  border: 1px solid #f5f5f6;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.creator__submit:hover:not(:disabled) { background: #ffffff; }
.creator__submit:disabled { opacity: 0.5; cursor: not-allowed; }

.creator__error {
  margin-top: 0.75rem;
  font-size: 0.82rem;
  color: #f87171;
}

.token {
  margin-top: 1.5rem;
  padding: 1rem 1.15rem;
  border: 1px solid rgba(110, 231, 183, 0.35);
  background: rgba(110, 231, 183, 0.05);
  border-radius: 10px;
}

.token__label {
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #6ee7b7;
  margin-bottom: 0.6rem;
}

.token__row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.65rem;
}

.token__value {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  background: rgba(0, 0, 0, 0.35);
  padding: 0.55rem 0.75rem;
  border-radius: 6px;
  color: #f5f5f6;
  overflow-wrap: anywhere;
  user-select: all;
}

.token__copy {
  padding: 0.55rem 0.9rem;
  font-family: inherit;
  font-size: 0.72rem;
  font-weight: 500;
  color: #0a0a0b;
  background: #f5f5f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.token__meta {
  font-size: 0.78rem;
  color: rgba(245, 245, 246, 0.55);
  margin-bottom: 0.75rem;
}

.token__meta strong { color: #f5f5f6; }

.token__dismiss {
  padding: 0;
  font-family: inherit;
  font-size: 0.78rem;
  color: rgba(245, 245, 246, 0.55);
  background: transparent;
  border: none;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.history {
  margin-top: 1rem;
}

.history__title {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 1rem;
  color: #f5f5f6;
}

.state {
  padding: 1.5rem 0;
  font-size: 0.88rem;
  color: rgba(245, 245, 246, 0.55);
}

.history__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  border: 1px solid rgba(245, 245, 246, 0.08);
  border-radius: 10px;
  overflow: hidden;
  color: #f5f5f6;
}

.history__table th,
.history__table td {
  text-align: left;
  padding: 0.7rem 0.9rem;
  border-bottom: 1px solid rgba(245, 245, 246, 0.08);
}

.history__table thead th {
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.35);
  background: rgba(245, 245, 246, 0.02);
}

.history__table tbody tr:last-child td {
  border-bottom: none;
}

.history__cell-action {
  text-align: right;
}

.history__revoke {
  padding: 0.3rem 0.7rem;
  font-family: inherit;
  font-size: 0.72rem;
  color: #f87171;
  background: transparent;
  border: 1px solid rgba(248, 113, 113, 0.4);
  border-radius: 5px;
  cursor: pointer;
}

.history__revoke:hover {
  background: rgba(248, 113, 113, 0.08);
}

.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: 4px;
  border: 1px solid;
}

.badge--active {
  color: #6ee7b7;
  border-color: rgba(110, 231, 183, 0.4);
}

.badge--expired {
  color: rgba(245, 245, 246, 0.35);
  border-color: rgba(245, 245, 246, 0.08);
}

.badge--exhausted {
  color: #fb923c;
  border-color: rgba(251, 146, 60, 0.4);
}

.badge--revoked {
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.4);
}
</style>