export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()

  document.documentElement.classList.add('js-reveal-ready')

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion) return

  let observer: IntersectionObserver | null = null

  const attach = () => {
    if (observer) observer.disconnect()
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible')
            observer?.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    )
    document.querySelectorAll('.reveal:not(.reveal-visible)').forEach((el) => {
      observer?.observe(el)
    })
  }

  const scheduleAttach = () => {
    requestAnimationFrame(() => {
      attach()
    })
  }

  nuxtApp.hooks.hook('app:suspense:resolve', scheduleAttach)
  router.afterEach(scheduleAttach)
  scheduleAttach()
})