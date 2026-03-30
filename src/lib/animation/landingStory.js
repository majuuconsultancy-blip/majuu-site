import { gsap, ScrollTrigger } from './gsap'

const revealEase = 'power3.out'
const sceneSnap = {
  duration: { min: 0.14, max: 0.22 },
  delay: 0.02,
  ease: 'power2.out',
  inertia: false,
}

function getScrollTop(target) {
  const getScroll = ScrollTrigger.getScrollFunc(window)

  return target.getBoundingClientRect().top + getScroll()
}

function toArray(items) {
  return gsap.utils.toArray(items).filter(Boolean)
}

function setVisible(targets) {
  const elements = toArray(targets)

  if (!elements.length) {
    return
  }

  gsap.set(elements, {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    filter: 'none',
  })
}

function reveal(targets, trigger, options = {}) {
  const elements = toArray(targets)
  const fromBlur = options.fromBlur ?? 8

  if (!elements.length || !trigger) {
    return
  }

  gsap.fromTo(
    elements,
    {
      autoAlpha: 0,
      y: options.fromY ?? 24,
      scale: options.fromScale ?? 1,
      filter: fromBlur > 0 ? `blur(${fromBlur}px)` : 'none',
    },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      filter: 'none',
      duration: options.duration ?? 1,
      ease: options.ease ?? revealEase,
      stagger: options.stagger ?? 0.08,
      overwrite: 'auto',
      scrollTrigger: {
        trigger,
        start: options.start ?? 'top 78%',
        once: true,
      },
    },
  )
}

function animateSectionHeader(section, options = {}) {
  if (!section) {
    return
  }

  const title = section.querySelector('[data-section-title]')
  const copy = section.querySelector('[data-section-copy]')
  const ornaments = toArray(section.querySelectorAll('[data-ornament]'))

  reveal([title, copy, ...ornaments], section, options)
}

function animateStaggerGroup(section, selector, options = {}) {
  if (!section) {
    return
  }

  const items = section.querySelectorAll(selector)
  reveal(items, section, {
    start: options.start ?? 'top 74%',
    stagger: options.stagger ?? 0.1,
    fromY: options.fromY ?? 22,
    fromBlur: options.fromBlur ?? 7,
    duration: options.duration ?? 0.9,
  })
}

function createSnapTrigger(section, markers) {
  let snapPoints = [0]

  return ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    invalidateOnRefresh: true,
    snap: {
      ...sceneSnap,
      snapTo: (value) => gsap.utils.snap(snapPoints, value),
    },
    onRefresh: (self) => {
      const getScroll = ScrollTrigger.getScrollFunc(window)

      snapPoints = [0]
        .concat(
          markers
            .map((marker) => marker.getBoundingClientRect().top + getScroll())
            .map((point) => gsap.utils.normalize(self.start, self.end, point)),
        )
    },
  })
}

function createSceneActivator({ markers, activate, start = 'top 56%' }) {
  const state = { activeIndex: -1 }

  const setActive = (index, immediate = false) => {
    if (state.activeIndex === index && !immediate) {
      return
    }

    const previousIndex = state.activeIndex
    state.activeIndex = index
    activate(index, previousIndex, immediate)
  }

  setActive(0, true)

  const triggers = markers.map((marker, index) =>
    ScrollTrigger.create({
      trigger: marker,
      start,
      end: 'bottom 56%',
      onToggle: (self) => {
        if (self.isActive) {
          setActive(index)
        }
      },
    }),
  )

  return {
    state,
    triggers,
  }
}

