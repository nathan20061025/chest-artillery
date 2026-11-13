using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;

namespace ChestArtillery.Core;

public interface ITokenService { string Create(int userId, string username); }
public interface IAuthService { Task<AuthResponse> RegisterAsync(RegisterRequest r); Task<AuthResponse> LoginAsync(LoginRequest r); }
public interface IFishService { Task<FishChallengeDto> IssueAsync(int userId, CancellationToken ct = default); Task<FishAnswerResult> AnswerAsync(int userId, Guid id, int answer); }
public interface IProfileService { Task<ProfileDto> GetAsync(int userId); Task<SettingsDto> UpdateSettingsAsync(int userId, SettingsDto s); Task<List<LeaderRow>> LeaderboardAsync(string by); }
public interface IMatchService { Task<MatchResultDto> SubmitAsync(int userId, MatchReport r); }
public interface IShopService { Task<ProfileDto> BuyAsync(int userId, string itemId); }

/// <summary>Where fish pictures come from. The real API first, a locally drawn picture as fallback.</summary>
public record FishPuzzle(string Image, int Fish, int Chests, string Source);
public interface IFishSource { Task<FishPuzzle?> GetAsync(CancellationToken ct); }

public static class Levels
{
    public static readonly int[] Chests = [2, 3, 3, 4, 4];
    public static readonly int[] RivalHp = [2, 3, 3, 4, 5];
    public static readonly string[] Names = ["Calm Bay", "Breezy Cove", "Windward Reef", "Pirate Strait", "Leviathan's Gate"];
}

/// <summary>The fish API replies "base64image,fishCount,chestCount". The player counts the FISH.</summary>
public static class FishCsv
{
    public static FishPuzzle Parse(string text)
    {
        var p = text.Trim().Split(',');
        if (p.Length < 2 || p[0].Length < 50 || !int.TryParse(p[1], out var fish) || fish is < 0 or > 9) throw new FormatException("Bad fish data");
        var mime = p[0].StartsWith("/9j/") ? "image/jpeg" : p[0].StartsWith("R0lG") ? "image/gif" : "image/png";
        return new FishPuzzle($"data:{mime};base64,{p[0].Trim()}", fish, p.Length > 2 && int.TryParse(p[2], out var c) ? c : 0, "live");
    }
}

/// <summary>Offline fallback: draws n fish as a simple SVG.</summary>
public class FallbackFishSource : IFishSource
{
    public Task<FishPuzzle?> GetAsync(CancellationToken ct)
    {
        var n = Random.Shared.Next(10);
        var sb = new System.Text.StringBuilder("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'><rect width='300' height='200' fill='#1d6f8c'/>");
        for (var i = 0; i < n; i++)
            sb.Append($"<ellipse cx='{40 + i % 5 * 55}' cy='{45 + i / 5 * 70}' rx='16' ry='9' fill='#ff9f43'/><polygon points='{54 + i % 5 * 55},{45 + i / 5 * 70} {67 + i % 5 * 55},{36 + i / 5 * 70} {67 + i % 5 * 55},{54 + i / 5 * 70}' fill='#ff9f43'/>");
        sb.Append("</svg>");
        var img = "data:image/svg+xml;base64," + Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(sb.ToString()));
        return Task.FromResult<FishPuzzle?>(new FishPuzzle(img, n, 0, "local"));
    }
}

public class AuthService(IGameDb db, ITokenService tokens) : IAuthService
{
    static readonly Regex Name = new(@"^\w{2,20}$"), Mail = new(@"^\S+@\S+\.\S+$");

    public async Task<AuthResponse> RegisterAsync(RegisterRequest r)
    {
        if (!Name.IsMatch(r.Username ?? "")) throw new GameException(400, "Username: 2-20 letters, numbers or _.");
        if (!Mail.IsMatch(r.Email ?? "")) throw new GameException(400, "Enter a valid email.");
        if ((r.Password ?? "").Length < 6) throw new GameException(400, "Password needs at least 6 characters.");
        if (await db.Users.AnyAsync(u => u.Username == r.Username || u.Email == r.Email)) throw new GameException(409, "Username or email already taken.");
        var u = new User { Username = r.Username!, Email = r.Email!, PasswordHash = BCrypt.Net.BCrypt.HashPassword(r.Password), Profile = new PlayerProfile() };
        db.Users.Add(u);
        await db.SaveChangesAsync();
        return new AuthResponse(tokens.Create(u.Id, u.Username), u.Username);
    }

