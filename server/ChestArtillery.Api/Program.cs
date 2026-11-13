using System.Text;
using ChestArtillery.Api;
using ChestArtillery.Core;
using ChestArtillery.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;
var key = cfg["Jwt:Key"];
if (string.IsNullOrEmpty(key) || key.Length < 32)
    throw new InvalidOperationException("Missing Jwt:Key. Run: dotnet user-secrets set \"Jwt:Key\" \"<random 32+ chars>\" --project ChestArtillery.Api");

builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer(cfg.GetConnectionString("Default")));
builder.Services.AddScoped<IGameDb>(sp => sp.GetRequiredService<AppDbContext>());
builder.Services.AddSingleton<ITokenService>(new TokenService(key, cfg["Jwt:Issuer"]!, cfg["Jwt:Audience"]!));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IFishService, FishService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IMatchService, MatchService>();
builder.Services.AddScoped<IShopService, ShopService>();
// fish sources are tried in registration order: the real API first, then the local fallback
builder.Services.AddHttpClient<IFishSource, HttpFishSource>(c => c.Timeout = TimeSpan.FromSeconds(5));
builder.Services.AddSingleton<IFishSource, FallbackFishSource>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidIssuer = cfg["Jwt:Issuer"], ValidAudience = cfg["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
        ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true, ValidateIssuerSigningKey = true,
    });
builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(cfg.GetSection("Cors:Origins").Get<string[]>() ?? []).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseExceptionHandler(a => a.Run(async ctx =>
{
    var ex = ctx.Features.Get<IExceptionHandlerFeature>()?.Error;
    ctx.Response.StatusCode = ex is GameException g ? g.Status : 500;
    await ctx.Response.WriteAsJsonAsync(new { error = ex is GameException ? ex.Message : "Server error." });
}));
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
