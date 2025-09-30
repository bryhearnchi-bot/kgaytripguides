import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateInvitationToken,
  hashToken,
  validateTokenTiming,
  isTokenExpired,
  generateInvitationId,
  createInvitationRecord,
  SECURITY_CONFIG,
  type InvitationData,
  type InvitationToken,
} from '../invitation-tokens';

describe('Invitation Tokens Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateInvitationToken', () => {
    it('should generate a secure token with all required properties', () => {
      const result = generateInvitationToken();

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('salt');
      expect(result).toHaveProperty('expiresAt');

      expect(typeof result.token).toBe('string');
      expect(typeof result.hash).toBe('string');
      expect(typeof result.salt).toBe('string');
      expect(typeof result.expiresAt).toBe('string');
    });

    it('should generate tokens of correct length', () => {
      const result = generateInvitationToken();

      // Token should be 64 chars (32 bytes hex-encoded)
      expect(result.token).toHaveLength(64);
      // Salt should be 32 chars (16 bytes hex-encoded)
      expect(result.salt).toHaveLength(32);
      // SHA-256 hash should be 64 chars
      expect(result.hash).toHaveLength(64);
    });

    it('should generate unique tokens on each call', () => {
      const token1 = generateInvitationToken();
      const token2 = generateInvitationToken();

      expect(token1.token).not.toBe(token2.token);
      expect(token1.hash).not.toBe(token2.hash);
      expect(token1.salt).not.toBe(token2.salt);
    });

    it('should set correct expiration time', () => {
      const expirationHours = 48;
      const before = Date.now();
      const result = generateInvitationToken(expirationHours);
      const after = Date.now();

      const expiresAt = new Date(result.expiresAt).getTime();
      const expectedMin = before + expirationHours * 60 * 60 * 1000;
      const expectedMax = after + expirationHours * 60 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });

    it('should throw error for invalid expiration hours', () => {
      expect(() => generateInvitationToken(0)).toThrow();
      expect(() => generateInvitationToken(-1)).toThrow();
      expect(() => generateInvitationToken(200)).toThrow(); // > 1 week
    });

    it('should use default expiration when not specified', () => {
      const result = generateInvitationToken();
      const expiresAt = new Date(result.expiresAt).getTime();
      const now = Date.now();
      const expectedExpiration = now + SECURITY_CONFIG.DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000;

      // Allow 1 second tolerance
      expect(Math.abs(expiresAt - expectedExpiration)).toBeLessThan(1000);
    });
  });

  describe('hashToken', () => {
    it('should generate consistent hashes for same token and salt', () => {
      const token = 'test-token-12345';
      const salt = 'test-salt-67890';

      const hash1 = hashToken(token, salt);
      const hash2 = hashToken(token, salt);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex length
    });

    it('should generate different hashes for different tokens', () => {
      const salt = 'same-salt-long-enough';

      const hash1 = hashToken('token1-long-enough', salt);
      const hash2 = hashToken('token2-long-enough', salt);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes for different salts', () => {
      const token = 'same-token-long-enough';

      const hash1 = hashToken(token, 'salt1-long-enough');
      const hash2 = hashToken(token, 'salt2-long-enough');

      expect(hash1).not.toBe(hash2);
    });

    it('should throw error for invalid token', () => {
      expect(() => hashToken('', 'valid-salt')).toThrow();
      expect(() => hashToken('short', 'valid-salt')).toThrow();
    });

    it('should throw error for invalid salt', () => {
      expect(() => hashToken('valid-token-12345', '')).toThrow();
      expect(() => hashToken('valid-token-12345', 'short')).toThrow();
    });

    it('should produce cryptographically strong hashes', () => {
      const token = 'test-token-12345';
      const salt = 'test-salt-67890';
      const hash = hashToken(token, salt);

      // Hash should be hex string
      expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);

      // Small change in input should produce completely different hash
      const similarToken = 'test-token-12346'; // Last char changed
      const similarHash = hashToken(similarToken, salt);

      // Hamming distance should be roughly 50% for cryptographic hash
      let differences = 0;
      for (let i = 0; i < hash.length; i++) {
        if (hash[i] !== similarHash[i]) differences++;
      }

      expect(differences).toBeGreaterThan(20); // At least 1/3 different
    });
  });

  describe('validateTokenTiming', () => {
    it('should validate correct token/hash/salt combination', () => {
      const token = 'test-token-very-long-and-secure-12345678';
      const salt = 'test-salt-also-very-long-and-secure-67890';
      const hash = hashToken(token, salt);

      const isValid = validateTokenTiming(token, hash, salt);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect token', () => {
      const token = 'test-token-very-long-and-secure-12345678';
      const wrongToken = 'wrong-token-very-long-and-secure-12345678';
      const salt = 'test-salt-also-very-long-and-secure-67890';
      const hash = hashToken(token, salt);

      const isValid = validateTokenTiming(wrongToken, hash, salt);
      expect(isValid).toBe(false);
    });

    it('should reject incorrect hash', () => {
      const token = 'test-token-very-long-and-secure-12345678';
      const salt = 'test-salt-also-very-long-and-secure-67890';
      const wrongHash = 'a'.repeat(64); // Wrong but valid length hash

      const isValid = validateTokenTiming(token, wrongHash, salt);
      expect(isValid).toBe(false);
    });

    it('should reject incorrect salt', () => {
      const token = 'test-token-very-long-and-secure-12345678';
      const salt = 'test-salt-also-very-long-and-secure-67890';
      const wrongSalt = 'wrong-salt-also-very-long-and-secure-67890';
      const hash = hashToken(token, salt);

      const isValid = validateTokenTiming(token, hash, wrongSalt);
      expect(isValid).toBe(false);
    });

    it('should handle malformed inputs gracefully', () => {
      expect(validateTokenTiming('', 'hash', 'salt')).toBe(false);
      expect(validateTokenTiming('token', '', 'salt')).toBe(false);
      expect(validateTokenTiming('token', 'hash', '')).toBe(false);
      expect(validateTokenTiming('short', 'hash'.repeat(16), 'salt'.repeat(8))).toBe(false);
    });

    it('should be timing-safe (basic test)', () => {
      const token = 'test-token-very-long-and-secure-12345678';
      const salt = 'test-salt-also-very-long-and-secure-67890';
      const hash = hashToken(token, salt);

      // Test with completely wrong token vs token with 1 char different
      const wrongToken1 = 'x'.repeat(token.length);
      const wrongToken2 = `${token.slice(0, -1)}x`;

      const start1 = process.hrtime.bigint();
      validateTokenTiming(wrongToken1, hash, salt);
      const time1 = process.hrtime.bigint() - start1;

      const start2 = process.hrtime.bigint();
      validateTokenTiming(wrongToken2, hash, salt);
      const time2 = process.hrtime.bigint() - start2;

      // Times should be relatively similar (within 10x factor)
      // This is a basic test - real timing attack prevention needs more sophisticated analysis
      const ratio = Number(time1 > time2 ? time1 / time2 : time2 / time1);
      expect(ratio).toBeLessThan(10);
    });
  });

  describe('isTokenExpired', () => {
    it('should detect expired tokens', () => {
      const pastDate = new Date(Date.now() - 1000); // 1 second ago
      expect(isTokenExpired(pastDate)).toBe(true);
      expect(isTokenExpired(pastDate.toISOString())).toBe(true);
    });

    it('should detect non-expired tokens', () => {
      const futureDate = new Date(Date.now() + 1000); // 1 second from now
      expect(isTokenExpired(futureDate)).toBe(false);
      expect(isTokenExpired(futureDate.toISOString())).toBe(false);
    });

    it('should handle edge case at exact expiration', () => {
      // Mock Date.now to control timing
      const fixedTime = 1000000000000;
      vi.spyOn(Date, 'now').mockReturnValue(fixedTime);

      const exactExpirationDate = new Date(fixedTime);
      expect(isTokenExpired(exactExpirationDate)).toBe(false); // Should not be expired at exact time

      const slightlyPastDate = new Date(fixedTime - 1);
      expect(isTokenExpired(slightlyPastDate)).toBe(true);
    });
  });

  describe('generateInvitationId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateInvitationId();
      const id2 = generateInvitationId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^inv_[a-f0-9]{32}$/);
      expect(id2).toMatch(/^inv_[a-f0-9]{32}$/);
    });

    it('should always start with inv_ prefix', () => {
      for (let i = 0; i < 10; i++) {
        const id = generateInvitationId();
        expect(id).toMatch(/^inv_/);
      }
    });
  });

  describe('createInvitationRecord', () => {
    const validInvitationData: InvitationData = {
      email: 'test@example.com',
      role: 'admin',
      invitedBy: 'admin-user-123',
      cruiseId: 'cruise-456',
      metadata: { source: 'admin-panel' },
    };

    it('should create complete invitation record', () => {
      const record = createInvitationRecord(validInvitationData);

      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('email', validInvitationData.email);
      expect(record).toHaveProperty('role', validInvitationData.role);
      expect(record).toHaveProperty('invitedBy', validInvitationData.invitedBy);
      expect(record).toHaveProperty('cruiseId', validInvitationData.cruiseId);
      expect(record).toHaveProperty('metadata', validInvitationData.metadata);
      expect(record).toHaveProperty('tokenHash');
      expect(record).toHaveProperty('salt');
      expect(record).toHaveProperty('expiresAt');
      expect(record).toHaveProperty('createdAt');
      expect(record).toHaveProperty('used', false);
      expect(record).toHaveProperty('token'); // Raw token for sending

      expect(record.id).toMatch(/^inv_[a-f0-9]{32}$/);
      expect(record.tokenHash).toHaveLength(64);
      expect(record.salt).toHaveLength(32);
      expect(record.token).toHaveLength(64);
    });

    it('should validate input data', () => {
      expect(() =>
        createInvitationRecord({
          ...validInvitationData,
          email: 'invalid-email',
        })
      ).toThrow();

      expect(() =>
        createInvitationRecord({
          ...validInvitationData,
          role: 'invalid-role' as any,
        })
      ).toThrow();

      expect(() =>
        createInvitationRecord({
          ...validInvitationData,
          invitedBy: '',
        })
      ).toThrow();
    });

    it('should use custom expiration hours', () => {
      const customHours = 24;
      const before = Date.now();
      const record = createInvitationRecord(validInvitationData, customHours);
      const after = Date.now();

      const expiresAt = record.expiresAt.getTime();
      const expectedMin = before + customHours * 60 * 60 * 1000;
      const expectedMax = after + customHours * 60 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });

    it('should create tokens that can be validated', () => {
      const record = createInvitationRecord(validInvitationData);

      const isValid = validateTokenTiming(record.token, record.tokenHash, record.salt);
      expect(isValid).toBe(true);
    });
  });

  describe('Security Configuration', () => {
    it('should have sensible security constants', () => {
      expect(SECURITY_CONFIG.MIN_TOKEN_LENGTH).toBeGreaterThan(8);
      expect(SECURITY_CONFIG.MAX_TOKEN_LENGTH).toBeGreaterThan(SECURITY_CONFIG.MIN_TOKEN_LENGTH);
      expect(SECURITY_CONFIG.DEFAULT_EXPIRATION_HOURS).toBeGreaterThan(0);
      expect(SECURITY_CONFIG.MAX_EXPIRATION_HOURS).toBeLessThanOrEqual(168); // Max 1 week
      expect(SECURITY_CONFIG.TOKEN_BYTE_LENGTH).toBeGreaterThanOrEqual(16); // Min 128 bits
      expect(SECURITY_CONFIG.SALT_BYTE_LENGTH).toBeGreaterThanOrEqual(8); // Min 64 bits
    });
  });

  describe('Integration Tests', () => {
    it('should complete full invitation workflow', () => {
      // 1. Generate invitation
      const invitationData: InvitationData = {
        email: 'newuser@example.com',
        role: 'user',
        invitedBy: 'admin-123',
      };

      const invitation = createInvitationRecord(invitationData, 48);

      // 2. Validate token (simulate user clicking link)
      const isValidToken = validateTokenTiming(
        invitation.token,
        invitation.tokenHash,
        invitation.salt
      );
      expect(isValidToken).toBe(true);

      // 3. Check not expired
      expect(isTokenExpired(invitation.expiresAt)).toBe(false);

      // 4. Validate wrong token fails
      const wrongToken = `${invitation.token.slice(0, -1)}x`;
      const isInvalidToken = validateTokenTiming(wrongToken, invitation.tokenHash, invitation.salt);
      expect(isInvalidToken).toBe(false);
    });

    it('should handle expired token scenario', () => {
      // Create token with past expiration date
      const pastDate = new Date(Date.now() - 1000); // 1 second ago
      const invitation = createInvitationRecord({
        email: 'test@example.com',
        role: 'user',
        invitedBy: 'admin-123',
      });

      // Manually set expiration to past date
      invitation.expiresAt = pastDate;

      expect(isTokenExpired(invitation.expiresAt)).toBe(true);

      // Even with correct token, expired tokens should be rejected by business logic
      const isValid = validateTokenTiming(invitation.token, invitation.tokenHash, invitation.salt);
      expect(isValid).toBe(true); // Token itself is still valid
      expect(isTokenExpired(invitation.expiresAt)).toBe(true); // But expired
    });
  });
});
