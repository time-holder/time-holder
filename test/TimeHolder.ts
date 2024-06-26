import {
  loadFixture,
  time,
} from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { viem } from 'hardhat'
import { assert } from 'chai'
import { getAddress, parseEther, parseUnits, zeroAddress } from 'viem'
import { testGov } from './asserts/Gov'
import { deployProxy } from '../utils'
import { deployContracts } from './common'
import type {
  Address,
  Hash,
  ContractEventName,
  GetContractReturnType,
} from 'viem'
import type {
  PublicClient,
  WalletClient,
} from '@nomicfoundation/hardhat-viem/types'
import type { TestTypes } from './common'

describe('TimeHolder', () => {
  async function deployFixture() {
    const publicClient = (await viem.getPublicClient()) as PublicClient
    const [owner, user, hacker] =
      (await viem.getWalletClients()) as WalletClient[]

    const { TIME, USDC } = await deployContracts()
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

    const lockTime = 3600 * 24 * 30
    const AssetLocker = (await viem.deployContract('AssetLocker' as never, [
      user.account.address,
      TimeHolder.address,
      lockTime,
    ])) as unknown as TestTypes['AssetLocker']

    await owner.writeContract({
      address: TIME.address,
      abi: TIME.abi,
      functionName: 'transfer',
      args: [user.account.address, parseUnits(lockTime.toString(), 18)],
    })

    await user.writeContract({
      address: USDC.address,
      abi: USDC.abi,
      functionName: 'mint',
      args: [parseUnits(lockTime.toString(), 6)],
    })

    return {
      TIME,
      USDC,
      TimeHolder,
      AssetLocker,
      publicClient,
      owner,
      user,
      hacker,
      lockTime,
    }
  }

  async function getEventLog(
    TimeHolder: GetContractReturnType,
    publicClient: PublicClient,
    hash: Hash,
    eventName: ContractEventName<TestTypes['TimeHolder']['abi']>,
  ) {
    const transaction = await publicClient.waitForTransactionReceipt({ hash })
    const filter = await publicClient.createContractEventFilter({
      address: TimeHolder.address,
      abi: TimeHolder.abi,
      fromBlock: transaction.blockNumber,
      toBlock: transaction.blockNumber,
      eventName,
      strict: true,
    })
    const logs = await publicClient.getFilterLogs({ filter })
    return logs.find(log => log.transactionHash === hash)
  }

  testGov(
    'TimeHolder',
    async () => {
      const { TIME, TimeHolder, owner } = await deployFixture()
      return {
        TIME,
        Gov: TimeHolder as unknown as TestTypes['Gov'],
        owner,
      }
    },
    {
      stateTest: {
        extra: async () => {
          it('#creationFee()', async () => {
            const { TimeHolder, TIME } = await loadFixture(deployFixture)
            const creationFee = (await TimeHolder.read.creationFee()) as bigint
            assert.equal(
              creationFee,
              parseUnits('9998', await TIME.read.decimals()),
            )
          })

          it('#amountPerSecond()', async () => {
            const { TimeHolder } = await loadFixture(deployFixture)
            const amountPerSecond =
              (await TimeHolder.read.amountPerSecond()) as bigint
            const govTokenDecimals =
              (await TimeHolder.read.govTokenDecimals()) as number
            assert.equal(amountPerSecond, BigInt(10 ** govTokenDecimals))
          })
        },
      },
      securityTest: {
        extra: async () => {
          it('#setCreationFee()', async () => {
            const { TimeHolder, owner, hacker } =
              await loadFixture(deployFixture)

            await assert.isRejected(
              hacker.writeContract({
                address: TimeHolder.address,
                abi: TimeHolder.abi,
                functionName: 'setCreationFee',
                args: [0n],
              }),
              'OwnableUnauthorizedAccount',
            )

            await owner.writeContract({
              address: TimeHolder.address,
              abi: TimeHolder.abi,
              functionName: 'setCreationFee',
              args: [0n],
            })
            assert.equal(await TimeHolder.read.creationFee(), 0n)

            await owner.writeContract({
              address: TimeHolder.address,
              abi: TimeHolder.abi,
              functionName: 'setCreationFee',
              args: [parseEther('1')],
            })
            assert.equal(await TimeHolder.read.creationFee(), parseEther('1'))
          })

          it('#setAmountPerSecond()', async () => {
            const { TimeHolder, AssetLocker, owner, hacker } =
              await loadFixture(deployFixture)

            assert.notEqual(
              await TimeHolder.read.getAmountForUnlock([AssetLocker.address]),
              0n,
            )

            await assert.isRejected(
              hacker.writeContract({
                address: TimeHolder.address,
                abi: TimeHolder.abi,
                functionName: 'setAmountPerSecond',
                args: [0n],
              }),
              'OwnableUnauthorizedAccount',
            )

            await owner.writeContract({
              address: TimeHolder.address,
              abi: TimeHolder.abi,
              functionName: 'setAmountPerSecond',
              args: [0n],
            })
            assert.equal(await TimeHolder.read.amountPerSecond(), 0n)
            assert.equal(
              await TimeHolder.read.getAmountForUnlock([AssetLocker.address]),
              0n,
            )
          })
        },
      },
    },
  )

  describe('Functions', () => {
    it('#createAssetBox() use ERC20', async () => {
      const { TimeHolder, TIME, publicClient, user } =
        await loadFixture(deployFixture)

      await assert.isRejected(
        user.writeContract({
          address: TimeHolder.address,
          abi: TimeHolder.abi,
          functionName: 'createAssetBox',
          args: [user.account.address],
        }),
        'Underpayment',
      )

      const creationFee = (await TimeHolder.read.creationFee()) as bigint
      await user.writeContract({
        address: TIME.address,
        abi: TIME.abi,
        functionName: 'approve',
        args: [TimeHolder.address, creationFee],
      })
      const hash = await user.writeContract({
        address: TimeHolder.address,
        abi: TimeHolder.abi,
        functionName: 'createAssetBox',
        args: [user.account.address],
      })
      const log = await getEventLog(
        TimeHolder,
        publicClient,
        hash,
        'BoxCreated',
      )
      // @ts-ignore
      const boxAddress = log?.args?.box as Address
      const AssetBox = await viem.getContractAt('AssetBox', boxAddress)
      assert.equal(
        await AssetBox.read.owner(),
        getAddress(user.account.address),
      )
    })

    it('#createAssetBox() use ETH', async () => {
      const { TimeHolder, publicClient, owner, user } =
        await loadFixture(deployFixture)

      await owner.writeContract({
        address: TimeHolder.address,
        abi: TimeHolder.abi,
        functionName: 'setGovToken',
        args: [zeroAddress],
      })

      const creationFee = parseEther('0.001')
      await owner.writeContract({
        address: TimeHolder.address,
        abi: TimeHolder.abi,
        functionName: 'setCreationFee',
        args: [creationFee],
      })

      await assert.isRejected(
        user.writeContract({
          address: TimeHolder.address,
          abi: TimeHolder.abi,
          functionName: 'createAssetBox',
          args: [user.account.address],
        }),
        'Underpayment',
      )

      const hash = await user.writeContract({
        address: TimeHolder.address,
        abi: TimeHolder.abi,
        functionName: 'createAssetBox',
        args: [user.account.address],
        value: creationFee,
      })
      const log = await getEventLog(
        TimeHolder,
        publicClient,
        hash,
        'BoxCreated',
      )
      // @ts-ignore
      const boxAddress = log?.args?.box as Address
      const AssetBox = await viem.getContractAt('AssetBox', boxAddress)
      assert.equal(
        await AssetBox.read.owner(),
        getAddress(user.account.address),
      )
    })

    it('#createAssetLocker() use ERC20', async () => {
      const { TimeHolder, TIME, publicClient, user } =
        await loadFixture(deployFixture)
      const lockTime = 3600 * 24 * 30

      await assert.isRejected(
        user.writeContract({
          address: TimeHolder.address,
          abi: TimeHolder.abi,
          functionName: 'createAssetLocker',
          args: [user.account.address, TimeHolder.address, lockTime],
        }),
        'Underpayment',
      )

      const creationFee = (await TimeHolder.read.creationFee()) as bigint
      await user.writeContract({
        address: TIME.address,
        abi: TIME.abi,
        functionName: 'approve',
        args: [TimeHolder.address, creationFee],
      })
      const hash = await user.writeContract({
        address: TimeHolder.address,
        abi: TimeHolder.abi,
        functionName: 'createAssetLocker',
        args: [user.account.address, TimeHolder.address, lockTime],
      })
      const createTime = await time.latest()
      const log = await getEventLog(
        TimeHolder,
        publicClient,
        hash,
        'BoxCreated',
      )
      // @ts-ignore
      const boxAddress = log?.args?.box as Address
      const AssetLocker = await viem.getContractAt('AssetLocker', boxAddress)
      assert.equal(
        await AssetLocker.read.owner(),
        getAddress(user.account.address),
      )
      assert.equal(await AssetLocker.read.guardian(), TimeHolder.address)
      assert.equal(
        await AssetLocker.read.unlockTime(),
        BigInt(createTime + lockTime),
      )
    })

    it('#createAssetLocker() use ETH', async () => {
      const { TimeHolder, publicClient, owner, user } =
        await loadFixture(deployFixture)
      const lockTime = 3600 * 24 * 30

      await owner.writeContract({
        address: TimeHolder.address,
        abi: TimeHolder.abi,
        functionName: 'setGovToken',
        args: [zeroAddress],
      })

      const creationFee = parseEther('0.001')
      await owner.writeContract({
        address: TimeHolder.address,
        abi: TimeHolder.abi,
        functionName: 'setCreationFee',
        args: [creationFee],
      })

      await assert.isRejected(
        user.writeContract({
          address: TimeHolder.address,
          abi: TimeHolder.abi,
          functionName: 'createAssetLocker',
          args: [user.account.address, TimeHolder.address, lockTime],
        }),
        'Underpayment',
      )

      const hash = await user.writeContract({
        address: TimeHolder.address,
        abi: TimeHolder.abi,
        functionName: 'createAssetLocker',
        args: [user.account.address, TimeHolder.address, lockTime],
        value: creationFee,
      })
      const createTime = await time.latest()
      const log = await getEventLog(
        TimeHolder,
        publicClient,
        hash,
        'BoxCreated',
      )
      // @ts-ignore
      const boxAddress = log?.args?.box as Address
      const AssetLocker = await viem.getContractAt('AssetLocker', boxAddress)
      assert.equal(
        await AssetLocker.read.owner(),
        getAddress(user.account.address),
      )
      assert.equal(await AssetLocker.read.guardian(), TimeHolder.address)
      assert.equal(
        await AssetLocker.read.unlockTime(),
        BigInt(createTime + lockTime),
      )
    })

    it('#unlock() #getAmountForUnlock() use ERC20', async () => {
      const { TIME, USDC, TimeHolder, AssetLocker, user } =
        await loadFixture(deployFixture)
      assert((await AssetLocker.read.unlockTime()) > (await time.latest()))

      const amount = (await TimeHolder.read.getAmountForUnlock([
        AssetLocker.address,
      ])) as bigint

      await user.writeContract({
        address: USDC.address,
        abi: USDC.abi,
        functionName: 'approve',
        args: [TimeHolder.address, amount],
      })
      await assert.isRejected(
        user.writeContract({
          address: TimeHolder.address,
          abi: TimeHolder.abi,
          functionName: 'unlock',
          args: [AssetLocker.address],
        }),
        'Underpayment',
      )

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

    it('#unlock() #getAmountForUnlock() use ETH', async () => {
      const { TimeHolder, AssetLocker, owner, user } =
        await loadFixture(deployFixture)
      assert((await AssetLocker.read.unlockTime()) > (await time.latest()))

      await owner.writeContract({
        address: TimeHolder.address,
        abi: TimeHolder.abi,
        functionName: 'setGovToken',
        args: [zeroAddress],
      })

      await owner.writeContract({
        address: TimeHolder.address,
        abi: TimeHolder.abi,
        functionName: 'setAmountPerSecond',
        args: [parseEther('0.0000001')],
      })

      const amount = (await TimeHolder.read.getAmountForUnlock([
        AssetLocker.address,
      ])) as bigint

      await assert.isRejected(
        user.writeContract({
          address: TimeHolder.address,
          abi: TimeHolder.abi,
          functionName: 'unlock',
          args: [AssetLocker.address],
        }),
        'Underpayment',
      )

      await user.writeContract({
        address: TimeHolder.address,
        abi: TimeHolder.abi,
        functionName: 'unlock',
        args: [AssetLocker.address],
        value: amount,
      })
      assert((await AssetLocker.read.unlockTime()) <= (await time.latest()))
    })

    it('#shortenUnlockTime() #getAmountForShortenUnlockTime() use ERC20', async () => {
      const { TIME, USDC, TimeHolder, AssetLocker, user, lockTime } =
        await loadFixture(deployFixture)
      const unlockTime = await AssetLocker.read.unlockTime()
      assert(unlockTime > (await time.latest()))

      const shortenedTime = BigInt(lockTime * 0.3)
      const amount = (await TimeHolder.read.getAmountForShortenUnlockTime([
        AssetLocker.address,
        shortenedTime,
      ])) as bigint

      await user.writeContract({
        address: USDC.address,
        abi: USDC.abi,
        functionName: 'approve',
        args: [TimeHolder.address, amount],
      })
      await assert.isRejected(
        user.writeContract({
          address: TimeHolder.address,
          abi: TimeHolder.abi,
          functionName: 'shortenUnlockTime',
          args: [AssetLocker.address, shortenedTime],
        }),
        'Underpayment',
      )

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

    it('#shortenUnlockTime() #getAmountForShortenUnlockTime() use ETH', async () => {
      const { TimeHolder, AssetLocker, owner, user, lockTime } =
        await loadFixture(deployFixture)
      const unlockTime = await AssetLocker.read.unlockTime()
      assert(unlockTime > (await time.latest()))

      await owner.writeContract({
        address: TimeHolder.address,
        abi: TimeHolder.abi,
        functionName: 'setGovToken',
        args: [zeroAddress],
      })

      await owner.writeContract({
        address: TimeHolder.address,
        abi: TimeHolder.abi,
        functionName: 'setAmountPerSecond',
        args: [parseEther('0.0000001')],
      })

      const shortenedTime = BigInt(lockTime * 0.3)
      const amount = (await TimeHolder.read.getAmountForShortenUnlockTime([
        AssetLocker.address,
        shortenedTime,
      ])) as bigint

      await assert.isRejected(
        user.writeContract({
          address: TimeHolder.address,
          abi: TimeHolder.abi,
          functionName: 'shortenUnlockTime',
          args: [AssetLocker.address, shortenedTime],
        }),
        'Underpayment',
      )

      await user.writeContract({
        address: TimeHolder.address,
        abi: TimeHolder.abi,
        functionName: 'shortenUnlockTime',
        args: [AssetLocker.address, shortenedTime],
        value: amount,
      })
      assert.equal(
        await AssetLocker.read.unlockTime(),
        unlockTime - shortenedTime,
      )
    })

    it('#transferGuardianship()', async () => {
      const { TimeHolder, AssetLocker, owner, user } =
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

      await owner.writeContract({
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
  })
})
