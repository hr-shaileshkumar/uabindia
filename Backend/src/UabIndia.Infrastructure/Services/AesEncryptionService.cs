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
        private const int IvSize = 16;
        private readonly byte[] _key;
        private readonly string _rawKey;

        public AesEncryptionService(IConfiguration configuration)
        {
            var key = configuration["Encryption:Key"]
                ?? Environment.GetEnvironmentVariable("ENCRYPTION_KEY")
                ?? "dev-only-change-this-to-a-strong-secret-key-min-32-chars";

            if (string.IsNullOrWhiteSpace(key))
                throw new InvalidOperationException("Encryption key missing. Set Encryption:Key or ENCRYPTION_KEY.");

            _rawKey = key;
            _key = SHA256.HashData(Encoding.UTF8.GetBytes(key));
        }

        public string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText)) return plainText;

            using var aes = Aes.Create();
            aes.Key = _key;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            // Deterministic IV derived from key and plaintext (lowercased for case-insensitive email matching)
            var iv = SHA256.HashData(Encoding.UTF8.GetBytes(_rawKey + ":" + plainText.Trim().ToLowerInvariant())).Take(IvSize).ToArray();
            aes.IV = iv;

            var plainBytes = Encoding.UTF8.GetBytes(plainText);
            using var encryptor = aes.CreateEncryptor();
            var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

            // Prepend IV to ciphertext: [16 bytes IV][ciphertext]
            var result = new byte[IvSize + cipherBytes.Length];
            Buffer.BlockCopy(aes.IV, 0, result, 0, IvSize);
            Buffer.BlockCopy(cipherBytes, 0, result, IvSize, cipherBytes.Length);
            return Convert.ToBase64String(result);
        }

        public string Decrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText)) return cipherText;

            byte[] allBytes;
            try
            {
                allBytes = Convert.FromBase64String(cipherText);
            }
            catch (FormatException)
            {
                // Not base64 — return as-is (plain text stored before encryption was enabled)
                return cipherText;
            }

            if (allBytes.Length <= IvSize)
                return cipherText;

            var iv = new byte[IvSize];
            var cipher = new byte[allBytes.Length - IvSize];
            Buffer.BlockCopy(allBytes, 0, iv, 0, IvSize);
            Buffer.BlockCopy(allBytes, IvSize, cipher, 0, cipher.Length);

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
