using UnityEngine;

public class MusicSelect : MonoBehaviour
{
    [Header("このジャケット（曲）が参照するJSONファイル名")]
    [SerializeField] private string targetJsonFileName; // 例: "SongA.json" など

    public void OnMusicSelectClick()
    {
        if (GameDataHolder.Instance != null)
        {
            // GameDataHolder に選ばれた曲のJSONファイル名をセットする
            GameDataHolder.Instance.currentSongId = targetJsonFileName;
            // （selectedJsonFileName = targetJsonFileName; でもOK）
        }
        //ゲームシーンへ移動
        if (FadeManager.Instance != null)
        {
            FadeManager.Instance.LoadScene("GameScene", 1f);
        }
        else
        {
            UnityEngine.SceneManagement.SceneManager.LoadScene("GameScene");
        }
        Time.timeScale = 1f; // ゲームを再開
        AudioListener.pause = false; // 音を再開する
    }
}
