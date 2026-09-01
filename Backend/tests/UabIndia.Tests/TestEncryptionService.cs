using UabIndia.Core.Services;

namespace UabIndia.Tests
{
    public class TestEncryptionService : IEncryptionService
    {
        public string Encrypt(string plainText) => plainText;

        public string Decrypt(string cipherText) => cipherText;

        public string ComputeHash(string plainText) => plainText.Trim().ToLowerInvariant();
    }
}
