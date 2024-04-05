import type { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox-viem'
import '@openzeppelin/hardhat-upgrades'
import 'dotenv/config'

const accounts = [
  process.env.WALLET_PRIVATE_KEY as string
].filter(Boolean)

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      }
    }
  },
  networks: {
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts,
    },
    arbitrum: {
      url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts,
    },
    optimism: {
      url: `https://optimism-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts,
    },
    linea: {
      url: `https://linea-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts,
    },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts,
    },
    blast: {
      url: `https://blast-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts,
    },
    starknet: {
      url: `https://starknet-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts,
    },
    avalanche: {
      url: `https://avalanche-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts,
    },
  }
}

export default config
