export const BASKET = ["DWAC", "IRDM", "PRIM", "TGLS", "MP", "LCID", "GDYN", "SMPL", "ENVX", "QS"]

export const CORRECTION_FACTOR = '1.0'

export const RAPID_API_KEY = process.env.RAPID_API_KEY

if(RAPID_API_KEY == null) {
  throw new Error('RAPID_API_KEY is not specified')
}

export const HISTORICAL_RANGE = process.env.HISTORICAL_RANGE

if(HISTORICAL_RANGE == null) {
  throw new Error('HISTORICAL_RANGE is not specified')
}

export const HISTORICAL_INTERVAL = process.env.HISTORICAL_INTERVAL

if(HISTORICAL_INTERVAL == null) {
  throw new Error('HISTORICAL_INTERVAL is not specified')
}