function createStepObserver({
  section,
  markers,
  currentIndexRef,
  previousTarget,
  nextTarget,
}) {
  const isPerformanceMode = window.matchMedia(
    '(max-width: 767px), (pointer: coarse)',
  ).matches

  if (!isPerformanceMode || !section || !markers.length) {
    return null
  }

  let isActive = false
  let isLocked = false
  let enableCall = null
  let unlockCall = null

  const observer = ScrollTrigger.observe({
    target: window,
    type: 'wheel,touch',
    wheelSpeed: -1,
    tolerance: 14,
    preventDefault: true,
    allowClicks: true,
    onUp: () => step(1),
    onDown: () => step(-1),
  })

  observer.disable()

  const reEnable = () => {
    if (isActive && !isLocked) {
      observer.enable()
    }
  }

  const step = (direction) => {
    if (!isActive || isLocked) {
      return
    }

    const currentIndex = currentIndexRef.activeIndex
    let targetTop = null

    if (direction > 0) {
      if (currentIndex < markers.length - 1) {
        targetTop = getScrollTop(markers[currentIndex + 1])
      } else if (nextTarget) {
        targetTop = getScrollTop(nextTarget)
      }
    } else if (currentIndex > 0) {
      targetTop = getScrollTop(markers[currentIndex - 1])
    } else if (previousTarget) {
      targetTop = getScrollTop(previousTarget)
    } else {
      targetTop = 0
    }

    if (targetTop === null) {
      return
    }

    isLocked = true
    observer.disable()
    unlockCall?.kill()
    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth',
    })
    unlockCall = gsap.delayedCall(0.42, () => {
      isLocked = false
      reEnable()
    })
  }

  const regionTrigger = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onEnter: () => {
      isActive = true
      enableCall?.kill()
      enableCall = gsap.delayedCall(0.05, reEnable)
    },
    onEnterBack: () => {
      isActive = true
      enableCall?.kill()
      enableCall = gsap.delayedCall(0.05, reEnable)
    },
    onLeave: () => {
      isActive = false
      observer.disable()
    },
    onLeaveBack: () => {
      isActive = false
      observer.disable()
    },
  })

  return {
    revert() {
      enableCall?.kill()
      unlockCall?.kill()
      regionTrigger.kill()
      observer.kill()
    },
  }
}

