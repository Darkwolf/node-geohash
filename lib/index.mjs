import {
  ObjectCreate,
  ObjectDefineProperties,
  SymbolToStringTag,
  RangeError,
  SyntaxError,
  TypeError,
  NumberIsFinite,
  NumberIsInteger,
  BigInt,
  MathPI,
  MathAbs,
  MathAsin,
  MathAtan,
  MathAtan2,
  MathCos,
  MathRound,
  MathSin,
  MathSqrt,
  MathTan,
  StringPrototypeSafeSymbolIterator,
  ArrayPrototypeForEach,
  ArrayPrototypePush,
  ReflectSetPrototypeOf,
  SafeGenerator,
  PrimitivesIsNumber,
  PrimitivesIsBigInt,
  PrimitivesIsString,
  TypesToNumber,
  TypesToIntegerOrInfinity,
  TypesToBigInt
} from '@darkwolf/primordials'

const BASE = 32

const ALPHABET = '0123456789bcdefghjkmnpqrstuvwxyz'

const BITS_PER_CHAR = 5

const MAX_GEOHASH_PRECISION = 22

const MAX_GEOHASH_PRECISION_BITS = MAX_GEOHASH_PRECISION * BITS_PER_CHAR // 110
const MAX_GEOINT_BITS = 52
const MAX_GEOBIGINT_BITS = MAX_GEOHASH_PRECISION_BITS

const MAX_GEOINT = 2 ** MAX_GEOINT_BITS
const MAX_GEOBIGINT = 2n ** 110n

const GEOHASH_PRECISION = 10
const GEOINT_BITS = 52
const GEOBIGINT_BITS = 64

const MIN_LATITUDE = -90
const MAX_LATITUDE = 90
const MIN_LONGITUDE = -180
const MAX_LONGITUDE = 180

const EARTH_EQUATORIAL_RADIUS = 6378.137
const EARTH_EQUATORIAL_RADIUS_IN_METERS = EARTH_EQUATORIAL_RADIUS * 1e3
const EARTH_POLAR_RADIUS = 6356.752
const EARTH_POLAR_RADIUS_IN_METERS = EARTH_POLAR_RADIUS * 1e3
const EARTH_RADIUS = 6371
const EARTH_FLATTENING = (EARTH_EQUATORIAL_RADIUS - EARTH_POLAR_RADIUS) / EARTH_EQUATORIAL_RADIUS
const EARTH_ECCENTRICITY2 = EARTH_FLATTENING * 2 - EARTH_FLATTENING ** 2

const getDirections = () => [
  'north',
  'northeast',
  'east',
  'southeast',
  'south',
  'southwest',
  'west',
  'northwest'
]
const directions = getDirections()

const directionLookup = {
  north: [1, 0],
  northeast: [1, 1],
  east: [0, 1],
  southeast: [-1, 1],
  south: [-1, 0],
  southwest: [-1, -1],
  west: [0, -1],
  northwest: [1, -1]
}
ReflectSetPrototypeOf(directionLookup, null)

const createAlphabetLookup = alphabet => {
  const lookup = ObjectCreate(null)
  for (let i = 0; i < BASE; i++) {
    const char = alphabet[i]
    lookup[char] = i
  }
  return lookup
}
const alphabetLookup = createAlphabetLookup(ALPHABET)

const getBit = (number, position) => number / (2 ** position) & 1

const getBigIntBit = (bigInt, position) => bigInt / (2n ** BigInt(position)) & 1n

const wrapLatitude = latitude =>
  latitude < MIN_LATITUDE ? MIN_LATITUDE :
  latitude > MAX_LATITUDE ? MAX_LATITUDE : latitude

const wrapLongitude = longitude =>
  longitude < MIN_LONGITUDE ? MAX_LONGITUDE + longitude % MAX_LONGITUDE :
  longitude > MAX_LONGITUDE ? MIN_LONGITUDE + longitude % MAX_LONGITUDE : longitude

const degreesToRadians = degrees => degrees * MathPI / 180

const radiansToDegrees = radians => radians * 180 / MathPI

const isDirection = value => PrimitivesIsString(value) && directionLookup[value] !== undefined

const validateDirection = value => {
  if (!PrimitivesIsString(value)) {
    throw new TypeError('The direction must be a string')
  }
  if (directionLookup[value] === undefined) {
    throw new TypeError('The direction must be "north", "northeast", "east", "southeast", "south", "southwest", "west" or "northwest"')
  }
}

const isGeohash = value => {
  if (!PrimitivesIsString(value)) {
    return false
  }
  const {length} = value
  if (!length || length > MAX_GEOHASH_PRECISION) {
    return false
  }
  for (const char of StringPrototypeSafeSymbolIterator(value)) {
    if (alphabetLookup[char] === undefined) {
      return false
    }
  }
  return true
}

const isGeoint = value => NumberIsInteger(value) && value > 0 && value <= MAX_GEOINT

