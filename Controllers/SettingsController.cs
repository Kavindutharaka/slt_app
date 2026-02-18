using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using SLTQuizApp.Models;

namespace SLTQuizApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly string _connStr;

    public SettingsController(IConfiguration config)
    {
        _connStr = config.GetConnectionString("Default")!;
    }

    [HttpGet("{category}")]
    public IActionResult GetSettings(string category)
    {
        using var conn = new SqlConnection(_connStr);
        conn.Open();
        using var cmd = new SqlCommand(
            "SELECT QuestionCount FROM QuizSettings WHERE Category = @Category", conn);
        cmd.Parameters.AddWithValue("@Category", category);
        var result = cmd.ExecuteScalar();
        int count = result != null ? Convert.ToInt32(result) : 5;
        return Ok(new { questionCount = count });
    }

    [HttpPost]
    public IActionResult SaveSettings([FromBody] QuizSettings settings)
    {
        using var conn = new SqlConnection(_connStr);
        conn.Open();

        using var checkCmd = new SqlCommand(
            "SELECT COUNT(*) FROM QuizSettings WHERE Category = @Category", conn);
        checkCmd.Parameters.AddWithValue("@Category", settings.Category);
        int exists = (int)checkCmd.ExecuteScalar();

        if (exists > 0)
        {
            using var updateCmd = new SqlCommand(
                "UPDATE QuizSettings SET QuestionCount = @Count WHERE Category = @Category", conn);
            updateCmd.Parameters.AddWithValue("@Count", settings.QuestionCount);
            updateCmd.Parameters.AddWithValue("@Category", settings.Category);
            updateCmd.ExecuteNonQuery();
        }
        else
        {
            using var insertCmd = new SqlCommand(
                "INSERT INTO QuizSettings (Category, QuestionCount) VALUES (@Category, @Count)", conn);
            insertCmd.Parameters.AddWithValue("@Category", settings.Category);
            insertCmd.Parameters.AddWithValue("@Count", settings.QuestionCount);
            insertCmd.ExecuteNonQuery();
        }

        return Ok(new { success = true });
    }
}
