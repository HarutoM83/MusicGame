using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class ButtonManager : MonoBehaviour
{
    [SerializeField] GameObject MenuCanvas;
    [SerializeField] GameObject PauseCanvas;

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
        Time.timeScale = 1f; // ゲームを再開
        AudioListener.pause = false; // 音を再開する
    }
    public void OnQuitButtonClick()
    {
        MenuCanvas.SetActive(false);
        Time.timeScale = 1f; // ゲームを再開
        Invoke("QuitGame", 0.5f);
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
