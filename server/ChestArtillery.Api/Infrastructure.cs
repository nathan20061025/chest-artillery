using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ChestArtillery.Core;
using Microsoft.IdentityModel.Tokens;

namespace ChestArtillery.Api;

public class TokenService(string key, string issuer, string audience) : ITokenService
{
    public string Create(int userId, string username)
    {
        var creds = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
        var jwt = new JwtSecurityToken(issuer, audience,
            [new Claim(ClaimTypes.NameIdentifier, userId.ToString()), new Claim(ClaimTypes.Name, username)],
            expires: DateTime.UtcNow.AddHours(8), signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(jwt);
    }
}

/// <summary>Calls the public fish API. Returns null on any failure so the next source (local fallback) is used.</summary>
public class HttpFishSource(HttpClient http, IConfiguration cfg, ILogger<HttpFishSource> log) : IFishSource
{
    public async Task<FishPuzzle?> GetAsync(CancellationToken ct)
    {
        try { return FishCsv.Parse(await http.GetStringAsync(cfg["Fish:Url"], ct)); }
        catch (Exception e) { log.LogWarning("Fish API unavailable: {Message}", e.Message); return null; }
    }
}
