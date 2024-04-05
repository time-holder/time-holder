import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { assert } from 'chai'
import { viem } from 'hardhat'
import { getAddress } from 'viem'
import { upgradeProxy } from '../../utils'
import { deployContracts } from '../common'
import { testWithdrawable } from '@timeholder/asset-box/dist/test/asserts/Withdrawable'
import type {
  PublicClient,
  WalletClient,
} from '@nomicfoundation/hardhat-viem/types'
import type { TestTypes } from '../common'

type StateTestOptions = {
  extra?: () => void
}

type SecurityTestOptions = {
  extra?: () => void
}

export function testGov(
  contractName: string,
  baseDeployFixture: () => Promise<{
    TIME: TestTypes['TIME']
    Gov: TestTypes['Gov']
    owner: WalletClient
  }>,
  {
    stateTest,
    securityTest,
  }: {
    stateTest?: StateTestOptions
    securityTest?: SecurityTestOptions
  } = {},
) {
  async function deployFixture() {
    const { TIME, Gov, owner } = await baseDeployFixture()
    const publicClient = (await viem.getPublicClient()) as PublicClient
    const walletClients = (await viem.getWalletClients()) as WalletClient[]
    const ownerIndex = walletClients.findIndex(
      client => client.account.address === owner.account.address,
    )

    const { USDC } = await deployContracts()

    return {
      USDC,
      TIME,
      Gov,
      publicClient,
      owner,
      hacker: walletClients[ownerIndex + 1],
    }
  }

  describe('State', () => {
    it('#owner()', async () => {
      const { owner, Gov } = await loadFixture(deployFixture)
      assert.equal(await Gov.read.owner(), getAddress(owner.account.address))
    })

    it('#govToken()', async () => {
      const { TIME, Gov } = await loadFixture(deployFixture)
      assert.equal(await Gov.read.govToken(), getAddress(TIME.address))
    })

    it('#govTokenDecimals()', async () => {
      const { TIME, Gov } = await loadFixture(deployFixture)
      assert.equal(
        await Gov.read.govTokenDecimals(),
        await TIME.read.decimals(),
      )
    })

    stateTest?.extra?.()
  })

  describe('Security', () => {
    it('#transferOwnership()', async () => {
      const { Gov, owner, hacker } = await loadFixture(deployFixture)
      await assert.isRejected(
        hacker.writeContract({
          address: Gov.address,
          abi: Gov.abi,
          functionName: 'transferOwnership',
          args: [hacker.account.address],
        }),
        'OwnableUnauthorizedAccount',
      )

      await owner.writeContract({
        address: Gov.address,
        abi: Gov.abi,
        functionName: 'transferOwnership',
        args: [hacker.account.address],
      })
      assert.equal(await Gov.read.owner(), getAddress(hacker.account.address))
    })

    it('#setGovToken()', async () => {
      const { USDC, Gov, owner, hacker } = await loadFixture(deployFixture)
      await assert.isRejected(
        hacker.writeContract({
          address: Gov.address,
          abi: Gov.abi,
          functionName: 'setGovToken',
          args: [USDC.address],
        }),
        'OwnableUnauthorizedAccount',
      )

      await owner.writeContract({
        address: Gov.address,
        abi: Gov.abi,
        functionName: 'setGovToken',
        args: [USDC.address],
      })
      assert.equal(await Gov.read.govToken(), getAddress(USDC.address))
    })

    securityTest?.extra?.()
  })

  describe('Upgradeable', () => {
    it('#version()', async () => {
      const { TIME, Gov } = await loadFixture(deployFixture)
      const version = await Gov.read.version()
      const version2 = await viem
        .deployContract(`${contractName}V2`)
        .then(c => c.read.version())
      const version3 = await viem
        .deployContract(`${contractName}V3`)
        .then(c => c.read.version())
      assert.notEqual(version, version2)
      assert.notEqual(version, version3)

      const address = Gov.address
      const balance = await TIME.read.balanceOf([Gov.address])

      await upgradeProxy(Gov.address, `${contractName}V2`)
      assert.equal(await Gov.read.version(), version2)
      assert.equal(Gov.address, address)
      assert.equal(await TIME.read.balanceOf([Gov.address]), balance)

      await upgradeProxy(Gov.address, `${contractName}V3`)
      assert.equal(await Gov.read.version(), version3)
      assert.equal(Gov.address, address)
      assert.equal(await TIME.read.balanceOf([Gov.address]), balance)
    })
  })

  testWithdrawable(async () => {
    const { Gov, owner } = await baseDeployFixture()
    return {
      Withdrawable: Gov as unknown as TestTypes['Withdrawable'],
      owner,
    }
  })
}