const toGeoint = value => {
  value = TypesToIntegerOrInfinity(value)
  if (value <= 0) {
    throw new RangeError('The geoint must be greater than zero')
  }
  if (value > MAX_GEOINT) {
    throw new RangeError('The geoint must be less than or equal to 2^52')
  }
  return value
}

const isGeobigint = value => PrimitivesIsBigInt(value) && value > 0n && value <= MAX_GEOBIGINT

const toGeobigint = value => {
  value = TypesToBigInt(value)
  if (value <= 0n) {
    throw new RangeError('The geobigint must be greater than zero')
  }
  if (value > MAX_GEOBIGINT) {
    throw new RangeError('The geobigint must be less than or equal to 2n^110n')
  }
  return value
}

const toGeohashPrecision = value => {
  if (value === undefined) {
    return GEOHASH_PRECISION
  }
  value = TypesToIntegerOrInfinity(value)
  if (value <= 0) {
    throw new RangeError('The precision must be greater than zero')
  }
  if (value > MAX_GEOHASH_PRECISION) {
    throw new RangeError('The precision must be less than or equal to 22')
  }
  return value
}

const toGeointBits = value => {
  if (value === undefined) {
    return GEOINT_BITS
  }
  value = TypesToIntegerOrInfinity(value)
  if (value <= 0) {
    throw new RangeError('The bits must be greater than zero')
  }
  if (value > MAX_GEOINT_BITS) {
    throw new RangeError('The bits must be less than or equal to 52')
  }
  return value
}

const toGeobigintBits = value => {
  if (value === undefined) {
    return GEOBIGINT_BITS
  }
  value = TypesToIntegerOrInfinity(value)
  if (value <= 0) {
    throw new RangeError('The bits must be greater than zero')
  }
  if (value > MAX_GEOBIGINT_BITS) {
    throw new RangeError('The bits must be less than or equal to 110')
  }
  return value
}

const isLatitude = value => PrimitivesIsNumber(value) && value >= MIN_LATITUDE && value <= MAX_LATITUDE

const toLatitude = value => {
  value = TypesToNumber(value)
  if (value < MIN_LATITUDE) {
    throw new RangeError('The latitude must be greater than or equal to -90')
  }
  if (value > MAX_LATITUDE) {
    throw new RangeError('The latitude must be less than or equal to 90')
  }
  return value
}

const isLongitude = value => PrimitivesIsNumber(value) && value >= MIN_LONGITUDE && value <= MAX_LONGITUDE

const toLongitude = value => {
  value = TypesToNumber(value)
  if (value < MIN_LONGITUDE) {
    throw new RangeError('The longitude must be greater than or equal to -180')
  }
  if (value > MAX_LONGITUDE) {
    throw new RangeError('The longitude must be less than or equal to 180')
  }
  return value
}

const _encode = (latitude, longitude, precision) => {
  let minLat = MIN_LATITUDE
  let maxLat = MAX_LATITUDE
  let minLon = MIN_LONGITUDE
  let maxLon = MAX_LONGITUDE
  let isEven = true
  let bitCount = 0
  let carry = 0
  let result = ''
  while (result.length < precision) {
    if (isEven) {
      const avg = (minLon + maxLon) / 2
      if (longitude > avg) {
        carry = (carry << 1) + 1
        minLon = avg
      } else {
        carry <<= 1
        maxLon = avg
      }
    } else {
      const avg = (minLat + maxLat) / 2
      if (latitude > avg) {
        carry = (carry << 1) + 1
        minLat = avg
      } else {
        carry <<= 1
        maxLat = avg
      }
    }
    isEven = !isEven
    if (bitCount < 4) {
      bitCount++
    } else {
      result += ALPHABET[carry]
      bitCount = 0
      carry = 0
    }
  }
  return result
}
const encode = (latitude, longitude, precision) => {
  precision = toGeohashPrecision(precision)
  latitude = toLatitude(latitude)
  longitude = toLongitude(longitude)
  return _encode(latitude, longitude, precision)
}

const _encodeInt = (latitude, longitude, bits) => {
  let minLat = MIN_LATITUDE
  let maxLat = MAX_LATITUDE
  let minLon = MIN_LONGITUDE
  let maxLon = MAX_LONGITUDE
  let isEven = true
  let bitCount = 0
  let result = 0
  while (bitCount < bits) {
    result *= 2
    if (isEven) {
      const avg = (minLon + maxLon) / 2
      if (longitude > avg) {
        result += 1
        minLon = avg
      } else {
        maxLon = avg
      }
    } else {
      const avg = (minLat + maxLat) / 2
      if (latitude > avg) {
        result += 1
        minLat = avg
      } else {
        maxLat = avg
      }
    }
    isEven = !isEven
    bitCount++
  }
  return result
}
const encodeInt = (latitude, longitude, bits) => {
  bits = toGeointBits(bits)
  latitude = toLatitude(latitude)
  longitude = toLongitude(longitude)
  return _encodeInt(latitude, longitude, bits)
}

