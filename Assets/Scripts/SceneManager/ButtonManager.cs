using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class ButtonManager : MonoBehaviour
{
    [SerializeField] GameObject MenuCanvas;

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
        SceneManager.LoadScene("MusicSelectScene");
    }
    public void OnMusicSelectClick()
    {
        FadeManager.Instance.LoadScene("GameScene",1f);
    }
    public void OnMenuButtonClick()
    {
        MenuCanvas.SetActive(true);
        Time.timeScale = 0f; // ƒQ[ƒ€‚ğˆê’â~
        AudioListener.pause = true; // ‚·‚×‚Ä‚Ì‰¹‚ğˆê’â~‚·‚é
    }
    public void OnRestartButtonClick()
    {
        MenuCanvas.SetActive(false);
        Time.timeScale = 1f; // ƒQ[ƒ€‚ğÄŠJ
        Invoke("Retry", 1f);
    }
    public void OnReverseButtonClick()
    {
        MenuCanvas.SetActive(false);
        Time.timeScale = 1f; // ƒQ[ƒ€‚ğÄŠJ
        AudioListener.pause = false; // ‰¹‚ğÄŠJ‚·‚é
    }
    public void OnQuitButtonClick()
    {
        Time.timeScale = 1f; // ƒQ[ƒ€‚ğÄŠJ
        FadeManager.Instance.LoadScene("MusicSelectScene", 1f);
    }
    private void Retry()
    {
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
        AudioListener.pause = false; // ‰¹‚ğÄŠJ‚·‚é
    }
}
