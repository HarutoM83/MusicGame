using UnityEngine;
using TMPro;

public class GameUIManager : MonoBehaviour
{
    public static GameUIManager Instance;

    [Header("ゲーム画面のUIテキスト")]
    [SerializeField] private TMP_Text songTitleText;
    [SerializeField] private TMP_Text artistText;
    [SerializeField] private TMP_Text difficultyAndLevelText;
    [SerializeField] private TMP_Text chartDesignerText;

    void Awake()
    {
        Instance = this;
    }

    // JSONから読み込んだ ChartData を受け取ってUIに反映する
    public void SetupUI(ChartData chart)
    {
        if (chart == null) return;

        if (songTitleText != null)
            songTitleText.text = chart.title;

        if (artistText != null)
            artistText.text = chart.artist;

        if (chartDesignerText != null)
            chartDesignerText.text = "Charted by: " + chart.chartDesigner;

        if (difficultyAndLevelText != null)
        {
            // 例: "EXPERT - Lv.12" のように表示
            difficultyAndLevelText.text = $"{chart.difficulty.ToUpper()} - Lv.{chart.level}";

            // 難易度に応じたカラーを反映する
            difficultyAndLevelText.color = DifficultyColorUtility.GetDifficultyColor(chart.difficulty);
        }
    }
}
