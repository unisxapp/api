import fetch from 'node-fetch'
import lodash from 'lodash'

import {BASKET, RAPID_API_KEY, CORRECTION_FACTOR, HISTORICAL_RANGE, HISTORICAL_INTERVAL} from './config.js'
import * as ethers from 'ethers'
const {FixedNumber, BigNumber} = ethers

export async function getPriceFN() {
  // Construct URL.
  // https://rapidapi.com/principalapis/api/stock-data-yahoo-finance-alternative/
  const symbolsStr = BASKET.join("%2C");
  const url = `https://stock-data-yahoo-finance-alternative.p.rapidapi.com/v6/finance/quote?symbols=${symbolsStr}`;
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-host": "stock-data-yahoo-finance-alternative.p.rapidapi.com",
      "x-rapidapi-key": RAPID_API_KEY,
    },
  };

  const response = await (await fetch(url, options)).json()

  const data = response && response.quoteResponse && response.quoteResponse.result;

  // Check responses.
  if (data == null || data.length == 0) {
    throw new Error(`Could not parse price result`);
  }

  // Parse results.
  // For every symbol, get last known price
  const prices = BASKET.map((symbol) => {
    const item = data.find((item) => item.symbol == symbol);
    if (item == null) {
      throw new Error(`Response lacks data for symbol ${symbol}`);
    }
    const rawPrice = item.regularMarketPrice;
    if (rawPrice == null) {
      throw new Error(`Response has no price for ${symbol}`);
    }
    return rawPrice;
  });

  return calculateBasketPrice(prices);
}

function calculateBasketPrice(stockPrices) {
  const prices = stockPrices.map((rawPrice) => FixedNumber.from(rawPrice.toString()));

  // Calculate average price
  let price = FixedNumber.from(0);
  for (const p of prices) {
    price = price.addUnsafe(p);
  }
  price = price.divUnsafe(FixedNumber.from(BASKET.length));

  // Apply correction factor
  price = price.mulUnsafe(FixedNumber.from(CORRECTION_FACTOR.toString()));

  return price
}

function intersectSets(a, b) {
  return new Set([...a].filter(i => b.has(i)));
}

async function doGetHistoricalPrices() {
  // Construct URL.
  // https://rapidapi.com/principalapis/api/stock-data-yahoo-finance-alternative/
  const symbolsStr = BASKET.join("%2C");
  const url = `https://stock-data-yahoo-finance-alternative.p.rapidapi.com/v8/finance/spark?symbols=${symbolsStr}&range=${HISTORICAL_RANGE}&interval=${HISTORICAL_INTERVAL}`;
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-host": "stock-data-yahoo-finance-alternative.p.rapidapi.com",
      "x-rapidapi-key": RAPID_API_KEY,
    },
  };
  const response = await (await fetch(url, options)).json()

  if (response == null) {
    throw new Error(`Invalid response from url ${url}`);
  }

  // Validate response
  for (const symbol of BASKET) {
    const stockData = response[symbol];
    if (stockData == null) {
      throw new Error(`Could not parse price result from url ${url}: missing data for symbol ${symbol}`);
    }
    if (stockData.timestamp.length == 0 || stockData.timestamp.length != stockData.close.length) {
      throw new Error(`Could not parse price result from url ${url}: invalid data for symbol ${symbol}`);
    }
    for (const ts of stockData.timestamp) {
      if (typeof ts != "number") {
        throw new Error("Could not parse data: invalid timestamp type");
      }
    }
    for (const p of stockData.close) {
      if (typeof p != "number") {
        throw new Error("Could not parse data: invalid price type");
      }
    }
    for (let i = 1; i < stockData.timestamp.length; i++) {
      if (stockData.timestamp[i] <= stockData.timestamp[i - 1]) {
        throw new Error(`Could not parse data: timestamps for ${symbol} are not increasing monotonously`);
      }
    }
  }

  // Data returned from API may lack some timestamps for some symbols. We only
  // use those timestamps that are present for all the symbols
  let timestamps = new Set(response[BASKET[0]].timestamp)
  for(let symbol of BASKET) {
    timestamps = intersectSets(timestamps, new Set(response[symbol].timestamp))
  }
  timestamps = [...timestamps].sort((a,b) => a - b)

  const result = timestamps.map(ts => {
    const prices = BASKET.map(symbol => {
      const index = response[symbol].timestamp.findIndex(t => ts == t)
      return response[symbol].close[index]
    })
    return {timestamp: ts, price: calculateBasketPrice(prices).toString()}
  })

  return result
}

