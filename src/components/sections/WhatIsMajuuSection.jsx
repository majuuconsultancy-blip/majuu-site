import { SectionWrapper } from '../layout/SectionWrapper'

export function WhatIsMajuuSection({ content }) {
  const supportLine = `${content.points.slice(0, -1).join(', ')}, or ${content.points.at(-1)}.`

  return (
    <SectionWrapper
      id="what-is-majuu"
      title={content.title}
      description={content.intro}
      className="pt-8 sm:pt-10"
      headerClassName="max-w-3xl"
      titleClassName="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl"
      descriptionClassName="max-w-2xl text-base leading-8 text-white/72 sm:text-lg sm:leading-[1.7]"
    >
      <p className="mt-7 max-w-3xl text-sm leading-7 text-white/80 sm:text-base sm:leading-[1.75]">
        <span className="font-medium text-white/92">{supportLine}</span>
      </p>
    </SectionWrapper>
  )
}
