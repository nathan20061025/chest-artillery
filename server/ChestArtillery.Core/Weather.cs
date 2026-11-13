using System.Text.Json;

namespace ChestArtillery.Core;

/// <summary>Real weather shown as flavour in the UI. It does not change the game's wind.</summary>
public record WeatherDto(string Location, double WindKmh, int DirectionFrom, string Compass);

public interface IWeatherService { Task<WeatherDto> GetAsync(CancellationToken ct = default); }

public static class OpenMeteo
{
    static readonly string[] Points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

    /// <summary>Compass point for a bearing in degrees (the direction the wind comes FROM).</summary>
    public static string Compass(double degrees) => Points[(int)Math.Round(((degrees % 360) + 360) % 360 / 45) % 8];

    /// <summary>Reads wind speed (km/h) and direction from an Open-Meteo "current" reply.</summary>
    public static (double Kmh, int From) Parse(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var c = doc.RootElement.GetProperty("current");
        return (c.GetProperty("wind_speed_10m").GetDouble(), (int)Math.Round(c.GetProperty("wind_direction_10m").GetDouble()));
    }
}
