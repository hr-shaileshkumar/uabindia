using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using UabIndia.Core.Services;

namespace UabIndia.Infrastructure.Services
{
    public class AesEncryptionService : IEncryptionService
    {
        private const string GcmPrefix = "gcm:v1:";
        private const int GcmNonceSize = 12; // 96-bit standard nonce for AES-GCM
        private const int GcmTagSize = 16;   // 128-bit authentication tag
        private const int LegacyCbcIvSize = 16;

        private readonly byte[] _key;
        private readonly string _rawKey;

        public AesEncryptionService(IConfiguration configuration)
        {
            var key = configuration["Encryption:Key"]
                ?? Environment.GetEnvironmentVariable("ENCRYPTION_KEY");

            if (string.IsNullOrWhiteSpace(key))
                throw new InvalidOperationException("Encryption key missing. Set Encryption:Key or ENCRYPTION_KEY.");

            _rawKey = key;
            _key = SHA256.HashData(Encoding.UTF8.GetBytes(key));
        }

        /// <summary>
        /// Encrypts plaintext using authenticated AES-256-GCM with a cryptographically secure random nonce.
        /// Output format: gcm:v1:[Base64(Nonce (12B) + Tag (16B) + Ciphertext)]
        /// </summary>
        public string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText)) return plainText;

            var plainBytes = Encoding.UTF8.GetBytes(plainText);
            var nonce = new byte[GcmNonceSize];
            RandomNumberGenerator.Fill(nonce);

            var tag = new byte[GcmTagSize];
            var cipherBytes = new byte[plainBytes.Length];

            using var aesGcm = new AesGcm(_key, GcmTagSize);
            aesGcm.Encrypt(nonce, plainBytes, cipherBytes, tag);

            // Payload: [Nonce (12B)][Tag (16B)][Ciphertext]
            var payload = new byte[GcmNonceSize + GcmTagSize + cipherBytes.Length];
            Buffer.BlockCopy(nonce, 0, payload, 0, GcmNonceSize);
            Buffer.BlockCopy(tag, 0, payload, GcmNonceSize, GcmTagSize);
            Buffer.BlockCopy(cipherBytes, 0, payload, GcmNonceSize + GcmTagSize, cipherBytes.Length);

            return GcmPrefix + Convert.ToBase64String(payload);
        }

        /// <summary>
        /// Decrypts ciphertext, automatically detecting AES-256-GCM or falling back to legacy AES-CBC.
        /// </summary>
        public string Decrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText)) return cipherText;

            if (cipherText.StartsWith(GcmPrefix, StringComparison.Ordinal))
            {
                var base64 = cipherText.Substring(GcmPrefix.Length);
                byte[] payload;
                try
                {
                    payload = Convert.FromBase64String(base64);
                }
                catch (FormatException)
                {
                    return cipherText;
                }

                if (payload.Length < GcmNonceSize + GcmTagSize)
                {
                    return cipherText;
                }

                var nonce = new byte[GcmNonceSize];
                var tag = new byte[GcmTagSize];
                var cipherLength = payload.Length - GcmNonceSize - GcmTagSize;
                var cipherBytes = new byte[cipherLength];
                var plainBytes = new byte[cipherLength];

                Buffer.BlockCopy(payload, 0, nonce, 0, GcmNonceSize);
                Buffer.BlockCopy(payload, GcmNonceSize, tag, 0, GcmTagSize);
                Buffer.BlockCopy(payload, GcmNonceSize + GcmTagSize, cipherBytes, 0, cipherLength);

                try
                {
                    using var aesGcm = new AesGcm(_key, GcmTagSize);
                    aesGcm.Decrypt(nonce, cipherBytes, tag, plainBytes);
                    return Encoding.UTF8.GetString(plainBytes);
                }
                catch
                {
                    return cipherText;
                }
            }

            // Legacy AES-CBC fallback for existing database records
            return DecryptLegacyCbc(cipherText);
        }

        /// <summary>
        /// Computes a deterministic HMAC-SHA256 blind index hash for indexed exact lookups.
        /// </summary>
        public string ComputeHash(string plainText)
        {
            if (string.IsNullOrEmpty(plainText)) return string.Empty;
            var normalized = plainText.Trim().ToLowerInvariant();
            var hashBytes = HMACSHA256.HashData(_key, Encoding.UTF8.GetBytes(normalized));
            return Convert.ToHexString(hashBytes).ToLowerInvariant();
        }

        private string DecryptLegacyCbc(string cipherText)
        {
            byte[] allBytes;
            try
            {
                allBytes = Convert.FromBase64String(cipherText);
            }
            catch (FormatException)
            {
                return cipherText;
            }

            if (allBytes.Length <= LegacyCbcIvSize)
                return cipherText;

            var iv = new byte[LegacyCbcIvSize];
            var cipher = new byte[allBytes.Length - LegacyCbcIvSize];
            Buffer.BlockCopy(allBytes, 0, iv, 0, LegacyCbcIvSize);
            Buffer.BlockCopy(allBytes, LegacyCbcIvSize, cipher, 0, cipher.Length);

            try
            {
                using var aes = Aes.Create();
                aes.Key = _key;
                aes.IV = iv;
                aes.Mode = CipherMode.CBC;
                aes.Padding = PaddingMode.PKCS7;

                using var decryptor = aes.CreateDecryptor();
                var plainBytes = decryptor.TransformFinalBlock(cipher, 0, cipher.Length);
                return Encoding.UTF8.GetString(plainBytes);
            }
            catch
            {
                return cipherText;
            }
        }
    }
}

