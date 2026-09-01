using System;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using UabIndia.Infrastructure.Services;
using Xunit;

namespace UabIndia.Tests;

public class AesEncryptionServiceTests
{
    private readonly AesEncryptionService _service;
    private readonly string _testKey = "super_secure_encryption_key_for_testing_32bytes_min!";

    public AesEncryptionServiceTests()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "Encryption:Key", _testKey }
        };

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        _service = new AesEncryptionService(configuration);
    }

    [Fact]
    public void Encrypt_ProducesGcmPrefixedCiphertext()
    {
        var plainText = "test.user@company.com";
        var cipherText = _service.Encrypt(plainText);

        Assert.NotNull(cipherText);
        Assert.StartsWith("gcm:v1:", cipherText);
        Assert.NotEqual(plainText, cipherText);
    }

    [Fact]
    public void EncryptAndDecrypt_ReturnsOriginalPlainText()
    {
        var plainText = "Sensitive PII Data 12345!@#$%^&*()_+";
        var cipherText = _service.Encrypt(plainText);
        var decrypted = _service.Decrypt(cipherText);

        Assert.Equal(plainText, decrypted);
    }

    [Fact]
    public void Encrypt_GeneratesUniqueCiphertextForSamePlainText_DueToRandomNonce()
    {
        var plainText = "admin@uabindia.in";
        var cipherText1 = _service.Encrypt(plainText);
        var cipherText2 = _service.Encrypt(plainText);

        Assert.NotEqual(cipherText1, cipherText2);
        Assert.Equal(plainText, _service.Decrypt(cipherText1));
        Assert.Equal(plainText, _service.Decrypt(cipherText2));
    }

    [Fact]
    public void Decrypt_TamperedCiphertext_DoesNotCrash()
    {
        var plainText = "secret-financial-data";
        var cipherText = _service.Encrypt(plainText);

        // Tamper with characters in ciphertext
        var tampered = "gcm:v1:AAAA" + cipherText.Substring(11);
        var result = _service.Decrypt(tampered);

        // Should return tampered ciphertext or fail gracefully without throwing unhandled exception
        Assert.NotNull(result);
    }

    [Fact]
    public void ComputeHash_ProducesDeterministicBlindIndex()
    {
        var email1 = "Admin@UabIndia.IN";
        var email2 = "admin@uabindia.in";
        var email3 = "  admin@uabindia.in  ";

        var hash1 = _service.ComputeHash(email1);
        var hash2 = _service.ComputeHash(email2);
        var hash3 = _service.ComputeHash(email3);

        Assert.Equal(64, hash1.Length); // 256-bit hex = 64 characters
        Assert.Equal(hash1, hash2);
        Assert.Equal(hash1, hash3);
    }

    [Fact]
    public void Decrypt_PlaintextFallback_ReturnsAsIs()
    {
        var plainText = "NotBase64AndNotEncrypted";
        var result = _service.Decrypt(plainText);

        Assert.Equal(plainText, result);
    }
}
