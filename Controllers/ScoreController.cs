using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using SLTQuizApp.Models;

namespace SLTQuizApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScoreController : ControllerBase
{
    private readonly string _connStr;

    public ScoreController(IConfiguration config)
    {
        _connStr = config.GetConnectionString("Default")!;
    }

    [HttpPost]
    public IActionResult SaveScore([FromBody] ScoreRecord record)
    {
        using var conn = new SqlConnection(_connStr);
        conn.Open();
        using var cmd = new SqlCommand(
            @"INSERT INTO dbo.slt_score (UserName, Tp, Category, Score, TotalQuestions, CreatedAt)
              VALUES (@UserName, @Tp, @Category, @Score, @TotalQuestions, @CreatedAt)", conn);
        cmd.Parameters.AddWithValue("@UserName", record.UserName);
        cmd.Parameters.AddWithValue("@Tp", record.Tp);
        cmd.Parameters.AddWithValue("@Category", record.Category);
        cmd.Parameters.AddWithValue("@Score", record.Score);
        cmd.Parameters.AddWithValue("@TotalQuestions", record.TotalQuestions);
        cmd.Parameters.AddWithValue("@CreatedAt", DateTime.Now);
        cmd.ExecuteNonQuery();
        return Ok(new { success = true });
    }
}
