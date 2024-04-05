import { viem } from 'hardhat'
import { getAddress, isAddress, parseUnits } from 'viem'
import { deployProxy } from '../utils'

const GOV_TOKEN_ADDRESS = process.env.GOV_TOKEN_ADDRESS as string

async function main() {
  if (!GOV_TOKEN_ADDRESS) {
    throw new Error('Please set the `GOV_TOKEN_ADDRESS` environment variable.')
  } else if (!isAddress(GOV_TOKEN_ADDRESS)) {
    throw new Error(`\`${GOV_TOKEN_ADDRESS}\` is not a valid Ethereum address.`)
  }

  const TIME = await viem.getContractAt(
    'TIME',
    getAddress(GOV_TOKEN_ADDRESS)
  )

  const creationFee = parseUnits('9998', await TIME.read.decimals())
  const amountPerSecond = BigInt(10 ** (await TIME.read.decimals()))
  const TimeHolder = await deployProxy(
    'TimeHolder',
    [TIME.address, creationFee, amountPerSecond],
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