async function doGetHistoricalPrice(time) {
  const now = Date.now()
  if(now < time) {
    throw new Error('moment in the past')
  }
  // Construct URL.
  // https://rapidapi.com/principalapis/api/stock-data-yahoo-finance-alternative/
  const symbolsStr = BASKET.join("%2C");
  /* range is a string with format `{number_of_days}d` */
  const range = '7d' // maximum available range for '1m' precision
  const url = `https://stock-data-yahoo-finance-alternative.p.rapidapi.com/v8/finance/spark?symbols=${symbolsStr}&range=${range}&interval=1m`;
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-host": "stock-data-yahoo-finance-alternative.p.rapidapi.com",
      "x-rapidapi-key": RAPID_API_KEY,
    },
  };
  const response = await (await fetch(url, options)).json()

  if (response == null) {
    throw new Error(`Invalid response from url ${url}`);
  }

  // Validate response
  for (const symbol of BASKET) {
    const stockData = response[symbol];
    if (stockData == null) {
      throw new Error(`Could not parse price result from url ${url}: missing data for symbol ${symbol}`);
    }
    if (stockData.timestamp.length == 0 || stockData.timestamp.length != stockData.close.length) {
      throw new Error(`Could not parse price result from url ${url}: invalid data for symbol ${symbol}`);
    }
    for (const ts of stockData.timestamp) {
      if (typeof ts != "number") {
        throw new Error("Could not parse data: invalid timestamp type");
      }
    }
    for (const p of stockData.close) {
      if (typeof p != "number") {
        throw new Error("Could not parse data: invalid price type");
      }
    }
    for (let i = 1; i < stockData.timestamp.length; i++) {
      if (stockData.timestamp[i] <= stockData.timestamp[i - 1]) {
        throw new Error(`Could not parse data: timestamps for ${symbol} are not increasing monotonously`);
      }
    }
  }

  // Get prices
  const prices = BASKET.map((symbol) => {
    const stockData = response[symbol];

    // iterate over timestamps and prices backwards, until we find timestamp
    // that is earlier then given time
    const result = lodash
      .zip(stockData.timestamp, stockData.close)
      .reverse()
      .find((item) => time >= item[0]);
    if (result == null) {
      throw new Error(`Could not get historical price for symbol ${symbol}: timestamp ${time} past last data point`);
    }
    const price = result[1];
    return price;
  });

  return calculateBasketPrice(prices).toString()
}

function now() {
  return Math.round(new Date().getTime() / 1000)
}

function cached(fn, ttl) {
  let cache = {}
  return async function(...args) {
    const key = args.join(',')
    const entry = cache[key]
    if(entry == null || entry.lastUpdateTime + ttl < now()) {
      cache[key] = {lastUpdateTime: now(), value: await fn(...args)}
    }
    return cache[key].value
  }
}

export const getPrice = cached(
  async function getPrice() {
    console.log('updating price')
    return (await getPriceFN()).toString()
  },
  3 * 60 // 3 minutes
)

export const getHistoricalPrices = cached(
  async function getHistoricalPrices() {
    console.log('updating historical prices')
    return await doGetHistoricalPrices()
  },
  12 * 3600, // 12 hours
)

export const getHistoricalPrice = cached(
  async function(timestamp) {
    console.log('updating historical price for timestamp', timestamp)
    return doGetHistoricalPrice(timestamp);
  },
  1_000_000 // forever
)