const _encodeBigInt = (latitude, longitude, bits) => {
  let minLat = MIN_LATITUDE
  let maxLat = MAX_LATITUDE
  let minLon = MIN_LONGITUDE
  let maxLon = MAX_LONGITUDE
  let isEven = true
  let bitCount = 0
  let result = 0n
  while (bitCount < bits) {
    result *= 2n
    if (isEven) {
      const avg = (minLon + maxLon) / 2
      if (longitude > avg) {
        result += 1n
        minLon = avg
      } else {
        maxLon = avg
      }
    } else {
      const avg = (minLat + maxLat) / 2
      if (latitude > avg) {
        result += 1n
        minLat = avg
      } else {
        maxLat = avg
      }
    }
    isEven = !isEven
    bitCount++
  }
  return result
}
const encodeBigInt = (latitude, longitude, bits) => {
  bits = toGeobigintBits(bits)
  latitude = toLatitude(latitude)
  longitude = toLongitude(longitude)
  return _encodeBigInt(latitude, longitude, bits)
}

const _decodeBoundingBox = geohash => {
  const {length} = geohash
  let minLat = MIN_LATITUDE
  let maxLat = MAX_LATITUDE
  let minLon = MIN_LONGITUDE
  let maxLon = MAX_LONGITUDE
  let isEven = true
  for (let i = 0; i < length; i++) {
    const char = geohash[i]
    const index = alphabetLookup[char]
    if (index === undefined) {
      throw new SyntaxError(`Invalid character "${char}" at index ${i} for Geohash encoding`)
    }
    for (let bitCount = 4; bitCount >= 0; bitCount--) {
      const bit = index >> bitCount & 1
      if (isEven) {
        const avg = (minLon + maxLon) / 2
        if (bit === 1) {
          minLon = avg
        } else {
          maxLon = avg
        }
      } else {
        const avg = (minLat + maxLat) / 2
        if (bit === 1) {
          minLat = avg
        } else {
          maxLat = avg
        }
      }
      isEven = !isEven
    }
  }
  return [minLat, minLon, maxLat, maxLon]
}
const decodeBoundingBox = geohash => {
  if (!PrimitivesIsString(geohash)) {
    throw new TypeError('The geohash must be a string')
  }
  const {length} = geohash
  if (!length) {
    throw new RangeError('The length of the geohash must be greater than zero')
  }
  if (length > MAX_GEOHASH_PRECISION) {
    throw new RangeError('The length of the geohash must be less than or equal to 22')
  }
  return _decodeBoundingBox(geohash)
}

const _decodeBoundingBoxInt = (geoint, bits) => {
  const lastBit = bits - 1
  let minLat = MIN_LATITUDE
  let maxLat = MAX_LATITUDE
  let minLon = MIN_LONGITUDE
  let maxLon = MAX_LONGITUDE
  let isEven = true
  for (let i = 0; i < bits; i++) {
    const bit = getBit(geoint, lastBit - i)
    if (isEven) {
      const avg = (minLon + maxLon) / 2
      if (bit === 1) {
        minLon = avg
      } else {
        maxLon = avg
      }
    } else {
      const avg = (minLat + maxLat) / 2
      if (bit === 1) {
        minLat = avg
      } else {
        maxLat = avg
      }
    }
    isEven = !isEven
  }
  return [minLat, minLon, maxLat, maxLon]
}
const decodeBoundingBoxInt = (geoint, bits) => {
  bits = toGeointBits(bits)
  geoint = toGeoint(geoint)
  return _decodeBoundingBoxInt(geoint, bits)
}

const _decodeBoundingBoxBigInt = (geobigint, bits) => {
  const lastBit = bits - 1
  let minLat = MIN_LATITUDE
  let maxLat = MAX_LATITUDE
  let minLon = MIN_LONGITUDE
  let maxLon = MAX_LONGITUDE
  let isEven = true
  for (let i = 0; i < bits; i++) {
    const bit = getBigIntBit(geobigint, lastBit - i)
    if (isEven) {
      const avg = (minLon + maxLon) / 2
      if (bit === 1n) {
        minLon = avg
      } else {
        maxLon = avg
      }
    } else {
      const avg = (minLat + maxLat) / 2
      if (bit === 1n) {
        minLat = avg
      } else {
        maxLat = avg
      }
    }
    isEven = !isEven
  }
  return [minLat, minLon, maxLat, maxLon]
}
const decodeBoundingBoxBigInt = (geobigint, bits) => {
  bits = toGeobigintBits(bits)
  geobigint = toGeobigint(geobigint)
  return _decodeBoundingBoxBigInt(geobigint, bits)
}

const boundingBoxToLocation = (boundingBox, error) => {
  const [minLat, minLon, maxLat, maxLon] = boundingBox
  const latitude = (minLat + maxLat) / 2
  const longitude = (minLon + maxLon) / 2
  const location = {
    latitude,
    longitude
  }
  if (error) {
    const latError = maxLat - latitude
    const lonError = maxLon - longitude
    location.error = {
      latitude: latError,
      longitude: lonError
    }
  }
  return location
}

const decode = (geohash, error) => {
  const boundingBox = decodeBoundingBox(geohash)
  return boundingBoxToLocation(boundingBox, error)
}

