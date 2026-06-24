import NodeCache from 'node-cache'

// Global in-memory RAM cache for Termux performance
// Caches data for 10 minutes (600 seconds) by default
// Check period every 120 seconds to clean expired keys
const globalCache = new NodeCache({ stdTTL: 600, checkperiod: 120 })

export default globalCache
