using System.Security.Claims;
using ChestArtillery.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChestArtillery.Api.Controllers;

public abstract class GameController : ControllerBase
{
    protected int Uid => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

[ApiController, Route("api/auth")]
public class AuthController(IAuthService auth) : ControllerBase
{
    [HttpPost("register")] public Task<AuthResponse> Register(RegisterRequest r) => auth.RegisterAsync(r);
    [HttpPost("login")] public Task<AuthResponse> Login(LoginRequest r) => auth.LoginAsync(r);
}

[ApiController, Authorize]
public class ProfileController(IProfileService profiles) : GameController
{
    [HttpGet("api/profile")] public Task<ProfileDto> Get() => profiles.GetAsync(Uid);
    [HttpPut("api/settings")] public Task<SettingsDto> Settings(SettingsDto s) => profiles.UpdateSettingsAsync(Uid, s);
    [AllowAnonymous, HttpGet("api/leaderboard")] public Task<List<LeaderRow>> Leaderboard([FromQuery] string by = "accuracy") => profiles.LeaderboardAsync(by);
}

[ApiController, Authorize, Route("api/fish")]
public class FishController(IFishService fish) : GameController
{
    [HttpGet] public Task<FishChallengeDto> Issue(CancellationToken ct) => fish.IssueAsync(Uid, ct);
    [HttpPost("answer")] public Task<FishAnswerResult> Answer(FishAnswerRequest r) => fish.AnswerAsync(Uid, r.Id, r.Answer);
}

[ApiController, Authorize]
public class PlayController(IMatchService matches, IShopService shop) : GameController
{
    [HttpPost("api/matches")] public Task<MatchResultDto> Submit(MatchReport r) => matches.SubmitAsync(Uid, r);
    [HttpPost("api/shop/buy/{itemId}")] public Task<ProfileDto> Buy(string itemId) => shop.BuyAsync(Uid, itemId);
}
