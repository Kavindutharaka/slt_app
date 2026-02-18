using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace SLTQuizApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuestionController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public QuestionController(IWebHostEnvironment env)
    {
        _env = env;
    }

    [HttpGet("{category}")]
    public IActionResult GetQuestions(string category)
    {
        var path = Path.Combine(_env.ContentRootPath, "questions.json");
        if (!System.IO.File.Exists(path))
            return NotFound("questions.json not found");

        var json = System.IO.File.ReadAllText(path);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var categories = root.GetProperty("categories");
        foreach (var cat in categories.EnumerateArray())
        {
            if (cat.GetProperty("category").GetString()?.Equals(category, StringComparison.OrdinalIgnoreCase) == true)
            {
                return Ok(cat.GetProperty("questions").ToString());
            }
        }

        return NotFound("Category not found");
    }
}