    /// <summary>3 wrong passwords lock the account for 30 seconds.</summary>
    public async Task<AuthResponse> LoginAsync(LoginRequest r)
    {
        var now = DateTime.UtcNow;
        var u = await db.Users.FirstOrDefaultAsync(x => x.Username == r.Username) ?? throw new GameException(401, "Wrong username or password.");
        if (u.LockedUntil > now) throw new GameException(429, $"Too many tries. Wait {(int)Math.Ceiling((u.LockedUntil.Value - now).TotalSeconds)} s.");
        if (!BCrypt.Net.BCrypt.Verify(r.Password ?? "", u.PasswordHash))
        {
            if (++u.FailedLogins >= 3) { u.FailedLogins = 0; u.LockedUntil = now.AddSeconds(30); }
            await db.SaveChangesAsync();
            throw new GameException(401, "Wrong username or password.");
        }
        u.FailedLogins = 0; u.LockedUntil = null; u.LastLoginAt = now;
        await db.SaveChangesAsync();
        return new AuthResponse(tokens.Create(u.Id, u.Username), u.Username);
    }
}

/// <summary>The server keeps the correct count; the browser only gets the picture and a one-time id.</summary>
public class FishService(IGameDb db, IEnumerable<IFishSource> sources) : IFishService
{
    public async Task<FishChallengeDto> IssueAsync(int userId, CancellationToken ct = default)
    {
        FishPuzzle? p = null;
        foreach (var s in sources) { p = await s.GetAsync(ct); if (p is not null) break; }
        if (p is null) throw new GameException(503, "No fish source available.");
        var now = DateTime.UtcNow;
        var c = new FishChallenge { Id = Guid.NewGuid(), UserId = userId, Solution = (byte)p.Fish, ChestCount = (byte)Math.Min(p.Chests, 255), CreatedAt = now, ExpiresAt = now.AddMinutes(2) };
        db.FishChallenges.Add(c);
        await db.SaveChangesAsync(ct);
        return new FishChallengeDto(c.Id, p.Image, p.Source);
    }

    /// <summary>answer &lt; 0 means the timer ran out (counts as a miss of 4, like the prototype).</summary>
    public async Task<FishAnswerResult> AnswerAsync(int userId, Guid id, int answer)
    {
        var c = await db.FishChallenges.FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId) ?? throw new GameException(404, "Unknown fish challenge.");
        if (c.UsedAt is not null) throw new GameException(409, "Challenge already answered.");
        if (c.ExpiresAt < DateTime.UtcNow) throw new GameException(410, "Challenge expired.");
        c.UsedAt = DateTime.UtcNow;
        c.UserAnswer = answer is >= 0 and <= 9 ? (byte)answer : null;
        await db.SaveChangesAsync();
        var err = c.UserAnswer is null ? 4 : Math.Abs(c.UserAnswer.Value - c.Solution);
        return new FishAnswerResult(err, err == 0);
    }
}

public static class ScoreService
{
    public static int Accuracy(int correct, int total) => total == 0 ? 0 : (int)Math.Round(100.0 * correct / total, MidpointRounding.AwayFromZero);

    public static (int Coins, int Stars) Reward(int level, MatchReport r, int hpMax)
    {
        var acc = Accuracy(r.AnswersCorrect, r.AnswersTotal);
        var coins = r.Won ? 50 + level * 10 + r.ChestsHit * 10 + r.RivalHits * 20 : 10 + r.ChestsHit * 10;
        var stars = r.Won ? 1 + (r.HeartsLeft >= hpMax ? 1 : 0) + (acc >= 70 ? 1 : 0) : 0;
        return (coins, stars);
    }
}

