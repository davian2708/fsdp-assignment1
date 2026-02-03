import { useEffect, useMemo, useState } from 'react'

export default function LeftCenterText() {
  const items = useMemo(
    () => [
      { title: 'Create your own bots', desc: 'Build agents that fit your workflow.' },
      { title: 'More effective responses', desc: 'Get clearer, more useful outputs.' },
      { title: 'Smarter chaining', desc: 'Connect steps for better results.' },
      { title: 'Ship faster', desc: 'Iterate quickly with a clean UI.' },
    ],
    []
  )

  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    const t = setInterval(() => setBlink((b) => !b), 520)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const full = items[index].title
    const isDoneTyping = text === full
    const isEmpty = text.length === 0

    const typingSpeed = deleting ? 28 : 40
    const pauseAfterTyped = 980
    const pauseAfterDeleted = 220

    let timeout

    if (!deleting) {
      if (!isDoneTyping) {
        timeout = setTimeout(() => {
          setText(full.slice(0, text.length + 1))
        }, typingSpeed)
      } else {
        timeout = setTimeout(() => setDeleting(true), pauseAfterTyped)
      }
    } else {
      if (!isEmpty) {
        timeout = setTimeout(() => {
          setText(full.slice(0, Math.max(0, text.length - 1)))
        }, typingSpeed)
      } else {
        timeout = setTimeout(() => {
          setDeleting(false)
          setIndex((i) => (i + 1) % items.length)
        }, pauseAfterDeleted)
      }
    }

    return () => clearTimeout(timeout)
  }, [deleting, index, items, text])

  return (
    <div className="center-copy">
      <div className="center-eyebrow">FLYING BOT</div>
      <div className="center-title" aria-label={items[index].title}>
        <span className="typed">{text}</span>
        <span className={blink ? 'cursor on' : 'cursor'} aria-hidden="true" />
      </div>
      <div className="center-desc" key={index}>
        {items[index].desc}
      </div>
    </div>
  )
}
