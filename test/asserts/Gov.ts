import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { assert } from 'chai'
import { viem } from 'hardhat'
import { getAddress } from 'viem'
import { upgradeProxy } from '../../utils'
import { testWithdrawable } from '@timeholder/asset-box/dist/test/asserts/Withdrawable'
import { deployContracts } from '@timeholder/asset-box/dist/test/common'
import type {
  PublicClient,
  WalletClient,
} from '@timeholder/asset-box/dist/test/common'
import type { TestTypes } from '../common'

type StateOptions = {
  extra?: () => void
}

type SecurityOptions = {
  extra?: () => void
}

export async function testGov(
  contractName: 'TimeHolder' | 'TimeSeller',
  baseDeployFixture: () => Promise<{
    TIME: TestTypes['TIME']
    Gov: TestTypes['Gov']
    owner: WalletClient
  }>,
  {
    State,
    Security,
  }: {
    State?: StateOptions
    Security?: SecurityOptions
  } = {},
) {
  async function deployFixture() {
    const { TIME, Gov, owner } = await baseDeployFixture()
    const testContracts = await deployContracts()
    const publicClient = (await viem.getPublicClient()) as PublicClient
    const walletClients = (await viem.getWalletClients()) as WalletClient[]
    const ownerIndex = walletClients.findIndex(
      client => client.account.address === owner.account.address,
    )

    return {
      ...testContracts,
      TIME,
      Gov,
      publicClient,
      guardian: owner,
      hacker: walletClients[ownerIndex + 1],
    }
  }

  describe('State', () => {
    it('#owner()', async () => {
      const { guardian, Gov } = await loadFixture(deployFixture)
      assert.equal(await Gov.read.owner(), getAddress(guardian.account.address))
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

    State?.extra?.()
  })

  describe('Security', () => {
    it('#transferOwnership()', async () => {
      const { Gov, guardian, hacker } = await loadFixture(deployFixture)
      await assert.isRejected(
        hacker.writeContract({
          address: Gov.address,
          abi: Gov.abi,
          functionName: 'transferOwnership',
          args: [hacker.account.address],
        }),
        'OwnableUnauthorizedAccount',
      )

      await guardian.writeContract({
        address: Gov.address,
        abi: Gov.abi,
        functionName: 'transferOwnership',
        args: [hacker.account.address],
      })
      assert.equal(await Gov.read.owner(), getAddress(hacker.account.address))
    })

    it('#setGovToken()', async () => {
      const { USDC, Gov, guardian, hacker } = await loadFixture(deployFixture)
      await assert.isRejected(
        hacker.writeContract({
          address: Gov.address,
          abi: Gov.abi,
          functionName: 'setGovToken',
          args: [USDC.address],
        }),
        'OwnableUnauthorizedAccount',
      )

      await guardian.writeContract({
        address: Gov.address,
        abi: Gov.abi,
        functionName: 'setGovToken',
        args: [USDC.address],
      })
      assert.equal(await Gov.read.govToken(), getAddress(USDC.address))
    })

    Security?.extra?.()
  })

  describe('Upgradeable', () => {
    it('#version()', async () => {
      const { TIME, Gov } = await loadFixture(deployFixture)
      const version = await Gov.read.version()
      // @ts-ignore
      const version2 = await viem.deployContract(`${contractName}V2`).then(c => c.read.version())
      // @ts-ignore
      const version3 = await viem.deployContract(`${contractName}V3`).then(c => c.read.version())
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
