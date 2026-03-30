export function IntroStorySection({
  sectionRef,
  markerRefs,
  scenes,
}) {
  return (
    <section
      ref={sectionRef}
      id="intro-story"
      aria-label="Introduction"
      className="relative px-4 sm:px-6"
    >
      <div className="relative">
        <div
          data-intro-stage
          className="sticky top-0 flex h-[100svh] items-center"
        >
          <div className="mx-auto w-full max-w-6xl">
            <div className="relative min-h-[19rem] max-w-[17rem] sm:min-h-[23rem] sm:max-w-[34rem]">
              {scenes.map((scene, index) => (
                <article
                  key={scene.id}
                  data-intro-scene
                  className="absolute inset-0 flex flex-col justify-center"
                >
                  <div
                    aria-hidden="true"
                    className="mb-6 flex items-center gap-3 text-white/22"
                  >
                    <div className="h-px w-12 bg-current" />
                    <div className="h-1.5 w-1.5 rounded-full bg-current" />
                  </div>

                  <h1
                    className={`max-w-[12ch] text-5xl font-semibold leading-none text-white sm:text-7xl ${
                      index === scenes.length - 1 ? 'max-w-[10ch]' : ''
                    }`}
                  >
                    {scene.title}
                  </h1>

                  <p
                    className={`mt-4 text-base leading-7 text-white/74 sm:text-xl sm:leading-8 ${
                      index === scenes.length - 1
                        ? 'max-w-md text-white/82'
                        : 'max-w-sm'
                    }`}
                  >
                    {scene.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div aria-hidden="true" className="pointer-events-none opacity-0">
          {scenes.map((scene, index) => (
            <div
              key={scene.id}
              ref={markerRefs[index]}
              data-intro-marker
              className={index === scenes.length - 1 ? 'h-[92svh]' : 'h-[100svh]'}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