public class ProfileService(IGameDb db) : IProfileService
{
    static readonly string[] Themes = ["auto", "dark", "light"];

    public async Task<ProfileDto> GetAsync(int userId)
    {
        var u = await db.Users.AsNoTracking().FirstAsync(x => x.Id == userId);
        var p = await db.Profiles.AsNoTracking().FirstAsync(x => x.UserId == userId);
        var stars = await db.LevelProgress.AsNoTracking().Where(x => x.UserId == userId).ToDictionaryAsync(x => (int)x.LevelNo, x => (int)x.BestStars);
        var items = await db.UserItems.AsNoTracking().Where(x => x.UserId == userId).Select(x => x.ItemId).ToArrayAsync();
        var medals = await db.UserMedals.AsNoTracking().Where(x => x.UserId == userId).Select(x => x.MedalId).ToArrayAsync();
        var hist = (await db.Matches.AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.PlayedAt).Take(8).ToListAsync())
            .Select(m => new MatchRow(m.PlayedAt, Levels.Names[m.LevelNo - 1], m.Won, ScoreService.Accuracy(m.AnswersCorrect, m.AnswersTotal), m.Score)).ToList();
        return new ProfileDto(u.Username, p.Coins, p.TotalEarned, p.UnlockedLevel, stars, items, medals, p.MatchesPlayed, p.Wins, p.AnswersTotal, p.AnswersCorrect, p.ChestsHit,
            new SettingsDto(p.SoundOn, p.Difficulty, p.Theme), hist);
    }

    public async Task<SettingsDto> UpdateSettingsAsync(int userId, SettingsDto s)
    {
        if (s.Difficulty is < 0 or > 2 || !Themes.Contains(s.Theme)) throw new GameException(400, "Invalid settings.");
        var p = await db.Profiles.FirstAsync(x => x.UserId == userId);
        p.SoundOn = s.Sound; p.Difficulty = (byte)s.Difficulty; p.Theme = s.Theme;
        await db.SaveChangesAsync();
        return s;
    }

    public async Task<List<LeaderRow>> LeaderboardAsync(string by)
    {
        var rows = (await db.Users.AsNoTracking().Join(db.Profiles.AsNoTracking(), u => u.Id, p => p.UserId, (u, p) => new { u.Username, p.Wins, p.AnswersCorrect, p.AnswersTotal }).ToListAsync())
            .Select(x => new { x.Username, x.Wins, Acc = ScoreService.Accuracy(x.AnswersCorrect, x.AnswersTotal) });
        var sorted = by == "wins" ? rows.OrderByDescending(x => x.Wins).ThenByDescending(x => x.Acc) : rows.OrderByDescending(x => x.Acc).ThenByDescending(x => x.Wins);
        return sorted.Take(20).Select((x, i) => new LeaderRow(i + 1, x.Username, x.Acc, x.Wins)).ToList();
    }
}

public class ShopService(IGameDb db, IProfileService profiles) : IShopService
{
    public async Task<ProfileDto> BuyAsync(int userId, string itemId)
    {
        var item = await db.ShopItems.FirstOrDefaultAsync(i => i.ItemId == itemId) ?? throw new GameException(404, "Unknown item.");
        if (await db.UserItems.AnyAsync(i => i.UserId == userId && i.ItemId == itemId)) throw new GameException(409, "Already owned.");
        var p = await db.Profiles.FirstAsync(x => x.UserId == userId);
        if (p.Coins < item.Price) throw new GameException(400, "Not enough coins.");
        p.Coins -= item.Price;
        db.UserItems.Add(new UserItem { UserId = userId, ItemId = itemId });
        await db.SaveChangesAsync();
        return await profiles.GetAsync(userId);
    }
}

