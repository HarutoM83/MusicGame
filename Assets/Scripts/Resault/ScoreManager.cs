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
    private float currentScore = 0f; // 計算精度のためfloatで保持
    private int currentCombo = 0;
    private int maxCombo = 0; // プレイヤーが実際に達成した最大コンボ

    // 各判定のカウント
    private int pPlus, perfect, great, good, bad, miss;

    [Header("譜面データ（ゲーム開始時に設定）")]
    public int maxChartCombo = 0; // ★ 変更：その曲の最大コンボ数（総ノーツ数）

    // 1ノーツあたりの配点（自動計算される）
    private float perfectBaseScore = 0f;

    void Awake()
    {
        Instance = this;
    }

    void Start()
    {
        // if (GameResultData.Instance != null) GameResultData.Instance.ClearData();

        // ★ 最重要: 1コンボ（1ノーツ）あたりのPerfectの配点を計算
        if (maxChartCombo > 0)
        {
            // 1,000,000点 を 最大コンボ数で割る
            perfectBaseScore = 1000000f / maxChartCombo;
        }
        else
        {
            Debug.LogError("最大コンボ数(maxChartCombo)が0、または設定されていません！");
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
                currentScore += perfectBaseScore * 1.01f;
                break;

            case "Perfect":
                perfect++;
                currentCombo++;
                currentScore += perfectBaseScore;
                break;

            case "Great":
                great++;
                currentCombo++;
                currentScore += perfectBaseScore * 0.7f;
                break;

            case "Good":
                good++;
                currentCombo = 0;
                currentScore += perfectBaseScore * 0.4f;
                break;

            case "Bad":
                bad++;
                currentCombo = 0;
                currentScore += perfectBaseScore * 0.1f;
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
                Debug.Log("コンボテキストに代入された文字: " + comboText.text);
                UpdateComboColor();
            }
        }

        if (scoreText != null)
        {
            int displayScore = Mathf.RoundToInt(currentScore);
            scoreText.text = displayScore.ToString();
        }
    }

    private void UpdateComboColor()
    {
        Debug.Log("現在のコンボ数: " + currentCombo);
        // コンボが途切れていない場合（1以上のとき）
        if (currentCombo > 0)
        {
            // 最後の判定によって色を変える例
            if (lastJudgment == "Perfect+")
            {
                comboText.color = new Color(0.0f, 0.8f, 1.0f, 1.0f); // 水色
            }
            else
            {
                comboText.color = Color.yellow; // 通常のコンボ継続時は黄色にする例
            }
        }
        else
        {
            // コンボが途切れている（通常、ここに来る前に text が空になりますが念のため）
            comboText.color = Color.white;
        }
    }

    public void OnSongFinished()
    {
        /*
        if (GameResultData.Instance != null)
        {
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