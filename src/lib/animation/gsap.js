import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let isRegistered = false

export const registerGsapPlugins = () => {
  if (isRegistered) {
    return
  }

  gsap.registerPlugin(ScrollTrigger)
  isRegistered = true
}

registerGsapPlugins()

export { gsap, ScrollTrigger }
