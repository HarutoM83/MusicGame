using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class GameUIManager : MonoBehaviour
{
    public static GameUIManager Instance;

    [Header("ゲーム画面のUIテキスト")]
    [SerializeField] private Text songTitleText;
    [SerializeField] private Text artistText;
    [SerializeField] private Text difficultyText;
    [SerializeField] private Text LevelText;
    [SerializeField] private Text chartDesignerText;
    [SerializeField] private TMP_Text bpmText;

    [Header("難易度カラーを反映させたい画像（Image）")]
    [SerializeField] private Image difficultyBackgroundImage;
    [SerializeField] private Image difficultyBackgroundImage2;

    [Header("難易度カラーのデータベース（アセットファイルをここにドラッグする）")]
    [SerializeField] private DifficultyColorDatabase colorDatabase; // ★追加

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
            chartDesignerText.text = chart.chartDesigner;

        // 両方のテキストがアセットに設定されている場合のみ処理する
        if (difficultyText != null && LevelText != null)
        {
            // ① .text をつけ、② $ をつける
            difficultyText.text = $"{chart.difficulty.ToUpper()}";
            LevelText.text = $"{chart.level}";

            // 難易度に応じたカラーを反映する
            if (colorDatabase != null)
            {
                difficultyBackgroundImage.color = colorDatabase.GetColor(chart.difficulty);
                difficultyBackgroundImage2.color = colorDatabase.GetColor(chart.difficulty);
            }
        }
    }
}

