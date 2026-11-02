using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class GameDataReset : MonoBehaviour
{
    [Header("シーン名の設定")]
    [SerializeField] private string loadSceneName = "LoadingScene";   // ロード画面のシーン名
    [SerializeField] private string titleSceneName = "TitleScene"; // タイトル画面のシーン名
    [Header("リセットしたいテキスト")]
    [SerializeField] private TMP_Text highScoreText;
    [SerializeField] private Text maxComboText;

    /// <summary>
    /// 現在選んでいる曲のデータをリセットして、画面と内部変数を同期する
    /// </summary>
    public void OnClickResetButton()
    {
        //string targetSongId = GameDataHolder.Instance.currentSongId;

        // セーブデータ（PlayerPrefs）を削除
        GameDataHolder.Instance.ResetAllResults();
        // ロード画面の次の行き先を「タイトル画面」に上書き指定する
        Loading.nextSceneOverride = titleSceneName;
        // ロードシーンへ遷移する
        FadeManager.Instance.LoadScene(loadSceneName,1f);

        // テキスト表示を「未プレイ（または0）」に戻す
        //UpdateSongDataUI();
    }

    /*
    /// <summary>
    /// 現在のデータをロードして画面のUIテキストに反映する関数
    /// </summary>
    private void UpdateSongDataUI()
    {
        string targetSongId = GameDataHolder.Instance.currentSongId;

        // 最新のデータをロード（消えていれば初期値の0データが返ってくる）
        PlayResultData data = GameDataHolder.Instance.LoadResult(targetSongId);

        // 画面のテキストを更新
        if (data.score == 0 && data.maxCombo == 0)
        {
            // 未プレイ時の表示
            highScoreText.text = "Score: ---";
            maxComboText.text = "Max Combo: ---";
        }
        else
        {
            // プレイ済みの表示
            highScoreText.text = "Score: " + data.score.ToString();
            maxComboText.text = "Max Combo: " + data.maxCombo.ToString();
        }
    }
    */
}
