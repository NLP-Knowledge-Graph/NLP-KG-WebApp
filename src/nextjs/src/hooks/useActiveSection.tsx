import { useEffect, useState, useRef } from 'react';

export function useActiveSection(idArray: string[]) {
  const observer = useRef<IntersectionObserver>()
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    const handleObsever = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry?.isIntersecting) {
          setActiveId(entry.target.id)
        }
      })
    }

    observer.current = new IntersectionObserver(handleObsever, {
      rootMargin: "-20% 0% -35% 0px"
    }
    )

    idArray.forEach((id) => {
      const element = document.querySelector(`#${id}`);
      element && observer.current?.observe(element);
    })

    return () => observer.current?.disconnect()
  }, [])

  return { activeId }
}