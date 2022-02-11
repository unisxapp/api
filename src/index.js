import express from 'express'
import {getPrice, getHistoricalPrices} from './price.js'

const app = express()
app.set('json spaces', 2)

const port = parseInt(process.env.PORT)
if(isNaN(port)) {
  throw new Error('PORT not specified')
}

function addHandler(route, handler) {
  app.get(route, async (req, res) => {
    try {
      res.json(await handler())
    } catch(e) {
      console.error(e)
      res.status(500).send('internal server error')
    }
  })
}

addHandler('/prices/uSPAC10', async () => {
  return {price: await getPrice()}
})

addHandler('/historicalPrices/uSPAC10', async () => {
  const prices = await getHistoricalPrices()
  return prices.map(p => ({
    ...p,
    date: new Date(p.timestamp*1000).toISOString().slice(0, 10)
  }))
})

app.listen(port, () => {
  console.log('listening on port', port)
})
