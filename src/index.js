import express from 'express'
import faucet from './faucet.js'
import {getPrice, getHistoricalPrices} from './price.js'

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
      res.json(await handler(req.body))
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

addHandler('post', '/faucet', async (data) => {
  const txhash = await faucet(data.to)
  return {txhash}
})

app.listen(port, () => {
  console.log('listening on port', port)
})
