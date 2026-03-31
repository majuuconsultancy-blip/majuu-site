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
    titleClassName || 'text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl'
  const resolvedDescriptionClassName =
    descriptionClassName ||
    'max-w-2xl text-base leading-8 text-slate-700 sm:text-lg sm:leading-[1.75]'

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={headingId}
      className={`px-4 py-[4.5rem] sm:px-6 sm:py-20 ${className}`}
    >
      <div className={`mx-auto w-full ${containerClassName}`}>
        {(eyebrow || title || description) && (
          <header className={`space-y-6 ${headerClassName}`}>
            {eyebrow && (
              <p className="eyebrow text-[0.72rem] font-semibold uppercase">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 id={headingId} className={resolvedTitleClassName}>
                {title}
              </h2>
            )}
            {description && <p className={resolvedDescriptionClassName}>{description}</p>}
          </header>
        )}

        {children}
      </div>
    </section>
  )
}
