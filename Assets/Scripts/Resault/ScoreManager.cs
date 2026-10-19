using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections;

public class ScoreManager : MonoBehaviour
{
    public JudgeManager judge;
    public static ScoreManager Instance;

    [Header("UIテキスト（ゲーム画面用）")]
    [SerializeField] private TMP_Text comboText;
    [SerializeField] private TMP_Text scoreText;

    // 曲終了時に「All Perfect」や「Full Combo」を表示するテキスト
    [SerializeField] private TMP_Text resultStateText;

    [Header("コンボの文字色設定")]
    [SerializeField] private Color PerfectComboColor = new Color(0.0f, 0.8f, 1.0f, 1.0f);
    [SerializeField] private Color normalComboColor = Color.yellow;
    [SerializeField] private Color defaultComboColor = Color.gray;

    [Header("終了後の演出設定")]
    [SerializeField] private float fadeOutWaitTime = 2.0f; // 音楽が終わってからシーン遷移するまでの追加の余韻（秒）

    // ゲーム中のリアルタイムデータ
    private float currentScore = 0f;
    private int currentCombo = 0;
    private int maxCombo = 0;

    // 各判定のカウント
    private int pPlus, perfect, great, good, bad, miss;

    // これまでに処理されたノーツの総数
    private int processedNotesCount = 0;

    // フルコンボの状態を管理するフラグ
    private bool isAllPerfectPlus = true;
    private bool isAllPerfect = true;
    private bool isFullCombo = true;

    [Header("譜面データ（ゲーム開始時に設定）")]
    public int maxChartCombo = 0; // その曲の最大コンボ数（総ノーツ数）

    // ChartLoader から受け取る BGM の AudioSource
    private AudioSource bgmAudioSource;

    // 1ノーツあたりの配点
    private float perfectBaseScore = 0f;

    // 終了シーケンスの二重実行防止用フラグ
    private bool isFinished = false;

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

        // 開始時は結果テキストを空にしておく
        if (resultStateText != null) resultStateText.text = "";

        UpdateUI();
    }

    // ChartLoader から AudioSource を受け取るためのメソッド
    public void SetAudioSource(AudioSource audioSource)
    {
        this.bgmAudioSource = audioSource;
    }

    public void AddJudgment(string judgment)
    {
        // すでに終了シーケンスに入っていたら判定を受け付けない
        if (isFinished) return;

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
                isAllPerfectPlus = false;
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
                isFullCombo = false;
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
                isAllPerfectPlus = false;
                isAllPerfect = false;
                isFullCombo = false;
                break;
        }

        if (currentCombo > maxCombo) maxCombo = currentCombo;

        // ノーツが1つ処理されるごとにカウントを増やす
        processedNotesCount++;

        UpdateUI();

        // 最後のノーツの判定が完了した瞬間
        if (maxChartCombo > 0 && processedNotesCount >= maxChartCombo)
        {
            isFinished = true;
            // コルーチンを起動して終了演出とシーン遷移を管理
            StartCoroutine(HandleEndSequenceRoutine());
        }
    }

    // ★ 曲が終わるのを待ってからシーン遷移するコルーチン
    private IEnumerator HandleEndSequenceRoutine()
    {
        Debug.Log("すべてのノーツの判定が終了しました。結果を表示し、曲の終了を待ちます。");

        //「ALL PERFECT」や「FULL COMBO」のテキストを表示する
        PrepareResultText();

        // リザルトデータへの保存処理（必要に応じてコメントアウトを解除）
        if (GameDataHolder.Instance != null)
        {
            // 今回のデータをセット
            var result = GameDataHolder.Instance.currentResult;
            result.score = Mathf.RoundToInt(currentScore);
            result.maxCombo = maxCombo;
            result.perfectPlusCount = pPlus;
            result.perfectCount = perfect;
            result.greatCount = great;
            result.goodCount = good;
            result.badCount = bad;
            result.missCount = miss;

            // 保存とハイスコア更新判定を実行
            string playingMusicId = "song_01";
            GameDataHolder.Instance.SaveResult(playingMusicId);
        }
        else
        {
            Debug.LogWarning("GameResultData がシーン内に存在しません！データが引き継がれません。");
        }

        // AudioSource（BGM）が再生中なら、曲が完全に終わる（isPlaying が false になる）まで待つ
        if (bgmAudioSource != null && bgmAudioSource.isPlaying)
        {
            while (bgmAudioSource.isPlaying)
            {
                yield return null; // 1フレームごとに再生中かチェック
            }
        }
        else
        {
            // AudioSourceが設定されていない、またはすでに止まっている場合の保険
            yield return new WaitForSeconds(3.0f);
        }

        //曲が終わったあとに、画面が暗転するまでの余韻タメ時間を挟む
        yield return new WaitForSeconds(fadeOutWaitTime);

        // シーンを切り替える
        OnTimelineLoadResultScene();
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
        if (currentCombo > 0)
        {
            if (isAllPerfectPlus || isAllPerfect)
            {
                comboText.color = PerfectComboColor;
            }
            else if (isFullCombo)
            {
                comboText.color = normalComboColor;
            }
            else
            {
                comboText.color = defaultComboColor;
            }
        }
        else
        {
            comboText.color = defaultComboColor;
        }
    }

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
                resultStateText.text = "";
            }
        }
    }

    // シーンを切り替えるメソッド
    public void OnTimelineLoadResultScene()
    {
        UnityEngine.SceneManagement.SceneManager.LoadScene("ResultScene");
    }
}