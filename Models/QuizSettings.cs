namespace SLTQuizApp.Models;

public class QuizSettings
{
    public int Id { get; set; }
    public string Category { get; set; } = "";
    public int QuestionCount { get; set; } = 5;
}
