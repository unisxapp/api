import ethers from 'ethers'
import ERC20 from './ERC20_ABI.js'
import {USDC_ADDRESS, WALLET_PK, INFURA_API_KEY, USDC_AMOUNT, ETH_AMOUNT} from './config.js'

const CHAIN_ID = 42 // Kovan

const provider = new ethers.providers.InfuraProvider(CHAIN_ID, INFURA_API_KEY)
const wallet = new ethers.Wallet(WALLET_PK, provider)

const USDC = new ethers.Contract(USDC_ADDRESS, ERC20, wallet)
const decimals = await USDC.decimals()

async function faucetUSDC(to, nonce) {
  const USDCAmount = ethers.BigNumber.from(USDC_AMOUNT)
      .mul(ethers.BigNumber.from(10).pow(decimals))
  const tx = await USDC.transfer(to, USDCAmount, {nonce})
  return tx.hash
}

async function faucetEther(to, nonce) {
  const tx = await wallet.sendTransaction({to, nonce, value: ethers.utils.parseEther(ETH_AMOUNT)})
  return tx.hash
}

export async function faucet(to) {
  const nonce = await provider.getTransactionCount(wallet.address)
  const [_, txhash] = await Promise.all([
    faucetUSDC(to, nonce),
    faucetEther(to, nonce + 1),
  ])
  return txhash
}
