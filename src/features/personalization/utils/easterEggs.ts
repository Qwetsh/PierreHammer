export interface EasterEgg {
  id: string
  message: string
}

const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

export function createKonamiTracker(onTrigger: (egg: EasterEgg) => void): (key: string) => void {
  let index = 0

  return (key: string) => {
    if (key === KONAMI_CODE[index]) {
      index++
      if (index === KONAMI_CODE.length) {
        index = 0
        onTrigger({
          id: 'konami',
          message: 'God mode activé ! Toutes tes figurines sont peintes... dans tes rêves.',
        })
      }
    } else {
      index = 0
    }
  }
}

export function createTapTracker(requiredTaps: number, onTrigger: (egg: EasterEgg) => void): () => void {
  let count = 0
  let timer: ReturnType<typeof setTimeout> | null = null

  return () => {
    count++
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      count = 0
    }, 2000)

    if (count >= requiredTaps) {
      count = 0
      if (timer) clearTimeout(timer)
      onTrigger({
        id: 'tap-5',
        message: 'Thin your paints ! — Duncan Rhodes approuve cette app.',
      })
    }
  }
}
