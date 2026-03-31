import { SectionWrapper } from '../layout/SectionWrapper'

export function WhatIsMajuuSection({ content }) {
  const verifiedPhrase = 'verified partners'
  const [beforeVerified, afterVerified] = content.paragraphs[1].split(verifiedPhrase)
  const [beforeMajuu, afterMajuu] = content.paragraphs[0].split('MAJUU')

  return (
    <SectionWrapper
      id="what-is-majuu"
      title={content.title}
      className="pt-8 sm:pt-10"
      containerClassName="max-w-5xl"
      headerClassName="max-w-3xl"
      titleClassName="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl"
    >
      <div className="mt-8 max-w-3xl space-y-5 text-base leading-8 text-slate-700 sm:text-lg sm:leading-[1.8]">
        <p>
          {beforeMajuu}
          <span className="font-semibold text-emerald-700">MAJUU</span>
          {afterMajuu}
        </p>
        <p>
          {beforeVerified}
          <span className="accent-script text-[1.08em] font-semibold text-emerald-700">
            verified
          </span>{' '}
          partners
          {afterVerified}
        </p>
      </div>
    </SectionWrapper>
  )
}
