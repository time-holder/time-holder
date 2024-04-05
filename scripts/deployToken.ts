import { viem } from 'hardhat'

async function main() {
  const TIME = await viem.deployContract('TIME')
  console.log(`TIME deployed to: ${TIME.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
