import {
  loadFixture,
  time,
} from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { viem } from 'hardhat'
import { getAddress, parseEther } from 'viem'
import { assert } from 'chai'
import type { TestTypes } from './common'
import type { WalletClient } from '@timeholder/asset-box/dist/test/common'
import { testAssetBox } from '@timeholder/asset-box/dist/test/asserts/AssetBox'

describe('AssetLocker', () => {
  async function deployFixture() {
    const [guardian, user] = (await viem.getWalletClients()) as WalletClient[]

    const lockTime = 3600 * 24 * 30

    const AssetLocker = (await viem.deployContract('AssetLocker' as never, [
      user.account.address,
      guardian.account.address,
      lockTime,
    ])) as unknown as TestTypes['AssetLocker']

    const createTime = await time.latest()

    return {
      AssetLocker,
      guardian,
      user,
      createTime,
      lockTime,
    }
  }

  testAssetBox(
    async () => {
      const { AssetLocker, user } = await deployFixture()
      return {
        AssetBox: AssetLocker as unknown as TestTypes['AssetBox'],
        owner: user,
      }
    },
    {
      stateTest: {
        extra: () => {
          it('#name()', async () => {
            const { AssetLocker } = await loadFixture(deployFixture)
            assert.equal(await AssetLocker.read.name(), 'AssetLocker')
          })

          it('#guardian()', async () => {
            const { AssetLocker, guardian } = await loadFixture(deployFixture)
            assert.equal(
              await AssetLocker.read.guardian(),
              getAddress(guardian.account.address),
            )
          })

          it('#unlockTime()', async () => {
            const { AssetLocker, createTime, lockTime } =
              await loadFixture(deployFixture)
            assert.equal(
              await AssetLocker.read.unlockTime(),
              BigInt(createTime + lockTime),
            )
          })

          it('#isUnlocked()', async () => {
            const { AssetLocker } = await loadFixture(deployFixture)
            assert.equal(await AssetLocker.read.isUnlocked(), false)
            await time.increaseTo(await AssetLocker.read.unlockTime())
            assert.equal(await AssetLocker.read.isUnlocked(), true)
          })
        },
      },
      securityTest: {
        extra: () => {
          it('#transferGuardianship()', async () => {
            const { AssetLocker, guardian, user } =
              await loadFixture(deployFixture)
            await assert.isRejected(
              user.writeContract({
                address: AssetLocker.address,
                abi: AssetLocker.abi,
                functionName: 'transferGuardianship',
                args: [user.account.address],
              }),
              'UnauthorizedAccount',
            )

            await guardian.writeContract({
              address: AssetLocker.address,
              abi: AssetLocker.abi,
              functionName: 'transferGuardianship',
              args: [user.account.address],
            })
            assert.equal(
              await AssetLocker.read.guardian(),
              getAddress(user.account.address),
            )
          })
        },
      },
      callableTest: {
        '#callContract()': async (data, props) => {
          const { guardian } = await deployFixture()
          const { WETH, NFT721, Callable, user } = data || {}
          const AssetLocker = Callable as unknown as TestTypes['AssetLocker']

          const { deposit, withdraw, safeTransferFrom } = props || {}

          await assert.isRejected(
            user.writeContract({
              address: AssetLocker.address,
              abi: AssetLocker.abi,
              functionName: 'callContract',
              args: [WETH.address, deposit, parseEther('10')],
            }),
            'UnlockTimeHasNotArrivedYet',
          )
          await assert.isRejected(
            user.writeContract({
              address: AssetLocker.address,
              abi: AssetLocker.abi,
              functionName: 'callContract',
              args: [WETH.address, withdraw],
            }),
            'UnlockTimeHasNotArrivedYet',
          )
          await assert.isRejected(
            user.writeContract({
              address: AssetLocker.address,
              abi: AssetLocker.abi,
              functionName: 'callContract',
              args: [NFT721.address, safeTransferFrom],
            }),
            'UnlockTimeHasNotArrivedYet',
          )

          await time.increaseTo(await AssetLocker.read.unlockTime())

          await assert.isRejected(
            guardian.writeContract({
              address: AssetLocker.address,
              abi: AssetLocker.abi,
              functionName: 'callContract',
              args: [WETH.address, deposit, parseEther('10')],
            }),
            'OwnableUnauthorizedAccount',
          )
          await assert.isRejected(
            guardian.writeContract({
              address: AssetLocker.address,
              abi: AssetLocker.abi,
              functionName: 'callContract',
              args: [WETH.address, withdraw],
            }),
            'OwnableUnauthorizedAccount',
          )
          await assert.isRejected(
            guardian.writeContract({
              address: AssetLocker.address,
              abi: AssetLocker.abi,
              functionName: 'callContract',
              args: [NFT721.address, safeTransferFrom],
            }),
            'OwnableUnauthorizedAccount',
          )
        },
      },
      withdrawableTest: {
        '#withdraw()': async data => {
          const { guardian } = await deployFixture()
          const { Withdrawable, user } = data || {}
          const AssetLocker =
            Withdrawable as unknown as TestTypes['AssetLocker']

          await assert.isRejected(
            user.writeContract({
              address: AssetLocker.address,
              abi: AssetLocker.abi,
              functionName: 'withdraw',
            }),
            'UnlockTimeHasNotArrivedYet',
          )

          await time.increaseTo(await AssetLocker.read.unlockTime())

          await assert.isRejected(
            guardian.writeContract({
              address: AssetLocker.address,
              abi: AssetLocker.abi,
              functionName: 'withdraw',
            }),
            'OwnableUnauthorizedAccount',
          )
        },
        '#withdrawERC20()': async data => {
          const { guardian } = await deployFixture()
          const { USDC, Withdrawable, user } = data || {}
          const AssetLocker =
            Withdrawable as unknown as TestTypes['AssetLocker']

          await assert.isRejected(
            user.writeContract({
              address: AssetLocker.address,
              abi: AssetLocker.abi,
              functionName: 'withdrawERC20',
              args: [USDC.address],
            }),
            'UnlockTimeHasNotArrivedYet',
          )

          await time.increaseTo(await AssetLocker.read.unlockTime())

          await assert.isRejected(
            guardian.writeContract({
              address: AssetLocker.address,
              abi: AssetLocker.abi,
              functionName: 'withdrawERC20',
              args: [USDC.address],
            }),
            'OwnableUnauthorizedAccount',
          )
        },
        '#withdrawERC721()': async (data, { params, functionSignature }) => {
          const { guardian } = await deployFixture()
          const { Withdrawable, user } = data || {}
          const AssetLocker =
            Withdrawable as unknown as TestTypes['AssetLocker']

          await assert.isRejected(
            user.writeContract({
              address: AssetLocker.address,
              abi: AssetLocker.abi,
              functionName: functionSignature,
              args: params,
            }),
            'UnlockTimeHasNotArrivedYet',
          )

          await time.increaseTo(await AssetLocker.read.unlockTime())

          await assert.isRejected(
            guardian.writeContract({
              address: AssetLocker.address,
              abi: AssetLocker.abi,
              functionName: functionSignature,
              args: params,
            }),
            'OwnableUnauthorizedAccount',
          )
        },
        '#withdrawERC1155()': async (data, { params, functionSignature }) => {
          const { guardian } = await deployFixture()
          const { Withdrawable, user } = data || {}
          const AssetLocker =
            Withdrawable as unknown as TestTypes['AssetLocker']

          await assert.isRejected(
            user.writeContract({
              address: AssetLocker.address,
              abi: AssetLocker.abi,
              functionName: functionSignature,
              args: params,
            }),
            'UnlockTimeHasNotArrivedYet',
          )

          await time.increaseTo(await AssetLocker.read.unlockTime())

          await assert.isRejected(
            guardian.writeContract({
              address: AssetLocker.address,
              abi: AssetLocker.abi,
              functionName: functionSignature,
              args: params,
            }),
            'OwnableUnauthorizedAccount',
          )
        },
        '#withdrawERC1155Batch()': async (
          data,
          { params, functionSignature },
        ) => {
          const { guardian } = await deployFixture()
          const { Withdrawable, user } = data || {}
          const AssetLocker =
            Withdrawable as unknown as TestTypes['AssetLocker']

          await assert.isRejected(
            user.writeContract({
              address: AssetLocker.address,
              abi: AssetLocker.abi,
              functionName: functionSignature,
              args: params,
            }),
            'UnlockTimeHasNotArrivedYet',
          )

          await time.increaseTo(await AssetLocker.read.unlockTime())

          await assert.isRejected(
            guardian.writeContract({
              address: AssetLocker.address,
              abi: AssetLocker.abi,
              functionName: functionSignature,
              args: params,
            }),
            'OwnableUnauthorizedAccount',
          )
        },
      },
    },
  )

  describe('Functions', () => {
    it('#unlock()', async () => {
      const { AssetLocker, guardian, user } = await loadFixture(deployFixture)
      assert((await AssetLocker.read.unlockTime()) > (await time.latest()))
      await assert.isRejected(
        user.writeContract({
          address: AssetLocker.address,
          abi: AssetLocker.abi,
          functionName: 'unlock',
        }),
        'UnauthorizedAccount',
      )

      await guardian.writeContract({
        address: AssetLocker.address,
        abi: AssetLocker.abi,
        functionName: 'unlock',
      })
      assert((await AssetLocker.read.unlockTime()) <= (await time.latest()))
    })

    it('#shortenUnlockTime()', async () => {
      const { AssetLocker, guardian, user, lockTime } =
        await loadFixture(deployFixture)
      const unlockTime = await AssetLocker.read.unlockTime()
      assert(unlockTime > (await time.latest()))

      const shortenedTime = BigInt(lockTime * 0.3)
      await assert.isRejected(
        user.writeContract({
          address: AssetLocker.address,
          abi: AssetLocker.abi,
          functionName: 'shortenUnlockTime',
          args: [shortenedTime],
        }),
        'UnauthorizedAccount',
      )

      await guardian.writeContract({
        address: AssetLocker.address,
        abi: AssetLocker.abi,
        functionName: 'shortenUnlockTime',
        args: [shortenedTime],
      })
      assert.equal(
        await AssetLocker.read.unlockTime(),
        unlockTime - shortenedTime,
      )
    })
  })
})
