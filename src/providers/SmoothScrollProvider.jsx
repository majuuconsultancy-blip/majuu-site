import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger, registerGsapPlugins } from '../lib/animation/gsap'

const defaultLenisOptions = {
  autoRaf: false,
  duration: 0.82,
  smoothWheel: true,
  syncTouch: true,
  syncTouchLerp: 0.11,
  touchMultiplier: 1.2,
  wheelMultiplier: 1,
}

export function SmoothScrollProvider({ children }) {
  useEffect(() => {
    registerGsapPlugins()

    const isPerformanceMode = window.matchMedia(
      '(max-width: 767px), (pointer: coarse)',
    ).matches
    const refreshAfterLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', refreshAfterLoad)

    if (isPerformanceMode) {
      ScrollTrigger.refresh()

      return () => {
        window.removeEventListener('load', refreshAfterLoad)
      }
    }

    const lenis = new Lenis(defaultLenisOptions)
    const onLenisScroll = () => ScrollTrigger.update()

    lenis.on('scroll', onLenisScroll)

    const updateLenis = (time) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(updateLenis)
    gsap.ticker.lagSmoothing(0)

    ScrollTrigger.refresh()

    return () => {
      window.removeEventListener('load', refreshAfterLoad)
      gsap.ticker.remove(updateLenis)
      lenis.off('scroll', onLenisScroll)
      lenis.destroy()
    }
  }, [])

  return children
}