/// <summary>The client reports a finished match; the server checks it against the answers it validated, then awards coins, stars and medals.</summary>
public class MatchService(IGameDb db, IProfileService profiles) : IMatchService
{
    public async Task<MatchResultDto> SubmitAsync(int userId, MatchReport r)
    {
        var p = await db.Profiles.FirstAsync(x => x.UserId == userId);
        if (r.Level < 1 || r.Level > 5 || r.Level > p.UnlockedLevel) throw new GameException(400, "Level not unlocked.");
        var hpMax = 3 + (await db.UserItems.AnyAsync(i => i.UserId == userId && i.ItemId == "heart") ? 1 : 0);
        var rival = Levels.RivalHp[r.Level - 1];
        if (new[] { r.Score, r.AnswersTotal, r.AnswersCorrect, r.ChestsHit, r.RivalHits, r.BestCombo, r.HeartsLeft }.Any(v => v < 0)
            || r.AnswersCorrect > r.AnswersTotal || r.ChestsHit > Levels.Chests[r.Level - 1] || r.RivalHits > rival || r.HeartsLeft > hpMax
            || r.BestCombo > r.AnswersCorrect || r.Score > 5000
            || (r.Won && (r.RivalHits != rival || r.HeartsLeft == 0)) || (!r.Won && r.HeartsLeft != 0))
            throw new GameException(400, "Invalid match report.");

        // every counted answer must come from a fish challenge the server validated in the last hour
        var since = DateTime.UtcNow.AddHours(-1);
        var used = await db.FishChallenges.Where(f => f.UserId == userId && f.UsedAt >= since).ToListAsync();
        var prev = await db.Matches.Where(m => m.UserId == userId && m.PlayedAt >= since).ToListAsync();
        if (r.AnswersTotal + prev.Sum(m => m.AnswersTotal) > used.Count
            || r.AnswersCorrect + prev.Sum(m => m.AnswersCorrect) > used.Count(f => f.UserAnswer == f.Solution))
            throw new GameException(400, "Match does not agree with the validated fish answers.");

        var (coins, stars) = ScoreService.Reward(r.Level, r, hpMax);
        p.MatchesPlayed++; p.AnswersTotal += r.AnswersTotal; p.AnswersCorrect += r.AnswersCorrect; p.ChestsHit += r.ChestsHit; p.Coins += coins; p.TotalEarned += coins;
        if (r.Won)
        {
            p.Wins++;
            var lp = await db.LevelProgress.FirstOrDefaultAsync(x => x.UserId == userId && x.LevelNo == r.Level);
            if (lp is null) db.LevelProgress.Add(new LevelProgress { UserId = userId, LevelNo = (byte)r.Level, BestStars = (byte)stars });
            else lp.BestStars = (byte)Math.Max(lp.BestStars, stars);
            if (r.Level == p.UnlockedLevel && r.Level < 5) p.UnlockedLevel++;
        }
        var have = await db.UserMedals.Where(m => m.UserId == userId).Select(m => m.MedalId).ToListAsync();
        var earned = new List<string>();
        void Award(string id, bool ok) { if (ok && !have.Contains(id)) { earned.Add(id); db.UserMedals.Add(new UserMedal { UserId = userId, MedalId = id }); } }
        Award("win", r.Won); Award("combo", r.BestCombo >= 3); Award("hunt", r.ChestsHit >= 3); Award("rich", p.TotalEarned >= 500);
        db.Matches.Add(new GameMatch { UserId = userId, LevelNo = (byte)r.Level, Won = r.Won, Score = r.Score, AnswersTotal = (short)r.AnswersTotal, AnswersCorrect = (short)r.AnswersCorrect,
            ChestsHit = (short)r.ChestsHit, RivalHits = (short)r.RivalHits, BestCombo = (short)r.BestCombo, HeartsLeft = (byte)r.HeartsLeft, Stars = (byte)stars, CoinsAwarded = coins });
        await db.SaveChangesAsync();

        var names = await db.Medals.Where(m => earned.Contains(m.MedalId)).Select(m => m.Name).ToArrayAsync();
        return new MatchResultDto(r.Won, stars, coins, ScoreService.Accuracy(r.AnswersCorrect, r.AnswersTotal), r.Score, r.ChestsHit, r.BestCombo, names, await profiles.GetAsync(userId));
    }
}
