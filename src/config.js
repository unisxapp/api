export const BASKET = ["DWAC", "IRDM", "PRIM", "TGLS", "MP", "LCID", "GDYN", "SMPL", "ENVX", "QS"]

export const CORRECTION_FACTOR = '1.0'

function get_value(key) {
  const value = process.env[key]
  if(value == null) {
    throw new Error(key + ' is not specified')
  }
  return value
}

export const RAPID_API_KEY = get_value('RAPID_API_KEY')
export const HISTORICAL_RANGE = get_value('HISTORICAL_RANGE')
export const HISTORICAL_INTERVAL = get_value('HISTORICAL_INTERVAL')
export const INFURA_API_KEY = get_value('INFURA_API_KEY')
export const USDC_ADDRESS = get_value('USDC_ADDRESS')
export const ETH_AMOUNT = get_value('ETH_AMOUNT')
export const USDC_AMOUNT = get_value('USDC_AMOUNT')
export const WALLET_PK = get_value('WALLET_PK')
