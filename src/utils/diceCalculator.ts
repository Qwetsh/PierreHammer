export type RerollMode = 'none' | 'ones' | 'all-failures'

/**
 * Calculate expected successes for N dice with a target threshold.
 * threshold is the minimum value to succeed (e.g. 3 means 3+)
 */
export function calcDiceSuccesses(
  numDice: number,
  threshold: number,
  reroll: RerollMode = 'none',
  modifier: number = 0,
): number {
  if (numDice <= 0 || threshold < 1) return 0
  if (threshold > 6) return 0

  const effectiveThreshold = Math.max(1, Math.min(6, threshold - modifier))
  const pSuccess = (7 - effectiveThreshold) / 6
  const pFail = 1 - pSuccess

  let expected = numDice * pSuccess

  if (reroll === 'ones') {
    // Reroll only 1s: 1/6 chance to reroll, then pSuccess chance to succeed
    expected += numDice * (1 / 6) * pSuccess
  } else if (reroll === 'all-failures') {
    // Reroll all failures: pFail chance to reroll, then pSuccess chance to succeed
    expected += numDice * pFail * pSuccess
  }

  return Math.round(expected * 100) / 100
}

/**
 * Calculate the average result of XdY+Z notation.
 * e.g. 5D6+0 → 5 * 3.5 = 17.5
 */
export function calcAverageDice(
  numDice: number,
  sides: number = 6,
  flatBonus: number = 0,
): number {
  if (numDice <= 0 || sides <= 0) return flatBonus
  const avgPerDie = (sides + 1) / 2
  return Math.round((numDice * avgPerDie + flatBonus) * 100) / 100
}

/**
 * Calculate the probability of a charge succeeding.
 * Charge = 2D6 >= distance (in inches).
 * Returns probability as a percentage (0-100).
 */
export function calcChargeSuccess(
  distance: number,
  bonus: number = 0,
  reroll: boolean = false,
): number {
  if (distance <= 0) return 100

  const target = distance - bonus

  // Count combinations of 2D6 that meet the target
  let successCount = 0
  const totalCombinations = 36 // 6 * 6

  for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = 1; d2 <= 6; d2++) {
      if (d1 + d2 >= target) {
        successCount++
      }
    }
  }

  let probability = successCount / totalCombinations

  if (reroll) {
    // If charge fails, reroll both dice
    const pFail = 1 - probability
    probability = probability + pFail * probability
  }

  return Math.round(probability * 10000) / 100
}

/**
 * Distribution of 2D6 results for display.
 * Returns array of { value, probability, cumulative } for values 2-12.
 */
export function calc2D6Distribution(): Array<{
  value: number
  probability: number
  cumulative: number
}> {
  const counts: Record<number, number> = {}
  for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = 1; d2 <= 6; d2++) {
      const sum = d1 + d2
      counts[sum] = (counts[sum] || 0) + 1
    }
  }

  let cumulative = 0
  return Array.from({ length: 11 }, (_, i) => {
    const value = i + 2
    const probability = Math.round(((counts[value] || 0) / 36) * 10000) / 100
    cumulative += probability
    return {
      value,
      probability,
      cumulative: Math.round(cumulative * 100) / 100,
    }
  })
}
