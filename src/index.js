import express from 'express'
import {getPrice} from './price.js'

const app = express()
app.use(express.json())

const port = parseInt(process.env.PORT)
if(isNaN(port)) {
  throw new Error('PORT not specified')
}

app.get('/prices/uSPAC10', async (req, res) => {
  try {
    res.json({price: await getPrice()})
  } catch(e) {
    res.status(500).send('internal server error')
    throw e
  }
})

app.listen(port, () => {
  console.log('listening on port', port)
})
