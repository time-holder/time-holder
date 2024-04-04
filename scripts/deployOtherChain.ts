import { parseEther, zeroAddress } from 'viem'
import { deployProxy } from '../utils'

async function main() {
  const TimeHolder = await deployProxy(
    'TimeHolder',
    [zeroAddress, parseEther('0.001'), parseEther('0.0000001')],
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
