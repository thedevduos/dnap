// Shipping rates calculation utilities
export interface ShippingRate {
  id: string
  minWeight: number // in KG
  maxWeight: number // in KG
  tamilnadu: number // rate for Tamil Nadu
  india: number // rate for other Indian states
  international: number // rate for outside India
  createdAt: any
  updatedAt: any
}

export interface ShippingCalculation {
  rate: number
  region: 'tamilnadu' | 'india' | 'international'
  weightSlab: string
}

// Default shipping rates based on user requirements
export const DEFAULT_SHIPPING_RATES: ShippingRate[] = [
  {
    id: 'default-1',
    minWeight: 0.1,
    maxWeight: 1.0,
    tamilnadu: 40,
    india: 80,
    international: 120,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'default-2',
    minWeight: 1.1,
    maxWeight: 2.0,
    tamilnadu: 80,
    india: 120,
    international: 200,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// Calculate shipping rate based on weight and location
export const calculateShippingRate = (
  weight: number,
  state: string,
  country: string,
  shippingRates: ShippingRate[]
): ShippingCalculation | null => {
  console.log('calculateShippingRate called with:', { weight, state, country, shippingRates })
  
  // Find the appropriate weight slab
  const weightSlab = shippingRates.find(rate => 
    weight >= rate.minWeight && weight <= rate.maxWeight
  )

  console.log('Found weight slab:', weightSlab)

  if (!weightSlab) {
    console.log('No weight slab found for weight:', weight)
    return null
  }

  // Determine region
  let region: 'tamilnadu' | 'india' | 'international'
  let rate: number

  if (country.toLowerCase() !== 'india') {
    region = 'international'
    rate = weightSlab.international
  } else if (state.toLowerCase() === 'tamil nadu' || state.toLowerCase() === 'tamilnadu') {
    region = 'tamilnadu'
    rate = weightSlab.tamilnadu
  } else {
    region = 'india'
    rate = weightSlab.india
  }

  const result = {
    rate,
    region,
    weightSlab: `${weightSlab.minWeight}-${weightSlab.maxWeight} KG`
  }
  
  console.log('Shipping calculation result:', result)
  return result
}

// Calculate total weight of cart items
export const calculateCartWeight = (items: any[]): number => {
  if (!items || items.length === 0) {
    return 0.5 // Default weight for empty cart
  }
  
  return items.reduce((total, item) => {
    const itemWeight = item.weight || 0.5 // Default weight if not specified
    return total + (itemWeight * item.quantity)
  }, 0)
}

// Validate shipping rate data
export const validateShippingRate = (rate: Partial<ShippingRate>): string[] => {
  const errors: string[] = []

  if (!rate.minWeight || rate.minWeight < 0) {
    errors.push('Minimum weight must be a positive number')
  }

  if (!rate.maxWeight || rate.maxWeight < 0) {
    errors.push('Maximum weight must be a positive number')
  }

  if (rate.minWeight && rate.maxWeight && rate.minWeight >= rate.maxWeight) {
    errors.push('Minimum weight must be less than maximum weight')
  }

  if (!rate.tamilnadu || rate.tamilnadu < 0) {
    errors.push('Tamil Nadu rate must be a positive number')
  }

  if (!rate.india || rate.india < 0) {
    errors.push('India rate must be a positive number')
  }

  if (!rate.international || rate.international < 0) {
    errors.push('International rate must be a positive number')
  }

  return errors
}
