using TMPro;
using UnityEngine;

public class ResultManager : MonoBehaviour
{
    [Header("リザルト画面のテキストUI")]
    [SerializeField] private TMP_Text newRecordText;
    [SerializeField] private TMP_Text scoreText;
    [SerializeField] private TMP_Text highScoreText;
    [SerializeField] private TMP_Text maxComboText;
    [SerializeField] private TMP_Text pPlusText;
    [SerializeField] private TMP_Text perfectText;
    [SerializeField] private TMP_Text greatText;
    [SerializeField] private TMP_Text goodText;
    [SerializeField] private TMP_Text badText;
    [SerializeField] private TMP_Text missText;

    private void Start()
    {
        if (GameDataHolder.Instance != null)
        {
            // 現在選択中（プレイした）の曲IDを取得
            string songId = GameDataHolder.Instance.selectedJsonFileName;

            // 今回のプレイ結果データ
            var result = GameDataHolder.Instance.currentResult;

            // 今回のスコアとコンボを表示
            scoreText.text = result.score.ToString("N0");
            maxComboText.text = result.maxCombo.ToString();

            // 各判定数を表示（※ currentResult から取得するよう修正）
            pPlusText.text = result.perfectPlusCount.ToString();
            perfectText.text = result.perfectCount.ToString();
            greatText.text = result.greatCount.ToString();
            goodText.text = result.goodCount.ToString();
            badText.text = result.badCount.ToString();
            missText.text = result.missCount.ToString();

            // 保存されているハイスコアを取得して表示
            PlayResultData savedData = GameDataHolder.Instance.LoadResult(songId);
            highScoreText.text = savedData.score.ToString("N0");

            // 4. ハイスコアを更新した場合だけ「NEW RECORD!」を表示する
            if (result.isNewHighScore)
            {
                if (newRecordText != null)
                {
                    newRecordText.gameObject.SetActive(true);
                    newRecordText.text = "NEW RECORD!";
                }
            }
            else
            {
                if (newRecordText != null)
                {
                    newRecordText.gameObject.SetActive(false); // 更新していなければ隠す
                }
            }
        }
        else
        {
            // デバッグ用（リザルトシーン単体で再生したときのエラー防止）
            Debug.LogWarning("GameDataHolder が見つかりません。");
        }
    }
}