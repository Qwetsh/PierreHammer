import { createKonamiTracker, createTapTracker } from './easterEggs'

describe('easterEggs', () => {
  describe('createKonamiTracker', () => {
    it('triggers on correct Konami code sequence', () => {
      const onTrigger = vi.fn()
      const track = createKonamiTracker(onTrigger)

      const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
      for (const key of code) {
        track(key)
      }

      expect(onTrigger).toHaveBeenCalledOnce()
      expect(onTrigger).toHaveBeenCalledWith(expect.objectContaining({ id: 'konami' }))
    })

    it('does not trigger on wrong sequence', () => {
      const onTrigger = vi.fn()
      const track = createKonamiTracker(onTrigger)

      track('ArrowUp')
      track('ArrowUp')
      track('ArrowLeft') // wrong
      track('ArrowDown')

      expect(onTrigger).not.toHaveBeenCalled()
    })

    it('resets after wrong key', () => {
      const onTrigger = vi.fn()
      const track = createKonamiTracker(onTrigger)

      track('ArrowUp')
      track('x') // reset
      track('ArrowUp')
      track('ArrowUp')

      expect(onTrigger).not.toHaveBeenCalled()
    })
  })

  describe('createTapTracker', () => {
    it('triggers after required number of taps', () => {
      const onTrigger = vi.fn()
      const tap = createTapTracker(5, onTrigger)

      for (let i = 0; i < 5; i++) {
        tap()
      }

      expect(onTrigger).toHaveBeenCalledOnce()
      expect(onTrigger).toHaveBeenCalledWith(expect.objectContaining({ id: 'tap-5' }))
    })

    it('does not trigger with fewer taps', () => {
      const onTrigger = vi.fn()
      const tap = createTapTracker(5, onTrigger)

      for (let i = 0; i < 3; i++) {
        tap()
      }

      expect(onTrigger).not.toHaveBeenCalled()
    })
  })
})