const decodeInt = (geoint, bits, error) => {
  const boundingBox = decodeBoundingBoxInt(geoint, bits)
  return boundingBoxToLocation(boundingBox, error)
}

const decodeBigInt = (geobigint, bits, error) => {
  const boundingBox = decodeBoundingBoxBigInt(geobigint, bits)
  return boundingBoxToLocation(boundingBox, error)
}

const getNeighbor = (geohash, direction) => {
  validateDirection(direction)
  const [minLat, minLon, maxLat, maxLon] = decodeBoundingBox(geohash)
  const {length} = geohash
  const latitude = (minLat + maxLat) / 2
  const longitude = (minLon + maxLon) / 2
  const latError = maxLat - latitude
  const lonError = maxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const [latDir, lonDir] = directionLookup[direction]
  const neighborLat = wrapLatitude(latitude + latDir * perLat)
  const neighborLon = wrapLongitude(longitude + lonDir * perLon)
  return _encode(neighborLat, neighborLon, length)
}

const getNeighborInt = (geoint, direction, bits) => {
  bits = toGeointBits(bits)
  validateDirection(direction)
  geoint = toGeoint(geoint)
  const [minLat, minLon, maxLat, maxLon] = _decodeBoundingBoxInt(geoint, bits)
  const latitude = (minLat + maxLat) / 2
  const longitude = (minLon + maxLon) / 2
  const latError = maxLat - latitude
  const lonError = maxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const [latDir, lonDir] = directionLookup[direction]
  const neighborLat = wrapLatitude(latitude + latDir * perLat)
  const neighborLon = wrapLongitude(longitude + lonDir * perLon)
  return _encodeInt(neighborLat, neighborLon, bits)
}

const getNeighborBigInt = (geobigint, direction, bits) => {
  bits = toGeobigintBits(bits)
  validateDirection(direction)
  geobigint = toGeobigint(geobigint)
  const [minLat, minLon, maxLat, maxLon] = _decodeBoundingBoxBigInt(geobigint, bits)
  const latitude = (minLat + maxLat) / 2
  const longitude = (minLon + maxLon) / 2
  const latError = maxLat - latitude
  const lonError = maxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const [latDir, lonDir] = directionLookup[direction]
  const neighborLat = wrapLatitude(latitude + latDir * perLat)
  const neighborLon = wrapLongitude(longitude + lonDir * perLon)
  return _encodeBigInt(neighborLat, neighborLon, bits)
}

const getNeighbors = geohash => {
  const [minLat, minLon, maxLat, maxLon] = decodeBoundingBox(geohash)
  const {length} = geohash
  const latitude = (minLat + maxLat) / 2
  const longitude = (minLon + maxLon) / 2
  const latError = maxLat - latitude
  const lonError = maxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const neighbors = {}
  ArrayPrototypeForEach(directions, direction => {
    const [latDir, lonDir] = directionLookup[direction]
    const neighborLat = wrapLatitude(latitude + latDir * perLat)
    const neighborLon = wrapLongitude(longitude + lonDir * perLon)
    neighbors[direction] = _encode(neighborLat, neighborLon, length)
  })
  return neighbors
}

const getNeighborsInt = (geoint, bits) => {
  bits = toGeointBits(bits)
  geoint = toGeoint(geoint)
  const [minLat, minLon, maxLat, maxLon] = _decodeBoundingBoxInt(geoint, bits)
  const latitude = (minLat + maxLat) / 2
  const longitude = (minLon + maxLon) / 2
  const latError = maxLat - latitude
  const lonError = maxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const neighbors = {}
  ArrayPrototypeForEach(directions, direction => {
    const [latDir, lonDir] = directionLookup[direction]
    const neighborLat = wrapLatitude(latitude + latDir * perLat)
    const neighborLon = wrapLongitude(longitude + lonDir * perLon)
    neighbors[direction] = _encodeInt(neighborLat, neighborLon, bits)
  })
  return neighbors
}

const getNeighborsBigInt = (geobigint, bits) => {
  bits = toGeobigintBits(bits)
  geobigint = toGeobigint(geobigint)
  const [minLat, minLon, maxLat, maxLon] = _decodeBoundingBoxBigInt(geobigint, bits)
  const latitude = (minLat + maxLat) / 2
  const longitude = (minLon + maxLon) / 2
  const latError = maxLat - latitude
  const lonError = maxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const neighbors = {}
  ArrayPrototypeForEach(directions, direction => {
    const [latDir, lonDir] = directionLookup[direction]
    const neighborLat = wrapLatitude(latitude + latDir * perLat)
    const neighborLon = wrapLongitude(longitude + lonDir * perLon)
    neighbors[direction] = _encodeBigInt(neighborLat, neighborLon, bits)
  })
  return neighbors
}

