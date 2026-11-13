using System.Text.RegularExpressions;
using ChestArtillery.Core;
using Microsoft.EntityFrameworkCore;

namespace ChestArtillery.Data;

/// <summary>Maps the entities onto the existing SQL Server tables (snake_case columns). No migrations: the schema comes from the SQL script.</summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IGameDb
{
    public DbSet<User> Users => Set<User>();
    public DbSet<PlayerProfile> Profiles => Set<PlayerProfile>();
    public DbSet<LevelProgress> LevelProgress => Set<LevelProgress>();
    public DbSet<ShopItem> ShopItems => Set<ShopItem>();
    public DbSet<UserItem> UserItems => Set<UserItem>();
    public DbSet<Medal> Medals => Set<Medal>();
    public DbSet<UserMedal> UserMedals => Set<UserMedal>();
    public DbSet<GameMatch> Matches => Set<GameMatch>();
    public DbSet<FishChallenge> FishChallenges => Set<FishChallenge>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<PlayerProfile>().HasKey(x => x.UserId);
        b.Entity<LevelProgress>().HasKey(x => new { x.UserId, x.LevelNo });
        b.Entity<ShopItem>().HasKey(x => x.ItemId);
        b.Entity<UserItem>().HasKey(x => new { x.UserId, x.ItemId });
        b.Entity<Medal>().HasKey(x => x.MedalId);
        b.Entity<UserMedal>().HasKey(x => new { x.UserId, x.MedalId });
        b.Entity<FishChallenge>().Property(x => x.Id).ValueGeneratedNever();
        b.Entity<User>().HasOne(u => u.Profile).WithOne().HasForeignKey<PlayerProfile>(p => p.UserId);
        foreach (var p in b.Model.GetEntityTypes().SelectMany(e => e.GetProperties()))
            p.SetColumnName(Regex.Replace(p.Name, "(?<=.)([A-Z])", "_$1").ToLowerInvariant());
    }
}
