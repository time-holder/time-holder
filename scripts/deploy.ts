import { viem, ethers } from 'hardhat'
import { deployProxy } from '../utils'
import type { WalletClient } from '@timeholder/asset-box/dist/test/common'

async function main () {
  const TIME = await viem.deployContract('TIME')
  console.log(`TIME deployed to: ${TIME.address}`)

  const TimeHolder = await deployProxy(
    'TimeHolder',
    [
      TIME.address
    ],
    {
      initializer: 'initialize',
      kind: 'uups'
    }
  )
  console.log(`TimeHolder deployed to: ${TimeHolder.address}`)

  const currencies = [
    ethers.ZeroAddress
  ]
  const rates = [
    3_600n * 3_000n
  ]
  const TimeSeller = await deployProxy(
    'TimeSeller',
    [
      TIME.address,
      currencies,
      rates,
    ],
    {
      initializer: 'initialize(address,address[],uint256[])',
      kind: 'uups'
    }
  )
  console.log(`TimeSeller deployed to: ${TimeSeller.address}`)

  const [ owner ] = await viem.getWalletClients() as WalletClient[]
  await owner.writeContract({
    address: TIME.address,
    abi: TIME.abi,
    functionName: 'transfer',
    args: [ TimeSeller.address, await TIME.read.totalSupply() / 2n ]
  })
  const balance = await TIME.read.balanceOf([ TimeSeller.address ])
  console.log(`TIME transferred to TimeSeller: ${balance}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
