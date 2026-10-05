using System.Collections; // コルーチンを使うために必要
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using TMPro;

public class ButtonManager : MonoBehaviour
{
    [SerializeField] GameObject MenuCanvas;
    [SerializeField] GameObject PauseCanvas;
    [SerializeField] GameObject OptionCanvas;

    [SerializeField] private TMP_Text countdownText;      // カウントダウン用の数字Text（TextMeshProなら TextMeshProUGUI）

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    public void OnStartButtonClick()
    {
        FadeManager.Instance.LoadScene("LoadingScene",1f);
    }
    public void OnTitleButtonClick()
    {
        SceneManager.LoadScene("TitleScene");
    }
    public void OnPauseButtonClick()
    {
        PauseCanvas.SetActive(true);
    }
    public void OnHomeButtonClick()
    {
        PauseCanvas.SetActive(false);
    }
    public void OnMusicSelectClick()
    {
        FadeManager.Instance.LoadScene("GameScene",1f);
        Time.timeScale = 1f; // ゲームを再開
        AudioListener.pause = false; // 音を再開する
    }
    public void OnMenuButtonClick()
    {
        MenuCanvas.SetActive(true);
        Time.timeScale = 0f; // ゲームを一時停止
        AudioListener.pause = true; // すべての音を一時停止する
    }
    public void OnRestartButtonClick()
    {
        MenuCanvas.SetActive(false);
        Time.timeScale = 1f; // ゲームを再開
        Invoke("Retry", 1f);
    }
    public void OnReverseButtonClick()
    {
        MenuCanvas.SetActive(false);
        // カウントダウン付きでタイムラインを再生するコルーチンを開始
        StartCoroutine(ReverseCountdownRoutine());
    }
    private IEnumerator ReverseCountdownRoutine()
    {
        // 1. カウントダウン用テキストオブジェクトを有効化（表示する）
        if (countdownText != null)
        {
            countdownText.gameObject.SetActive(true);
        }

        // 表示する文字の順番
        string[] countdownTexts = { "3", "2", "1" };

        foreach (string msg in countdownTexts)
        {
            if (countdownText != null)
            {
                countdownText.text = msg; // 1つのテキストを時間ごとに書き換える
            }
            // タイムスケールが0の可能性やポーズ中を考慮してリアルタイムで待機
            yield return new WaitForSecondsRealtime(1.0f);
        }

        // 2. カウントダウン終了：テキストを非表示にする（閉じる）
        if (countdownText != null)
        {
            countdownText.text = ""; // 文字を空にしておく（お好みで）
            countdownText.gameObject.SetActive(false);
            Time.timeScale = 1f; // ゲームを再開
            AudioListener.pause = false; // 音を再開する
        }
    }
    public void OnQuitButtonClick()
    {
        MenuCanvas.SetActive(false);
        Time.timeScale = 1f; // ゲームを再開
        Invoke("QuitGame", 0.5f);
    }
    public void OnOptionButtonClick()
    {
        OptionCanvas.SetActive(true);
    }
    public void OnOptionQuitButtonClick()
    {
        OptionCanvas.SetActive(false); // オプション画面を閉じる
    }
    private void Retry()
    {
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
        AudioListener.pause = false; // 音を再開する
    }
    private void QuitGame()
    {
        FadeManager.Instance.LoadScene("MusicSelectScene", 1f);
    }
}
