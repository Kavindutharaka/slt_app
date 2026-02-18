namespace SLTQuizApp.Models;

public class ScoreRecord
{
    public int Id { get; set; }
    public string UserName { get; set; } = "";
    public string Tp { get; set; } = "";
    public string Category { get; set; } = "";
    public int Score { get; set; }
    public int TotalQuestions { get; set; }
    public DateTime CreatedAt { get; set; }
}
