using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ChestArtillery.Core;

/* ---------- entities (one per table in the chest_artillery database) ---------- */
[Table("users")]
public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public byte FailedLogins { get; set; }
    public DateTime? LockedUntil { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public PlayerProfile? Profile { get; set; }
}

[Table("player_profiles")]
public class PlayerProfile
{
    public int UserId { get; set; }
    public int Coins { get; set; }
    public int TotalEarned { get; set; }
    public byte UnlockedLevel { get; set; } = 1;
    public int MatchesPlayed { get; set; }
    public int Wins { get; set; }
    public int AnswersTotal { get; set; }
    public int AnswersCorrect { get; set; }
    public int ChestsHit { get; set; }
    public bool SoundOn { get; set; } = true;
    public byte Difficulty { get; set; } = 1;
    public string Theme { get; set; } = "auto";
}

[Table("level_progress")]
public class LevelProgress { public int UserId { get; set; } public byte LevelNo { get; set; } public byte BestStars { get; set; } }

[Table("shop_items")]
public class ShopItem { public string ItemId { get; set; } = ""; public string Name { get; set; } = ""; public string Description { get; set; } = ""; public int Price { get; set; } }

[Table("user_items")]
public class UserItem { public int UserId { get; set; } public string ItemId { get; set; } = ""; public DateTime PurchasedAt { get; set; } = DateTime.UtcNow; }

[Table("medals")]
public class Medal { public string MedalId { get; set; } = ""; public string Name { get; set; } = ""; public string Description { get; set; } = ""; }

[Table("user_medals")]
public class UserMedal { public int UserId { get; set; } public string MedalId { get; set; } = ""; public DateTime EarnedAt { get; set; } = DateTime.UtcNow; }

[Table("matches")]
public class GameMatch
{
    public long Id { get; set; }
    public int UserId { get; set; }
    public byte LevelNo { get; set; }
    public bool Won { get; set; }
    public int Score { get; set; }
    public short AnswersTotal { get; set; }
    public short AnswersCorrect { get; set; }
    public short ChestsHit { get; set; }
    public short RivalHits { get; set; }
    public short BestCombo { get; set; }
    public byte HeartsLeft { get; set; }
    public byte Stars { get; set; }
    public int CoinsAwarded { get; set; }
    public DateTime PlayedAt { get; set; } = DateTime.UtcNow;
}

[Table("fish_challenges")]
public class FishChallenge
{
    public Guid Id { get; set; }
    public int UserId { get; set; }
    public byte Solution { get; set; }
    public byte? ChestCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public byte? UserAnswer { get; set; }
}

/// <summary>What the services need from the database. Implemented by AppDbContext in the Data project.</summary>
public interface IGameDb
{
    DbSet<User> Users { get; }
    DbSet<PlayerProfile> Profiles { get; }
    DbSet<LevelProgress> LevelProgress { get; }
    DbSet<ShopItem> ShopItems { get; }
    DbSet<UserItem> UserItems { get; }
    DbSet<Medal> Medals { get; }
    DbSet<UserMedal> UserMedals { get; }
    DbSet<GameMatch> Matches { get; }
    DbSet<FishChallenge> FishChallenges { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

/// <summary>An error that should reach the client as an HTTP status + message.</summary>
public class GameException(int status, string message) : Exception(message)
{
    public int Status { get; } = status;
}

/* ---------- DTOs ---------- */
public record RegisterRequest(string? Username, string? Email, string? Password);
public record LoginRequest(string? Username, string? Password);
public record AuthResponse(string Token, string Username);
public record FishChallengeDto(Guid Id, string Image, string Source);
public record FishAnswerRequest(Guid Id, int Answer);
public record FishAnswerResult(int Error, bool Correct);
public record SettingsDto(bool Sound, int Difficulty, string Theme);
public record MatchRow(DateTime PlayedAt, string Level, bool Won, int AccuracyPct, int Score);
public record MatchReport(int Level, bool Won, int Score, int AnswersTotal, int AnswersCorrect, int ChestsHit, int RivalHits, int BestCombo, int HeartsLeft);
public record ProfileDto(string Name, int Coins, int TotalEarned, int UnlockedLevel, Dictionary<int, int> Stars, string[] Items, string[] Medals,
    int Matches, int Wins, int AnswersTotal, int AnswersCorrect, int ChestsHit, SettingsDto Settings, List<MatchRow> History);
public record MatchResultDto(bool Won, int Stars, int Coins, int Accuracy, int Score, int ChestsHit, int BestCombo, string[] NewMedals, ProfileDto Profile);
public record LeaderRow(int Rank, string Username, int AccuracyPct, int Wins);
