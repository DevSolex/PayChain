import { Router } from 'express'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { getAccountBalance, isValidStellarAddress } from '../services/stellar'
import type { AuthRequest } from '../middleware/auth'

const router = Router()

router.use(authenticate)

// POST /api/wallets/connect — save wallet address
router.post('/connect', async (req: AuthRequest, res) => {
  const { address, network } = req.body
  if (!address) return res.status(400).json({ success: false, error: 'Address required' })

  if (network === 'STELLAR' && !isValidStellarAddress(address)) {
    return res.status(400).json({ success: false, error: 'Invalid Stellar address' })
  }

  const wallet = await prisma.wallet.upsert({
    where: { userId: req.user!.userId },
    update: { address, network: network || 'STELLAR' },
    create: { userId: req.user!.userId, address, network: network || 'STELLAR' },
  })

  res.json({ success: true, data: wallet })
})

// GET /api/wallets/balance/:address
router.get('/balance/:address', async (req: AuthRequest, res) => {
  const { address } = req.params
  if (!isValidStellarAddress(address)) {
    return res.status(400).json({ success: false, error: 'Invalid Stellar address' })
  }

  const balances = await getAccountBalance(address)
  res.json({ success: true, data: balances })
})

// GET /api/wallets/me
router.get('/me', async (req: AuthRequest, res) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.userId } })
  res.json({ success: true, data: wallet })
})

export default router