function setupIntroSceneStory({ introSection, markerRefs, reduceMotion }) {
  const introScenes = toArray(introSection?.querySelectorAll('[data-intro-scene]'))
  const markers = markerRefs.map((ref) => ref.current).filter(Boolean)
  const isPerformanceMode = window.matchMedia(
    '(max-width: 767px), (pointer: coarse)',
  ).matches
  const sceneBlur = reduceMotion || isPerformanceMode ? 0 : 3
  const sceneOffset = isPerformanceMode ? 8 : 10
  const sceneScale = isPerformanceMode ? 1 : 0.997
  const duration = isPerformanceMode ? 0.24 : 0.32

  if (!introSection || introScenes.length !== markers.length) {
    return
  }

  gsap.set(introScenes, {
    autoAlpha: 0,
    y: sceneOffset,
    scale: sceneScale,
    filter: sceneBlur > 0 ? `blur(${sceneBlur}px)` : 'none',
  })

  const snapTrigger = isPerformanceMode ? null : createSnapTrigger(introSection, markers)

  const sceneController = createSceneActivator({
    markers,
    start: isPerformanceMode ? 'top top' : 'top 56%',
    activate: (index, previousIndex, immediate) => {
      const incoming = introScenes[index]
      const outgoing = previousIndex >= 0 ? introScenes[previousIndex] : null
      const tweenDuration = immediate ? 0 : duration

      if (outgoing && outgoing !== incoming) {
        gsap.to(outgoing, {
          autoAlpha: 0,
          y: -sceneOffset,
          scale: isPerformanceMode ? 1 : 1.002,
          filter: sceneBlur > 0 ? `blur(${sceneBlur}px)` : 'none',
          duration: tweenDuration,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      }

      gsap.fromTo(
        incoming,
        {
          autoAlpha: immediate ? 1 : 0,
          y: immediate ? 0 : sceneOffset,
          scale: immediate ? 1 : sceneScale,
          filter: immediate || sceneBlur === 0 ? 'none' : `blur(${sceneBlur}px)`,
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: 'none',
          duration: tweenDuration,
          ease: 'power2.out',
          overwrite: 'auto',
        },
      )
    },
  })

  const stepObserver = createStepObserver({
    section: introSection,
    markers,
    currentIndexRef: sceneController.state,
    nextTarget: markers[markers.length - 1]?.parentElement?.closest('section')?.nextElementSibling,
  })

  return {
    snapTrigger,
    triggers: sceneController.triggers,
    stepObserver,
  }
}

function setupPhoneSceneStory({ phoneSection, reduceMotion }) {
  const phoneFrame = phoneSection?.querySelector('[data-phone-frame]')
  const phoneCopyStage = phoneSection?.querySelector('[data-phone-copy-stage]')
  const phoneScreens = toArray(phoneSection?.querySelectorAll('[data-phone-screen]'))
  const phoneScenes = toArray(phoneSection?.querySelectorAll('[data-scene-item]'))
  const markers = toArray(phoneSection?.querySelectorAll('[data-phone-marker]'))
  const isPerformanceMode = window.matchMedia(
    '(max-width: 767px), (pointer: coarse)',
  ).matches
  const sceneBlur = reduceMotion || isPerformanceMode ? 0 : 3
  const sceneOffset = isPerformanceMode ? 8 : 10
  const screenOffset = isPerformanceMode ? 6 : 8
  const sceneScale = isPerformanceMode ? 1 : 0.997
  const screenScale = isPerformanceMode ? 1 : 0.995
  const duration = isPerformanceMode ? 0.24 : 0.34

  if (
    !phoneSection ||
    !phoneFrame ||
    !phoneCopyStage ||
    phoneScreens.length !== phoneScenes.length ||
    phoneScenes.length !== markers.length
  ) {
    return
  }

  gsap.set(phoneScreens, {
    autoAlpha: 0,
    y: screenOffset,
    scale: screenScale,
  })
  gsap.set(phoneScenes, {
    autoAlpha: 0,
    y: sceneOffset,
    scale: sceneScale,
    filter: sceneBlur > 0 ? `blur(${sceneBlur}px)` : 'none',
  })

  const snapTrigger = isPerformanceMode ? null : createSnapTrigger(phoneSection, markers)

  const sceneController = createSceneActivator({
    markers,
    start: isPerformanceMode ? 'top top' : 'top 58%',
    activate: (index, previousIndex, immediate) => {
      const incomingScene = phoneScenes[index]
      const incomingScreen = phoneScreens[index]
      const outgoingScene = previousIndex >= 0 ? phoneScenes[previousIndex] : null
      const outgoingScreen = previousIndex >= 0 ? phoneScreens[previousIndex] : null
      const tweenDuration = immediate ? 0 : duration

      if (outgoingScene && outgoingScene !== incomingScene) {
        gsap.to(outgoingScene, {
          autoAlpha: 0,
          y: -sceneOffset,
          scale: isPerformanceMode ? 1 : 1.002,
          filter: sceneBlur > 0 ? `blur(${sceneBlur}px)` : 'none',
          duration: tweenDuration,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      }

      if (outgoingScreen && outgoingScreen !== incomingScreen) {
        gsap.to(outgoingScreen, {
          autoAlpha: 0,
          y: -screenOffset,
          scale: isPerformanceMode ? 1 : 0.994,
          duration: tweenDuration,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      }

      gsap.fromTo(
        incomingScene,
        {
          autoAlpha: immediate ? 1 : 0,
          y: immediate ? 0 : sceneOffset,
          scale: immediate ? 1 : sceneScale,
          filter: immediate || sceneBlur === 0 ? 'none' : `blur(${sceneBlur}px)`,
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: 'none',
          duration: tweenDuration,
          ease: 'power2.out',
          overwrite: 'auto',
        },
      )

      gsap.fromTo(
        incomingScreen,
        {
          autoAlpha: immediate ? 1 : 0,
          y: immediate ? 0 : screenOffset,
          scale: immediate ? 1 : screenScale,
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: tweenDuration,
          ease: 'power2.out',
          overwrite: 'auto',
        },
      )
    },
  })

  const stepObserver = createStepObserver({
    section: phoneSection,
    markers,
    currentIndexRef: sceneController.state,
    previousTarget: phoneSection.previousElementSibling,
    nextTarget: phoneSection.nextElementSibling,
  })

  const exitTrigger = ScrollTrigger.create({
    trigger: phoneSection,
    start: 'bottom bottom',
    onEnter: () => {
      gsap.to([phoneFrame, phoneCopyStage], {
        autoAlpha: 0,
        y: isPerformanceMode ? -8 : -12,
        duration: isPerformanceMode ? 0.18 : 0.24,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    },
    onLeaveBack: () => {
      gsap.to([phoneFrame, phoneCopyStage], {
        autoAlpha: 1,
        y: 0,
        duration: isPerformanceMode ? 0.18 : 0.24,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    },
  })

  return {
    snapTrigger,
    triggers: sceneController.triggers,
    exitTrigger,
    stepObserver,
  }
}

export function setupLandingAnimations({ scope, refs }) {
  let cleanup = () => {}

  const context = gsap.context(() => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const isPerformanceMode = window.matchMedia(
      '(max-width: 767px), (pointer: coarse)',
    ).matches
    const revealBlur = isPerformanceMode ? 0 : 4

    const introStory = setupIntroSceneStory({
      introSection: refs.intro.current,
      markerRefs: refs.introMarkers,
      reduceMotion,
    })

    animateSectionHeader(refs.whatIs.current, {
      fromY: 18,
      fromBlur: revealBlur,
      duration: 0.82,
      start: 'top 84%',
    })

    const phoneStory = setupPhoneSceneStory({
      phoneSection: refs.phone.current,
      reduceMotion,
    })

    animateSectionHeader(refs.why.current, {
      fromY: 24,
      fromBlur: revealBlur,
      duration: 1.05,
      start: 'top 84%',
    })
    if (isPerformanceMode) {
      setVisible(refs.why.current?.querySelectorAll('[data-stagger-item]'))
    } else {
      animateStaggerGroup(refs.why.current, '[data-stagger-item]', {
        start: 'top 82%',
        stagger: 0.12,
        fromBlur: revealBlur,
        duration: 0.98,
      })
    }

    reveal(refs.solution.current, refs.solution.current, {
      fromY: 22,
      fromBlur: revealBlur,
      duration: 1.18,
      start: 'top 86%',
    })

    animateSectionHeader(refs.how.current, {
      fromY: 18,
      fromBlur: revealBlur,
      duration: 0.82,
      start: 'top 84%',
    })
    if (isPerformanceMode) {
      setVisible(refs.how.current?.querySelectorAll('[data-stagger-item]'))
    } else {
      animateStaggerGroup(refs.how.current, '[data-stagger-item]', {
        start: 'top 82%',
        stagger: 0.07,
        fromBlur: revealBlur,
        duration: 0.8,
      })
    }

    animateSectionHeader(refs.download.current, {
      fromY: 18,
      fromBlur: revealBlur,
      duration: 0.98,
      start: 'top 84%',
    })

    const ctaBlock = refs.download.current?.querySelector('[data-cta-block]')
    const ctaButton = refs.download.current?.querySelector('[data-cta-button]')
    const ctaChips = refs.download.current?.querySelectorAll('[data-cta-chip]')

    if (isPerformanceMode) {
      setVisible([ctaBlock, ...toArray(ctaChips)])
    } else {
      reveal(ctaBlock, refs.download.current, {
        fromY: 22,
        fromScale: 0.992,
        fromBlur: revealBlur,
        duration: 1.08,
        start: 'top 84%',
      })
      reveal(ctaChips, refs.download.current, {
        fromY: 12,
        fromBlur: revealBlur,
        duration: 0.84,
        start: 'top 82%',
        stagger: 0.05,
      })
    }

    if (ctaButton && !reduceMotion && !isPerformanceMode) {
      const glowTween = gsap.to(ctaButton, {
        scale: 1.01,
        boxShadow: '0 20px 60px rgba(16, 185, 129, 0.28)',
        duration: 2.6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        paused: true,
      })

      ScrollTrigger.create({
        trigger: refs.download.current,
        start: 'top 82%',
        once: true,
        onEnter: () => glowTween.play(),
      })
    }

    const installSection = scope.querySelector('#install-guide')
    const emailSection = scope.querySelector('#email-capture')
    const contactSection = scope.querySelector('#contact')

    animateSectionHeader(installSection, {
      fromY: 18,
      duration: 0.9,
      start: 'top 86%',
    })
    animateSectionHeader(emailSection, {
      fromY: 18,
      duration: 0.9,
      start: 'top 86%',
    })
    animateSectionHeader(contactSection, {
      fromY: 18,
      duration: 0.9,
      start: 'top 86%',
    })

    const softRevealBlocks = toArray(
      scope.querySelectorAll('[data-soft-reveal]'),
    )

    if (isPerformanceMode) {
      setVisible(softRevealBlocks)
    } else {
      softRevealBlocks.forEach((block) => {
        reveal(block, block, {
          fromY: 18,
          fromBlur: revealBlur,
          duration: 0.85,
          start: 'top 88%',
        })
      })
    }

    cleanup = () => {
      introStory?.snapTrigger?.kill()
      introStory?.triggers?.forEach((trigger) => trigger.kill())
      introStory?.stepObserver?.revert()
      phoneStory?.snapTrigger?.kill()
      phoneStory?.triggers?.forEach((trigger) => trigger.kill())
      phoneStory?.exitTrigger?.kill()
      phoneStory?.stepObserver?.revert()
    }
  }, scope)

  return {
    revert() {
      cleanup()
      context.revert()
    },
  }
}
