import { viem } from 'hardhat'
import { parseEther } from 'viem'
import { deployProxy } from '../utils'

async function main() {
  const TIME = await viem.deployContract('TIME')
  console.log(`TIME deployed to: ${TIME.address}`)

  const amountPerSecond = BigInt(10 ** (await TIME.read.decimals()))
  const TimeHolder = await deployProxy(
    'TimeHolder',
    [TIME.address, parseEther('0.001'), amountPerSecond],
    {
      initializer: 'initialize(address,uint256,uint256)',
      kind: 'uups',
    },
  )
  console.log(`TimeHolder deployed to: ${TimeHolder.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
