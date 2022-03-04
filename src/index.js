import express from 'express'
import {getPrice, getHistoricalPrices, getHistoricalPrice} from './price.js'
import {FAUCET_ENABLED} from './config.js'

const app = express()
app.use(express.json())
app.set('json spaces', 2)

const port = parseInt(process.env.PORT)
if(isNaN(port)) {
  throw new Error('PORT not specified')
}

function addHandler(method, route, handler) {
  app[method](route, async (req, res) => {
    try {
      res.json(await handler(req))
    } catch(e) {
      console.error(e)
      res.status(500).send('internal server error')
    }
  })
}

addHandler('get', '/prices/uSPAC10', async () => {
  return {price: await getPrice()}
})

addHandler('get', '/historicalPrices/uSPAC10', async () => {
  const prices = await getHistoricalPrices()
  return prices.map(p => ({
    ...p,
    date: new Date(p.timestamp*1000).toISOString().slice(0, 10)
  }))
})

addHandler('get', '/historicalPrice/uSPAC10', async (req) => {
  const price = await getHistoricalPrice(req.query.timestamp)
  return {price}
})

if(FAUCET_ENABLED) {
  const {faucet} = await import('./faucet.js');
  addHandler('post', '/faucet', async (req) => {
    const txhash = await faucet(req.body.to)
    return {txhash}
  })
}

app.listen(port, () => {
  console.log('listening on port', port)
})
