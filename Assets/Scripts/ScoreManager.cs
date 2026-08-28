using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class ScoreManager : MonoBehaviour
{
    public static ScoreManager Instance;
    private string lastJudgment;

    [Header("UIテキスト（ゲーム画面用）")]
    [SerializeField] private TMP_Text comboText;
    [SerializeField] private TMP_Text scoreText;

    // ゲーム中のリアルタイムデータ
    private float currentScore = 0f; // ★計算精度のためfloatで保持
    private int currentCombo = 0;
    private int maxCombo = 0;

    // 各判定のカウント
    private int pPlus, perfect, great, good, bad, miss;

    [Header("譜面データ（ゲーム開始時に設定）")]
    public int totalNotes = 0; // ★その曲の総ノーツ数（例: 500個）

    // 1ノーツあたりの配点（自動計算される）
    private float perfectBaseScore = 0f;

    void Awake()
    {
        Instance = this;
    }

    void Start()
    {
       // if (GameResultData.Instance != null) GameResultData.Instance.ClearData();

        // ★最重要: 1ノーツあたりのPerfectの配点を計算
        if (totalNotes > 0)
        {
            // 1,000,000点 を 総ノーツ数で割る
            perfectBaseScore = 1000000f / totalNotes;
        }
        else
        {
            Debug.LogError("総ノーツ数(totalNotes)が0、または設定されていません！");
            perfectBaseScore = 1000f; // エラー防止のデフォルト値
        }

        UpdateUI();
    }

    public void AddJudgment(string judgment)
    {
        lastJudgment = judgment;
        switch (judgment)
        {
            case "Perfect+":
                pPlus++;
                currentCombo++;
                // ★Perfectの1.01倍の点数（全てこれなら101万点になる）
                currentScore += perfectBaseScore * 1.01f;
                break;

            case "Perfect":
                perfect++;
                currentCombo++;
                // ★ベース配点（全てこれならちょうど100万点になる）
                currentScore += perfectBaseScore;
                break;

            case "Great":
                great++;
                currentCombo++;
                currentScore += perfectBaseScore * 0.7f; // Perfectの70%の点数
                break;

            case "Good":
                good++;
                currentCombo = 0;
                currentScore += perfectBaseScore * 0.4f; // Perfectの40%の点数
                break;

            case "Bad":
                bad++;
                currentCombo = 0;
                currentScore += perfectBaseScore * 0.1f; // Perfectの10%の点数
                break;

            case "Miss":
                miss++;
                currentCombo = 0;
                // 点数加算なし
                break;
        }

        if (currentCombo > maxCombo) maxCombo = currentCombo;
        UpdateUI();
    }

    void UpdateUI()
    {
        if (comboText != null)
        {
            if (currentCombo == 0)
            {
                comboText.text = "";
            }
            else
            {
                comboText.text = currentCombo.ToString();
                UpdateComboColor();
            }
        }

        if (scoreText != null)
        {
            // ★表示するときは Mathf.RoundToInt で四捨五入して整数にする
            // 計算途中の小数点以下のズレで、最後に1点ズレるのを防ぎます
            int displayScore = Mathf.RoundToInt(currentScore);
            scoreText.text = displayScore.ToString();
        }
    }
    private void UpdateComboColor()
    {
        if (lastJudgment == "Perfect+")
        {
            comboText.color = Color.blue;
        }
        else if (lastJudgment == "Perfect")
        {
            comboText.color = Color.yellow;
        }
        else
        {
            comboText.color = Color.gray;
        }
        // 100コンボ以上
        if (currentCombo >= 100)
        {
            comboText.color = Color.orange;
        }
    }

    public void OnSongFinished()
    {/*
        if (GameResultData.Instance != null)
        {
            // ★リザルトデータに渡すときも整数に変換して渡す
            GameResultData.Instance.score = Mathf.RoundToInt(currentScore);
            GameResultData.Instance.maxCombo = maxCombo;
            GameResultData.Instance.perfectPlusCount = pPlus;
            GameResultData.Instance.perfectCount = perfect;
            GameResultData.Instance.greatCount = great;
            GameResultData.Instance.goodCount = good;
            GameResultData.Instance.badCount = bad;
            GameResultData.Instance.missCount = miss;
        }

        FadeManager.Instance.LoadScene("ResultScene", 1f);
        */
    }
}
