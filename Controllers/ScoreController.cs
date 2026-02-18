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

    [HttpGet]
    public IActionResult GetAllScores()
    {
        var list = new List<object>();
        using var conn = new SqlConnection(_connStr);
        conn.Open();
        using var cmd = new SqlCommand(
            "SELECT Id, UserName, Tp, Category, Score, TotalQuestions, CreatedAt FROM dbo.slt_score ORDER BY CreatedAt DESC", conn);
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            list.Add(new
            {
                id = reader.GetInt32(0),
                userName = reader.GetString(1),
                tp = reader.GetString(2),
                category = reader.GetString(3),
                score = reader.GetInt32(4),
                totalQuestions = reader.GetInt32(5),
                createdAt = reader.GetDateTime(6).ToString("yyyy-MM-dd HH:mm:ss")
            });
        }
        return Ok(list);
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
