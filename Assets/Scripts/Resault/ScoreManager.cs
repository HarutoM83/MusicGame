using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections; // 追記: コルーチンを使用するために必要

public class ScoreManager : MonoBehaviour
{
    public JudgeManager judge;
    public static ScoreManager Instance;
    // private string lastJudgment; // 使わない場合は削除またはコメントアウト可能

    [Header("UIテキスト（ゲーム画面用）")]
    [SerializeField] private TMP_Text comboText;
    [SerializeField] private TMP_Text scoreText;

    // ★ 追加：曲終了時に「All Perfect」や「Full Combo」を表示するテキスト
    [SerializeField] private TMP_Text resultStateText;
    [Header("コンボの文字色設定")]
    [SerializeField] private Color PerfectComboColor = new Color(0.0f, 0.8f, 1.0f, 1.0f); // Perfect+のみの時（All Perfectなど）
    [SerializeField] private Color normalComboColor = Color.yellow;                      // フルコンボ時（Good/Bad/Missはなし、Greatはあり等）
    [SerializeField] private Color defaultComboColor = Color.gray;                       // コンボが切れた時の色

    // ゲーム中のリアルタイムデータ
    private float currentScore = 0f; // 計算精度のためfloatで保持
    private int currentCombo = 0;
    private int maxCombo = 0; // プレイヤーが実際に達成した最大コンボ

    // 各判定のカウント
    private int pPlus, perfect, great, good, bad, miss;

    // ★ 追加：フルコンボの状態を管理するフラグ
    private bool isAllPerfectPlus = true; // 途中までずっと Perfect+ のみか
    private bool isAllPerfect = true; // 途中までずっと Perfect のみか
    private bool isFullCombo = true;      // 途中まで一度もコンボが途切れていないか

    [Header("譜面データ（ゲーム開始時に設定）")]
    public int maxChartCombo = 0; // その曲の最大コンボ数（総ノーツ数）

    // 1ノーツあたりの配点（自動計算される）
    private float perfectBaseScore = 0f;

    void Awake()
    {
        Instance = this;
    }

    void Start()
    {
        if (maxChartCombo > 0)
        {
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
        // 判定ごとの処理
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
                isAllPerfectPlus = false; // Perfect+以外が出たのでオールP+ではない
                break;

            case "Great":
                great++;
                currentCombo++;
                currentScore += perfectBaseScore * 0.7f;
                isAllPerfectPlus = false;
                isAllPerfect = false;
                break;

            case "Good":
                good++;
                currentCombo = 0;
                currentScore += perfectBaseScore * 0.4f;
                isAllPerfectPlus = false;
                isAllPerfect = false;
                isFullCombo = false;      // コンボが切れたのでフルコンボではない
                break;

            case "Bad":
                bad++;
                currentCombo = 0;
                currentScore += perfectBaseScore * 0.1f;
                isAllPerfectPlus = false;
                isAllPerfect = false;
                isFullCombo = false;
                break;

            case "Miss":
                miss++;
                currentCombo = 0;
                // 点数加算なし
                isAllPerfectPlus = false;
                isAllPerfect = false;
                isFullCombo = false;
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
            int displayScore = Mathf.RoundToInt(currentScore);
            scoreText.text = displayScore.ToString();
        }
    }

    private void UpdateComboColor()
    {
        // コンボが続いている場合
        if (currentCombo > 0)
        {
            // これまでに「Perfect+とPerfect以外」を一度でも出していなければ水色
            if (isAllPerfectPlus||isAllPerfect)
            {
                comboText.color = PerfectComboColor;
            }
            // フルコンボが継続中（Good/Bad/Missを出していない）なら黄色
            else if (isFullCombo)
            {
                comboText.color = normalComboColor;
            }
            // コンボは繋がっているが、過去にGood等でフルコンボが途絶えている場合の色
            else
            {
                comboText.color = defaultComboColor; // 必要に応じて別の色や normalComboColor にしてください
            }
        }
        else
        {
            comboText.color = defaultComboColor;
        }
    }

    //パネルが出現した瞬間に文字をセットするメソッド
    public void PrepareResultText()
    {
        if (resultStateText != null)
        {
            if (isAllPerfectPlus && pPlus > 0)
            {
                resultStateText.text = "ALL PERFECT";
                resultStateText.color = PerfectComboColor;
            }
            else if (isFullCombo && (pPlus + perfect + great + good + bad + miss) > 0)
            {
                resultStateText.text = "FULL COMBO";
                resultStateText.color = normalComboColor;
            }
            else
            {
                resultStateText.text = ""; // 該当なしなら何も表示しない
            }
        }
    }

    /*
        // リザルトデータへの保存処理（必要に応じてコメントアウトを解除）
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
        */

    // 余韻が終わってシーンを切り替えるメソッド
    public void OnTimelineLoadResultScene()
    {
        // 例: リザルト画面へ遷移
        //UnityEngine.SceneManagement.SceneManager.LoadScene("ResultScene");

        // FadeManagerを使っている場合はこちら
        FadeManager.Instance.LoadScene("ResultScene", 1f);
    }
}