const getBoundingBoxes = (minLat, minLon, maxLat, maxLon, precision) => {
  precision = toGeohashPrecision(precision)
  minLat = toLatitude(minLat)
  minLon = toLongitude(minLon)
  maxLat = toLatitude(maxLat)
  maxLon = toLongitude(maxLon)
  const southwestGeohash = _encode(minLat, minLon, precision)
  const northeastGeohash = _encode(maxLat, maxLon, precision)
  const [southwestMinLat, southwestMinLon, southwestMaxLat, southwestMaxLon] = _decodeBoundingBox(southwestGeohash)
  const [northeastMinLat, northeastMinLon] = _decodeBoundingBox(northeastGeohash)
  const latitude = (southwestMinLat + southwestMaxLat) / 2
  const longitude = (southwestMinLon + southwestMaxLon) / 2
  const latError = southwestMaxLat - latitude
  const lonError = southwestMaxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const latLength = MathRound((northeastMinLat - southwestMinLat) / perLat)
  const lonLength = MathRound((northeastMinLon - southwestMinLon) / perLon)
  const result = []
  if (NumberIsFinite(latLength) && NumberIsFinite(lonLength)) {
    for (let latDir = 0; latDir <= latLength; latDir++) {
      for (let lonDir = 0; lonDir <= lonLength; lonDir++) {
        const neighborLat = wrapLatitude(latitude + latDir * perLat)
        const neighborLon = wrapLongitude(longitude + lonDir * perLon)
        ArrayPrototypePush(result, _encode(neighborLat, neighborLon, precision))
      }
    }
  }
  return result
}

const getBoundingBoxesInt = (minLat, minLon, maxLat, maxLon, bits) => {
  bits = toGeointBits(bits)
  minLat = toLatitude(minLat)
  minLon = toLongitude(minLon)
  maxLat = toLatitude(maxLat)
  maxLon = toLongitude(maxLon)
  const southwestGeoint = _encodeInt(minLat, minLon, bits)
  const northeastGeoint = _encodeInt(maxLat, maxLon, bits)
  const [southwestMinLat, southwestMinLon, southwestMaxLat, southwestMaxLon] = _decodeBoundingBoxInt(southwestGeoint, bits)
  const [northeastMinLat, northeastMinLon] = _decodeBoundingBoxInt(northeastGeoint, bits)
  const latitude = (southwestMinLat + southwestMaxLat) / 2
  const longitude = (southwestMinLon + southwestMaxLon) / 2
  const latError = southwestMaxLat - latitude
  const lonError = southwestMaxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const latLength = MathRound((northeastMinLat - southwestMinLat) / perLat)
  const lonLength = MathRound((northeastMinLon - southwestMinLon) / perLon)
  const result = []
  if (NumberIsFinite(latLength) && NumberIsFinite(lonLength)) {
    for (let latDir = 0; latDir <= latLength; latDir++) {
      for (let lonDir = 0; lonDir <= lonLength; lonDir++) {
        const neighborLat = wrapLatitude(latitude + latDir * perLat)
        const neighborLon = wrapLongitude(longitude + lonDir * perLon)
        ArrayPrototypePush(result, _encodeInt(neighborLat, neighborLon, bits))
      }
    }
  }
  return result
}

const getBoundingBoxesBigInt = (minLat, minLon, maxLat, maxLon, bits) => {
  bits = toGeobigintBits(bits)
  minLat = toLatitude(minLat)
  minLon = toLongitude(minLon)
  maxLat = toLatitude(maxLat)
  maxLon = toLongitude(maxLon)
  const southwestGeobigint = _encodeBigInt(minLat, minLon, bits)
  const northeastGeobigint = _encodeBigInt(maxLat, maxLon, bits)
  const [southwestMinLat, southwestMinLon, southwestMaxLat, southwestMaxLon] = _decodeBoundingBoxBigInt(southwestGeobigint, bits)
  const [northeastMinLat, northeastMinLon] = _decodeBoundingBoxBigInt(northeastGeobigint, bits)
  const latitude = (southwestMinLat + southwestMaxLat) / 2
  const longitude = (southwestMinLon + southwestMaxLon) / 2
  const latError = southwestMaxLat - latitude
  const lonError = southwestMaxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const latLength = MathRound((northeastMinLat - southwestMinLat) / perLat)
  const lonLength = MathRound((northeastMinLon - southwestMinLon) / perLon)
  const result = []
  if (NumberIsFinite(latLength) && NumberIsFinite(lonLength)) {
    for (let latDir = 0; latDir <= latLength; latDir++) {
      for (let lonDir = 0; lonDir <= lonLength; lonDir++) {
        const neighborLat = wrapLatitude(latitude + latDir * perLat)
        const neighborLon = wrapLongitude(longitude + lonDir * perLon)
        ArrayPrototypePush(result, _encodeBigInt(neighborLat, neighborLon, bits))
      }
    }
  }
  return result
}

