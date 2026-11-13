using ChestArtillery.Core;
using ChestArtillery.Data;
using Microsoft.EntityFrameworkCore;

namespace ChestArtillery.Tests;

class FakeTokens : ITokenService { public string Create(int id, string name) => "token-" + id; }
class FixedFish(int fish) : IFishSource
{
    public Task<FishPuzzle?> GetAsync(CancellationToken ct) => Task.FromResult<FishPuzzle?>(new FishPuzzle("data:x", fish, 1, "test"));
}

public class CoreTests
{
    static AppDbContext NewDb() => new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    static async Task<(AppDbContext db, int uid)> WithUser()
    {
        var db = NewDb();
        await new AuthService(db, new FakeTokens()).RegisterAsync(new("sailor", "s@x.com", "secret1"));
        db.Medals.AddRange(new Medal { MedalId = "win", Name = "First victory" }, new Medal { MedalId = "combo", Name = "Sharp eye" });
        await db.SaveChangesAsync();
        return (db, (await db.Users.FirstAsync()).Id);
    }

    [Fact]
    public void Reward_for_a_flawless_win_is_three_stars()
    {
        var r = new MatchReport(1, true, 100, 4, 4, 2, 2, 4, 3);
        Assert.Equal((50 + 10 + 20 + 40, 3), ScoreService.Reward(1, r, 3));
        Assert.Equal((10 + 10, 0), ScoreService.Reward(1, r with { Won = false, RivalHits = 0, ChestsHit = 1 }, 3));
    }

    [Fact]
    public void Fish_csv_uses_the_fish_count_not_the_chest_count()
    {
        var p = FishCsv.Parse("iVBORw0KGgo".PadRight(60, 'A') + ",3,8");
        Assert.Equal(3, p.Fish);
        Assert.DoesNotContain(",3", p.Image);
    }

    [Fact]
    public async Task Register_hashes_the_password_and_rejects_duplicates()
    {
        var (db, _) = await WithUser();
        Assert.NotEqual("secret1", (await db.Users.FirstAsync()).PasswordHash);
        var ex = await Assert.ThrowsAsync<GameException>(() => new AuthService(db, new FakeTokens()).RegisterAsync(new("sailor", "o@x.com", "secret1")));
        Assert.Equal(409, ex.Status);
    }

    [Fact]
    public async Task Three_wrong_passwords_lock_the_account()
    {
        var (db, _) = await WithUser();
        var auth = new AuthService(db, new FakeTokens());
        for (var i = 0; i < 3; i++) Assert.Equal(401, (await Assert.ThrowsAsync<GameException>(() => auth.LoginAsync(new("sailor", "bad")))).Status);
        Assert.Equal(429, (await Assert.ThrowsAsync<GameException>(() => auth.LoginAsync(new("sailor", "secret1")))).Status);
    }

    [Fact]
    public async Task A_fish_challenge_can_only_be_answered_once_and_the_answer_stays_on_the_server()
    {
        var (db, uid) = await WithUser();
        var fish = new FishService(db, [new FixedFish(5)]);
        var c = await fish.IssueAsync(uid);
        Assert.Equal(new FishAnswerResult(2, false), await fish.AnswerAsync(uid, c.Id, 7));
        Assert.Equal(409, (await Assert.ThrowsAsync<GameException>(() => fish.AnswerAsync(uid, c.Id, 5))).Status);
        Assert.Equal(404, (await Assert.ThrowsAsync<GameException>(() => fish.AnswerAsync(uid + 1, c.Id, 5))).Status);
    }

    [Fact]
    public async Task A_match_must_agree_with_the_validated_fish_answers()
    {
        var (db, uid) = await WithUser();
        var profiles = new ProfileService(db);
        var matches = new MatchService(db, profiles);
        var report = new MatchReport(1, true, 100, 2, 2, 1, 2, 2, 3);
        Assert.Equal(400, (await Assert.ThrowsAsync<GameException>(() => matches.SubmitAsync(uid, report))).Status); // no validated answers yet

        var fish = new FishService(db, [new FixedFish(4)]);
        for (var i = 0; i < 2; i++) await fish.AnswerAsync(uid, (await fish.IssueAsync(uid)).Id, 4);
        var res = await matches.SubmitAsync(uid, report);
        Assert.Equal(3, res.Stars);
        Assert.Equal(2, res.Profile.UnlockedLevel);
        Assert.Contains("First victory", res.NewMedals);
        Assert.Equal(res.Coins, res.Profile.Coins);
    }

    [Fact]
    public async Task Shop_needs_coins_and_each_item_is_bought_once()
    {
        var (db, uid) = await WithUser();
        db.ShopItems.Add(new ShopItem { ItemId = "heart", Name = "Extra heart", Price = 200 });
        await db.SaveChangesAsync();
        var shop = new ShopService(db, new ProfileService(db));
        Assert.Equal(400, (await Assert.ThrowsAsync<GameException>(() => shop.BuyAsync(uid, "heart"))).Status);
        (await db.Profiles.FirstAsync()).Coins = 250;
        await db.SaveChangesAsync();
        var p = await shop.BuyAsync(uid, "heart");
        Assert.Equal(50, p.Coins);
        Assert.Contains("heart", p.Items);
        Assert.Equal(409, (await Assert.ThrowsAsync<GameException>(() => shop.BuyAsync(uid, "heart"))).Status);
    }
}
