using ChestArtillery.Core;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace ChestArtillery.Api;

/// <summary>Calls Open-Meteo (free, no key) and caches the answer for 10 minutes. The place comes from the Weather section of appsettings.json.</summary>
public class OpenMeteoService(HttpClient http, IConfiguration cfg, IMemoryCache cache) : IWeatherService
{
    public async Task<WeatherDto> GetAsync(CancellationToken ct = default)
    {
        var w = await cache.GetOrCreateAsync("wind", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
            try
            {
                var url = $"{cfg["Weather:Url"]}?latitude={cfg["Weather:Latitude"]}&longitude={cfg["Weather:Longitude"]}&current=wind_speed_10m,wind_direction_10m";
                var (kmh, from) = OpenMeteo.Parse(await http.GetStringAsync(url, ct));
                return new WeatherDto(cfg["Weather:Name"] ?? "", Math.Round(kmh, 1), from, OpenMeteo.Compass(from));
            }
            catch (Exception e) when (e is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException or KeyNotFoundException)
            {
                throw new GameException(503, "Weather is unavailable right now.");
            }
        });
        return w!;
    }
}

[ApiController, Route("api/wind")]
public class WindController(IWeatherService weather) : ControllerBase
{
    [HttpGet] public Task<WeatherDto> Get(CancellationToken ct) => weather.GetAsync(ct);
}