function* boundingBoxesGenerator(minLat, minLon, maxLat, maxLon, precision) {
  precision = toGeohashPrecision(precision)
  minLat = toLatitude(minLat)
  minLon = toLongitude(minLon)
  maxLat = toLatitude(maxLat)
  maxLon = toLongitude(maxLon)
  const southwestGeohash = _encode(minLat, minLon, precision)
  const northeastGeohash = _encode(maxLat, maxLon, precision)
  const [southwestMinLat, southwestMinLon, southwestMaxLat, southwestMaxLon] = _decodeBoundingBox(southwestGeohash)
  const [northeastMinLat, northeastMinLon] = _decodeBoundingBox(northeastGeohash)
  const latitude = (southwestMinLat + southwestMaxLat) / 2
  const longitude = (southwestMinLon + southwestMaxLon) / 2
  const latError = southwestMaxLat - latitude
  const lonError = southwestMaxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const latLength = MathRound((northeastMinLat - southwestMinLat) / perLat)
  const lonLength = MathRound((northeastMinLon - southwestMinLon) / perLon)
  if (NumberIsFinite(latLength) && NumberIsFinite(lonLength)) {
    for (let latDir = 0; latDir <= latLength; latDir++) {
      for (let lonDir = 0; lonDir <= lonLength; lonDir++) {
        const neighborLat = wrapLatitude(latitude + latDir * perLat)
        const neighborLon = wrapLongitude(longitude + lonDir * perLon)
        yield _encode(neighborLat, neighborLon, precision)
      }
    }
  }
}
const boundingBoxesSafeGenerator = (minLat, minLon, maxLat, maxLon, precision) =>
  new SafeGenerator(boundingBoxesGenerator(minLat, minLon, maxLat, maxLon, precision))

function* boundingBoxesIntGenerator(minLat, minLon, maxLat, maxLon, bits) {
  bits = toGeointBits(bits)
  minLat = toLatitude(minLat)
  minLon = toLongitude(minLon)
  maxLat = toLatitude(maxLat)
  maxLon = toLongitude(maxLon)
  const southwestGeoint = _encodeInt(minLat, minLon, bits)
  const northeastGeoint = _encodeInt(maxLat, maxLon, bits)
  const [southwestMinLat, southwestMinLon, southwestMaxLat, southwestMaxLon] = _decodeBoundingBoxInt(southwestGeoint, bits)
  const [northeastMinLat, northeastMinLon] = _decodeBoundingBoxInt(northeastGeoint, bits)
  const latitude = (southwestMinLat + southwestMaxLat) / 2
  const longitude = (southwestMinLon + southwestMaxLon) / 2
  const latError = southwestMaxLat - latitude
  const lonError = southwestMaxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const latLength = MathRound((northeastMinLat - southwestMinLat) / perLat)
  const lonLength = MathRound((northeastMinLon - southwestMinLon) / perLon)
  if (NumberIsFinite(latLength) && NumberIsFinite(lonLength)) {
    for (let latDir = 0; latDir <= latLength; latDir++) {
      for (let lonDir = 0; lonDir <= lonLength; lonDir++) {
        const neighborLat = wrapLatitude(latitude + latDir * perLat)
        const neighborLon = wrapLongitude(longitude + lonDir * perLon)
        yield _encodeInt(neighborLat, neighborLon, bits)
      }
    }
  }
}
const boundingBoxesIntSafeGenerator = (minLat, minLon, maxLat, maxLon, bits) =>
  new SafeGenerator(boundingBoxesIntGenerator(minLat, minLon, maxLat, maxLon, bits))

function* boundingBoxesBigIntGenerator(minLat, minLon, maxLat, maxLon, bits) {
  bits = toGeobigintBits(bits)
  minLat = toLatitude(minLat)
  minLon = toLongitude(minLon)
  maxLat = toLatitude(maxLat)
  maxLon = toLongitude(maxLon)
  const southwestGeobigint = _encodeBigInt(minLat, minLon, bits)
  const northeastGeobigint = _encodeBigInt(maxLat, maxLon, bits)
  const [southwestMinLat, southwestMinLon, southwestMaxLat, southwestMaxLon] = _decodeBoundingBoxBigInt(southwestGeobigint, bits)
  const [northeastMinLat, northeastMinLon] = _decodeBoundingBoxBigInt(northeastGeobigint, bits)
  const latitude = (southwestMinLat + southwestMaxLat) / 2
  const longitude = (southwestMinLon + southwestMaxLon) / 2
  const latError = southwestMaxLat - latitude
  const lonError = southwestMaxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const latLength = MathRound((northeastMinLat - southwestMinLat) / perLat)
  const lonLength = MathRound((northeastMinLon - southwestMinLon) / perLon)
  if (NumberIsFinite(latLength) && NumberIsFinite(lonLength)) {
    for (let latDir = 0; latDir <= latLength; latDir++) {
      for (let lonDir = 0; lonDir <= lonLength; lonDir++) {
        const neighborLat = wrapLatitude(latitude + latDir * perLat)
        const neighborLon = wrapLongitude(longitude + lonDir * perLon)
        yield _encodeBigInt(neighborLat, neighborLon, bits)
      }
    }
  }
}
const boundingBoxesBigIntSafeGenerator = (minLat, minLon, maxLat, maxLon, bits) =>
  new SafeGenerator(boundingBoxesBigIntGenerator(minLat, minLon, maxLat, maxLon, bits))

