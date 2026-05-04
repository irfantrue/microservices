import { ArgonHash } from '@shared/hash'
import { Effect } from 'effect'
import { describe, beforeAll, expect, it } from 'vitest'

describe('ArgonHash', () => {
    let argonHash: ArgonHash

    beforeAll(() => {
        argonHash = new ArgonHash()
    })

    describe('hash', () => {
        it('should return a hash string', async () => {
            const effect = argonHash.hash('password123')
            const result = await Effect.runPromise(effect)

            expect(result).toBeTypeOf('string')
            expect(result.length).toBeGreaterThan(0)
        })

        it('should generate unique hashes for same password', async () => {
            const password = 'password123'
            const hash1 = await Effect.runPromise(argonHash.hash(password))
            const hash2 = await Effect.runPromise(argonHash.hash(password))

            // Same password should produce different hashes (due to random salt)
            expect(hash1).not.toBe(hash2)
        })

        it('should generate argon2id format', async () => {
            const hash = await Effect.runPromise(argonHash.hash('password'))

            expect(hash.startsWith('$argon2id$')).toBe(true)
        })
    })

    describe('verify', () => {
        it('should return true for correct password', async () => {
            const password = 'correctPassword123'
            const hash = await Effect.runPromise(argonHash.hash(password))

            const result = await Effect.runPromise(argonHash.verify(password, hash))

            expect(result).toBe(true)
        })

        it('should return false for incorrect password', async () => {
            const password = 'correctPassword123'
            const wrongPassword = 'wrongPassword456'
            const hash = await Effect.runPromise(argonHash.hash(password))

            const result = await Effect.runPromise(argonHash.verify(wrongPassword, hash))

            expect(result).toBe(false)
        })

        it('should return false for invalid hash format', async () => {
            const result = await Effect.runPromise(
                argonHash.verify('password', 'invalid-hash-format'),
            )

            expect(result).toBe(false)
        })
    })
})
