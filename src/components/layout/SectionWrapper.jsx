export function SectionWrapper({
  sectionRef,
  id,
  eyebrow,
  title,
  description,
  className = '',
  containerClassName = 'max-w-6xl',
  headerClassName = '',
  titleClassName = '',
  descriptionClassName = '',
  children,
}) {
  const headingId = title ? `${id}-heading` : undefined
  const resolvedTitleClassName =
    titleClassName || 'text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl'
  const resolvedDescriptionClassName =
    descriptionClassName || 'max-w-2xl text-base leading-8 text-white/72 sm:text-lg sm:leading-[1.7]'

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={headingId}
      className={`px-4 py-16 sm:px-6 sm:py-[4.5rem] ${className}`}
    >
      <div className={`mx-auto w-full ${containerClassName}`}>
        {(eyebrow || title || description) && (
          <header className={`space-y-5 ${headerClassName}`}>
            {eyebrow && (
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-emerald-200/72">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 id={headingId} className={resolvedTitleClassName}>
                {title}
              </h2>
            )}
            {description && (
              <p className={resolvedDescriptionClassName}>
                {description}
              </p>
            )}
          </header>
        )}

        {children}
      </div>
    </section>
  )
}