const getDistance = (latitude1, longitude1, latitude2, longitude2) => {
  latitude1 = toLatitude(latitude1)
  longitude1 = toLongitude(longitude1)
  latitude2 = toLatitude(latitude2)
  longitude2 = toLongitude(longitude2)
  const lat1Rad = degreesToRadians(latitude1)
  const lat2Rad = degreesToRadians(latitude2)
  const deltaLatRad = degreesToRadians(latitude2 - latitude1)
  const deltaLonRad = degreesToRadians(longitude2 - longitude1)
  const haversine = MathSin(deltaLatRad / 2) ** 2 + MathCos(lat1Rad) * MathCos(lat2Rad) * MathSin(deltaLonRad / 2) ** 2
  return EARTH_RADIUS * 2 * MathAsin(MathSqrt(haversine))
}

const getDistanceInMeters = (latitude1, longitude1, latitude2, longitude2) =>
  getDistance(latitude1, longitude1, latitude2, longitude2) * 1e3

const getVincentyDistance = (latitude1, longitude1, latitude2, longitude2) => {
  latitude1 = toLatitude(latitude1)
  longitude1 = toLongitude(longitude1)
  latitude2 = toLatitude(latitude2)
  longitude2 = toLongitude(longitude2)
  const lat1Rad = degreesToRadians(latitude1)
  const lat2Rad = degreesToRadians(latitude2)
  const a = EARTH_EQUATORIAL_RADIUS_IN_METERS
  const b = EARTH_POLAR_RADIUS_IN_METERS
  const f = EARTH_FLATTENING
  const L = degreesToRadians(longitude2 - longitude1)
  const U1 = MathAtan((1 - f) * MathTan(lat1Rad))
  const U2 = MathAtan((1 - f) * MathTan(lat2Rad))
  const sinU1 = MathSin(U1)
  const cosU1 = MathCos(U1)
  const sinU2 = MathSin(U2)
  const cosU2 = MathCos(U2)
  let cosSqAlpha = null
  let sinSigma = null
  let cosSigma = null
  let cos2SigmaM = null
  let sigma = null
  let lambda = L
  let lambdaP = null
  let index = 100
  do {
    const sinLambda = MathSin(lambda)
    const cosLambda = MathCos(lambda)
    sinSigma = MathSqrt((cosU2 * sinLambda) ** 2 + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) ** 2)
    if (sinSigma === 0) {
      return 0
    }
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda
    sigma = MathAtan2(sinSigma, cosSigma)
    const sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma
    cosSqAlpha = 1 - sinAlpha ** 2
    cos2SigmaM = cosSigma - sinU1 * 2 * sinU2 / cosSqAlpha
    const C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha))
    lambdaP = lambda
    lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + cos2SigmaM * 2 * cos2SigmaM)))
  } while (--index > 0 && MathAbs(lambda - lambdaP) > 1e-12)
  if (index === 0) {
    return 0
  }
  const uSq = cosSqAlpha * ((a ** 2 - b ** 2) / b ** 2)
  const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)))
  const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)))
  const deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (
    cosSigma * (-1 + cos2SigmaM * 2 ** 2) - B / 6 * cos2SigmaM * (-3 + sinSigma * 4 ** 2) * (-3 + cos2SigmaM * 4 ** 2)
  ))
  return b * A * (sigma - deltaSigma)
}

