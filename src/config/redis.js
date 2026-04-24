import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            this.client = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || undefined,
                db: process.env.REDIS_DB || 0,
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                }
            });

            this.client.on('connect', () => {
                this.isConnected = true;
                console.log('✅ Redis connected successfully');
            });

            this.client.on('error', (error) => {
                this.isConnected = false;
                console.error('❌ Redis error:', error.message);
            });

            await this.client.ping();
            return true;
        } catch (error) {
            console.error('❌ Failed to connect to Redis:', error.message);
            this.isConnected = false;
            return false;
        }
    }

    async get(key) {
        if (!this.isConnected) return null;
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            return null;
        }
    }

    async set(key, value, ttl = null) {
        if (!this.isConnected) return false;
        try {
            const stringValue = JSON.stringify(value);
            if (ttl) {
                await this.client.setex(key, ttl, stringValue);
            } else {
                await this.client.set(key, stringValue);
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    async del(key) {
        if (!this.isConnected) return false;
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            return false;
        }
    }

    async clearPattern(pattern) {
        if (!this.isConnected) return false;
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    async increment(key, ttl = null) {
        if (!this.isConnected) return null;
        try {
            const count = await this.client.incr(key);
            if (ttl && count === 1) {
                await this.client.expire(key, ttl);
            }
            return count;
        } catch (error) {
            return null;
        }
    }

    async exists(key) {
        if (!this.isConnected) return false;
        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            return false;
        }
    }

    disconnect() {
        if (this.client) {
            this.client.quit();
            this.isConnected = false;
        }
    }
}

const redisClient = new RedisClient();

// Auto-connect (non-blocking)
redisClient.connect().catch(console.error);

export default redisClient;