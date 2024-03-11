import {
  loadFixture,
  time,
} from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { viem } from 'hardhat'
import { assert } from 'chai'
import { getAddress, parseUnits } from 'viem'
import type {
  PublicClient,
  WalletClient,
} from '@timeholder/asset-box/dist/test/common'
import type { TestTypes } from './common'
import { testGov } from './asserts/Gov'
import { deployProxy } from '../utils'

describe('TimeHolder', () => {
  async function deployFixture() {
    const publicClient = (await viem.getPublicClient()) as PublicClient
    const [guardian, user] = (await viem.getWalletClients()) as WalletClient[]

    const lockTime = 3600 * 24 * 30

    const TIME = await viem.deployContract('TIME')
    const TimeHolder = await deployProxy('TimeHolder', [TIME.address], {
      initializer: 'initialize',
      kind: 'uups',
    })

    const AssetLocker = (await viem.deployContract('AssetLocker' as never, [
      user.account.address,
      TimeHolder.address,
      lockTime,
    ])) as unknown as TestTypes['AssetLocker']

    await guardian.writeContract({
      address: TIME.address,
      abi: TIME.abi,
      functionName: 'transfer',
      args: [user.account.address, parseUnits(lockTime.toString(), 18)],
    })

    return {
      TIME,
      TimeHolder,
      AssetLocker,
      publicClient,
      guardian,
      user,
      lockTime,
    }
  }

  testGov('TimeHolder', async () => {
    const { TIME, TimeHolder, guardian } = await deployFixture()
    return {
      TIME,
      Gov: TimeHolder as unknown as TestTypes['Gov'],
      owner: guardian,
    }
  })

  describe('Functions', () => {
    it('#transferGuardianship()', async () => {
      const { TimeHolder, AssetLocker, guardian, user } =
        await loadFixture(deployFixture)
      await assert.isRejected(
        user.writeContract({
          address: TimeHolder.address,
          abi: TimeHolder.abi,
          functionName: 'transferGuardianship',
          args: [AssetLocker.address, user.account.address],
        }),
        'OwnableUnauthorizedAccount',
      )

      await guardian.writeContract({
        address: TimeHolder.address,
        abi: TimeHolder.abi,
        functionName: 'transferGuardianship',
        args: [AssetLocker.address, user.account.address],
      })
      assert.equal(
        await AssetLocker.read.guardian(),
        getAddress(user.account.address),
      )
    })

    it('#unlock() #getUnlockAmount()', async () => {
      const { TIME, TimeHolder, AssetLocker, user } =
        await loadFixture(deployFixture)
      assert((await AssetLocker.read.unlockTime()) > (await time.latest()))
      await assert.isRejected(
        user.writeContract({
          address: TimeHolder.address,
          abi: TimeHolder.abi,
          functionName: 'unlock',
          args: [AssetLocker.address],
        }),
        'ERC20InsufficientAllowance',
      )

      const amount = await TimeHolder.read.getUnlockAmount([
        AssetLocker.address,
      ])
      await user.writeContract({
        address: TIME.address,
        abi: TIME.abi,
        functionName: 'approve',
        args: [TimeHolder.address, amount],
      })
      await user.writeContract({
        address: TimeHolder.address,
        abi: TimeHolder.abi,
        functionName: 'unlock',
        args: [AssetLocker.address],
      })
      assert((await AssetLocker.read.unlockTime()) <= (await time.latest()))
    })

    it('#shortenUnlockTime() #getShortenUnlockTimeAmount()', async () => {
      const { TIME, TimeHolder, AssetLocker, user, lockTime } =
        await loadFixture(deployFixture)
      const unlockTime = await AssetLocker.read.unlockTime()
      assert(unlockTime > (await time.latest()))

      const shortenedTime = BigInt(lockTime * 0.3)
      await assert.isRejected(
        user.writeContract({
          address: TimeHolder.address,
          abi: TimeHolder.abi,
          functionName: 'shortenUnlockTime',
          args: [AssetLocker.address, shortenedTime],
        }),
        'ERC20InsufficientAllowance',
      )

      const amount = await TimeHolder.read.getShortenUnlockTimeAmount([
        AssetLocker.address,
        shortenedTime,
      ])
      await user.writeContract({
        address: TIME.address,
        abi: TIME.abi,
        functionName: 'approve',
        args: [TimeHolder.address, amount],
      })
      await user.writeContract({
        address: TimeHolder.address,
        abi: TimeHolder.abi,
        functionName: 'shortenUnlockTime',
        args: [AssetLocker.address, shortenedTime],
      })
      assert.equal(
        await AssetLocker.read.unlockTime(),
        unlockTime - shortenedTime,
      )
    })
  })
})