const Geohash = {}
ObjectDefineProperties(Geohash, {
  BASE: {
    value: BASE
  },
  ALPHABET: {
    value: ALPHABET
  },
  BITS_PER_CHAR: {
    value: BITS_PER_CHAR
  },
  MAX_GEOHASH_PRECISION: {
    value: MAX_GEOHASH_PRECISION
  },
  MAX_GEOHASH_PRECISION_BITS: {
    value: MAX_GEOHASH_PRECISION_BITS
  },
  MAX_GEOINT_BITS: {
    value: MAX_GEOINT_BITS
  },
  MAX_GEOBIGINT_BITS: {
    value: MAX_GEOBIGINT_BITS
  },
  MAX_GEOINT: {
    value: MAX_GEOINT
  },
  MAX_GEOBIGINT: {
    value: MAX_GEOBIGINT
  },
  GEOHASH_PRECISION: {
    value: GEOHASH_PRECISION
  },
  GEOINT_BITS: {
    value: GEOINT_BITS
  },
  GEOBIGINT_BITS: {
    value: GEOBIGINT_BITS
  },
  MIN_LATITUDE: {
    value: MIN_LATITUDE
  },
  MAX_LATITUDE: {
    value: MAX_LATITUDE
  },
  MIN_LONGITUDE: {
    value: MIN_LONGITUDE
  },
  MAX_LONGITUDE: {
    value: MAX_LONGITUDE
  },
  EARTH_EQUATORIAL_RADIUS: {
    value: EARTH_EQUATORIAL_RADIUS
  },
  EARTH_EQUATORIAL_RADIUS_IN_METERS: {
    value: EARTH_EQUATORIAL_RADIUS_IN_METERS
  },
  EARTH_POLAR_RADIUS: {
    value: EARTH_POLAR_RADIUS
  },
  EARTH_POLAR_RADIUS_IN_METERS: {
    value: EARTH_POLAR_RADIUS_IN_METERS
  },
  EARTH_RADIUS: {
    value: EARTH_RADIUS
  },
  EARTH_FLATTENING: {
    value: EARTH_FLATTENING
  },
  EARTH_ECCENTRICITY2: {
    value: EARTH_ECCENTRICITY2
  },
  getDirections: {
    value: getDirections
  },
  isDirection: {
    value: isDirection
  },
  isGeohash: {
    value: isGeohash
  },
  isGeoint: {
    value: isGeoint
  },
  toGeoint: {
    value: toGeoint
  },
  isGeobigint: {
    value: isGeobigint
  },
  toGeobigint: {
    value: toGeobigint
  },
  isLatitude: {
    value: isLatitude
  },
  toLatitude: {
    value: toLatitude
  },
  isLongitude: {
    value: isLongitude
  },
  toLongitude: {
    value: toLongitude
  },
  encode: {
    value: encode
  },
  encodeInt: {
    value: encodeInt
  },
  encodeBigInt: {
    value: encodeBigInt
  },
  decodeBoundingBox: {
    value: decodeBoundingBox
  },
  decodeBoundingBoxInt: {
    value: decodeBoundingBoxInt
  },
  decodeBoundingBoxBigInt: {
    value: decodeBoundingBoxBigInt
  },
  decode: {
    value: decode
  },
  decodeInt: {
    value: decodeInt
  },
  decodeBigInt: {
    value: decodeBigInt
  },
  getNeighbor: {
    value: getNeighbor
  },
  getNeighborInt: {
    value: getNeighborInt
  },
  getNeighborBigInt: {
    value: getNeighborBigInt
  },
  getNeighbors: {
    value: getNeighbors
  },
  getNeighborsInt: {
    value: getNeighborsInt
  },
  getNeighborsBigInt: {
    value: getNeighborsBigInt
  },
  getBoundingBoxes: {
    value: getBoundingBoxes
  },
  getBoundingBoxesInt: {
    value: getBoundingBoxesInt
  },
  getBoundingBoxesBigInt: {
    value: getBoundingBoxesBigInt
  },
  boundingBoxesGenerator: {
    value: boundingBoxesGenerator
  },
  boundingBoxesSafeGenerator: {
    value: boundingBoxesSafeGenerator
  },
  boundingBoxesIntGenerator: {
    value: boundingBoxesIntGenerator
  },
  boundingBoxesIntSafeGenerator: {
    value: boundingBoxesIntSafeGenerator
  },
  boundingBoxesBigIntGenerator: {
    value: boundingBoxesBigIntGenerator
  },
  boundingBoxesBigIntSafeGenerator: {
    value: boundingBoxesBigIntSafeGenerator
  },
  getDistance: {
    value: getDistance
  },
  getDistanceInMeters: {
    value: getDistanceInMeters
  },
  getVincentyDistance: {
    value: getVincentyDistance
  },
  [SymbolToStringTag]: {
    value: 'Geohash'
  }
})

export {
  BASE,
  ALPHABET,
  BITS_PER_CHAR,
  MAX_GEOHASH_PRECISION,
  MAX_GEOHASH_PRECISION_BITS,
  MAX_GEOINT_BITS,
  MAX_GEOBIGINT_BITS,
  MAX_GEOINT,
  MAX_GEOBIGINT,
  GEOHASH_PRECISION,
  GEOINT_BITS,
  GEOBIGINT_BITS,
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
  EARTH_EQUATORIAL_RADIUS,
  EARTH_EQUATORIAL_RADIUS_IN_METERS,
  EARTH_POLAR_RADIUS,
  EARTH_POLAR_RADIUS_IN_METERS,
  EARTH_RADIUS,
  EARTH_FLATTENING,
  EARTH_ECCENTRICITY2,
  getDirections,
  isDirection,
  isGeohash,
  isGeoint,
  toGeoint,
  isGeobigint,
  toGeobigint,
  isLatitude,
  toLatitude,
  isLongitude,
  toLongitude,
  encode,
  encodeInt,
  encodeBigInt,
  decodeBoundingBox,
  decodeBoundingBoxInt,
  decodeBoundingBoxBigInt,
  decode,
  decodeInt,
  decodeBigInt,
  getNeighbor,
  getNeighborInt,
  getNeighborBigInt,
  getNeighbors,
  getNeighborsInt,
  getNeighborsBigInt,
  getBoundingBoxes,
  getBoundingBoxesInt,
  getBoundingBoxesBigInt,
  boundingBoxesGenerator,
  boundingBoxesSafeGenerator,
  boundingBoxesIntGenerator,
  boundingBoxesIntSafeGenerator,
  boundingBoxesBigIntGenerator,
  boundingBoxesBigIntSafeGenerator,
  getDistance,
  getDistanceInMeters,
  getVincentyDistance
}
export default Geohash
