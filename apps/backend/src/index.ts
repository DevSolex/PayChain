import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Security & middleware
app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }))
app.use(compression())
app.use(morgan('dev'))
app.use(express.json({ limit: '10kb' }))

// Rate limiting
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests' }))

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Routes (added incrementally)
app.use('/api/auth', (await import('./routes/auth.js')).default)
app.use('/api/employees', (await import('./routes/employees.js')).default)
app.use('/api/payroll', (await import('./routes/payroll.js')).default)
app.use('/api/analytics', (await import('./routes/analytics.js')).default)
app.use('/api/wallets', (await import('./routes/wallets.js')).default)

app.listen(PORT, () => console.log(`PayChain API running on port ${PORT}`))

export default app
