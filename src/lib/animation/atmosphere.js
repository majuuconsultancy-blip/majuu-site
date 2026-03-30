import { gsap, ScrollTrigger } from './gsap'

export function setupAtmosphere({ scope, layer, milestones }) {
  const getScroll = ScrollTrigger.getScrollFunc(window)
  const isPerformanceMode = window.matchMedia(
    '(max-width: 767px), (pointer: coarse)',
  ).matches
  const resolvedMilestones = []
  const moodState = { ...milestones[0].mood }
  const layerMap = new Map(
    gsap.utils
      .toArray(layer.querySelectorAll('[data-atmosphere-layer]'))
      .map((element) => [element.dataset.atmosphereLayer, element]),
  )
  let activeTween = null
  let activeLayerTween = null
  let activeLayerId = milestones[0].id

  const applyMood = (mood) => {
    if (!mood) {
      return
    }

    layer.style.setProperty('--story-bg-top', mood.top)
    layer.style.setProperty('--story-bg-bottom', mood.bottom)
    layer.style.setProperty('--story-glow-strength', `${mood.glow}`)
    scope.style.setProperty('--story-accent', mood.accent)
    scope.style.setProperty('--story-accent-soft', mood.accentSoft)
    scope.style.setProperty('--story-danger', mood.danger)
  }

  const showLayer = (layerId, immediate = false) => {
    const nextLayer = layerMap.get(layerId)

    if (!nextLayer || activeLayerId === layerId) {
      return
    }

    activeLayerTween?.kill()

    const previousLayer = layerMap.get(activeLayerId)

    if (immediate) {
      if (previousLayer) {
        gsap.set(previousLayer, { autoAlpha: 0 })
      }
      gsap.set(nextLayer, { autoAlpha: 1 })
      activeLayerId = layerId
      return
    }

    activeLayerTween = gsap.timeline({
      defaults: {
        duration: isPerformanceMode ? 0.42 : 0.58,
        ease: 'power2.out',
      },
    })

    if (previousLayer) {
      activeLayerTween.to(previousLayer, { autoAlpha: 0 }, 0)
    }

    activeLayerTween.to(nextLayer, { autoAlpha: 1 }, 0)
    activeLayerId = layerId
  }

  const tweenToMood = (milestone, immediate = false) => {
    const { id, mood } = milestone

    activeTween?.kill()
    showLayer(id, immediate)

    if (immediate) {
      Object.assign(moodState, mood)
      applyMood(moodState)
      return
    }

    activeTween = gsap.to(moodState, {
      ...mood,
      duration: isPerformanceMode ? 0.42 : 0.58,
      ease: 'power2.out',
      overwrite: 'auto',
      onUpdate: () => applyMood(moodState),
    })
  }

  const resolveMilestones = () => {
    resolvedMilestones.length = 0

    milestones
      .map(({ ref, mood, start }) => {
        if (!ref.current) {
          return null
        }

        return {
          startPoint: ref.current.getBoundingClientRect().top + getScroll(),
          mood,
          triggerStart: start ?? 'top 72%',
        }
      })
      .filter(Boolean)
      .sort((first, second) => first.startPoint - second.startPoint)
      .forEach((milestone) => resolvedMilestones.push(milestone))
  }

  const getCurrentMood = () => {
    if (!resolvedMilestones.length) {
      return milestones[0]
    }

    const scrollY = getScroll()
    let currentMood = resolvedMilestones[0]

    resolvedMilestones.forEach((milestone) => {
      if (scrollY >= milestone.startPoint - window.innerHeight * 0.44) {
        currentMood = milestone
      }
    })

    return currentMood
  }

  gsap.set(Array.from(layerMap.values()), { autoAlpha: 0 })
  gsap.set(layerMap.get(activeLayerId), { autoAlpha: 1 })
  resolveMilestones()
  tweenToMood(getCurrentMood(), true)

  const triggers = milestones
    .map((milestone) => {
      const { ref, start } = milestone
      if (!ref.current) {
        return null
      }

      return ScrollTrigger.create({
        trigger: ref.current,
        start: start ?? 'top 72%',
        onEnter: () => tweenToMood(milestone),
        onEnterBack: () => tweenToMood(milestone),
      })
    })
    .filter(Boolean)

  const refreshTrigger = ScrollTrigger.create({
    trigger: scope,
    start: 'top top',
    end: 'max',
    invalidateOnRefresh: true,
    onRefresh: () => {
      resolveMilestones()
      tweenToMood(getCurrentMood(), true)
    },
  })

  return {
    revert() {
      activeTween?.kill()
      refreshTrigger.kill()
      triggers.forEach((trigger) => trigger.kill())
    },
  }
}
