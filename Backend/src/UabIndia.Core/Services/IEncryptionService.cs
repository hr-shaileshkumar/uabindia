using System;

namespace UabIndia.Core.Services
{
    public interface IEncryptionService
    {
        string Encrypt(string plainText);
        string Decrypt(string cipherText);
        string ComputeHash(string plainText);
    }
}

