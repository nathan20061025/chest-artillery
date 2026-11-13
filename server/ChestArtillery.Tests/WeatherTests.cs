using ChestArtillery.Core;

namespace ChestArtillery.Tests;

public class WeatherTests
{
    [Theory]
    [InlineData(0, "N")] [InlineData(44, "NE")] [InlineData(90, "E")] [InlineData(225, "SW")] [InlineData(270, "W")] [InlineData(359, "N")] [InlineData(-90, "W")]
    public void Compass_names_the_bearing(double deg, string expected) => Assert.Equal(expected, OpenMeteo.Compass(deg));

    [Fact]
    public void Parse_reads_speed_and_direction()
    {
        var (kmh, from) = OpenMeteo.Parse("""{"current":{"time":"2026-11-13T10:00","wind_speed_10m":12.34,"wind_direction_10m":249.6}}""");
        Assert.Equal(12.34, kmh);
        Assert.Equal(250, from);
    }

    [Fact]
    public void Parse_rejects_a_reply_without_wind() => Assert.Throws<KeyNotFoundException>(() => OpenMeteo.Parse("""{"current":{}}"""));
}
