// Pincode API utilities for fetching location data
export interface PincodeData {
  pincode: string
  city: string
  state: string
  country: string
  district?: string
}

// Free pincode API - you can replace this with a paid service for better reliability
const PINCODE_API_BASE = 'https://api.postalpincode.in/pincode'

export const fetchPincodeData = async (pincode: string): Promise<PincodeData | null> => {
  if (!pincode || pincode.length !== 6) {
    return null
  }

  try {
    const response = await fetch(`${PINCODE_API_BASE}/${pincode}`)
    const data = await response.json()

    if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
      const postOffice = data[0].PostOffice[0]
      return {
        pincode: pincode,
        city: postOffice.District || postOffice.Name || '',
        state: postOffice.State || '',
        country: postOffice.Country || 'India',
        district: postOffice.District || ''
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching pincode data:', error)
    return null
  }
}

// Alternative API using a different service
export const fetchPincodeDataAlternative = async (pincode: string): Promise<PincodeData | null> => {
  if (!pincode || pincode.length !== 6) {
    return null
  }

  try {
    // Using a different free API
    const response = await fetch(`https://api.zippopotam.us/in/${pincode}`)
    const data = await response.json()

    if (data && data.places && data.places.length > 0) {
      const place = data.places[0]
      return {
        pincode: pincode,
        city: place['place name'] || '',
        state: place.state || '',
        country: data.country || 'India'
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching pincode data from alternative API:', error)
    return null
  }
}

// Main function that tries both APIs
export const getPincodeData = async (pincode: string): Promise<PincodeData | null> => {
  // Try primary API first
  let data = await fetchPincodeData(pincode)
  
  // If primary fails, try alternative
  if (!data) {
    data = await fetchPincodeDataAlternative(pincode)
  }
  
  return data
}

// Validate pincode format
export const isValidPincode = (pincode: string): boolean => {
  return /^[1-9][0-9]{5}$/.test(pincode)
}
