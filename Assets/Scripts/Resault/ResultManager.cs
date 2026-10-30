using System;
using TMPro;
using UnityEngine;

public class ResultManager : MonoBehaviour
{
    [Header("リザルト画面のテキストUI")]
    [SerializeField] private TMP_Text newRecordText;
    [SerializeField] private TMP_Text scoreText;
    [SerializeField] private TMP_Text highScoreText;
    [SerializeField] private TMP_Text scoreRankText;
    [SerializeField] private TMP_Text maxComboText;
    [SerializeField] private TMP_Text pPlusText;
    [SerializeField] private TMP_Text perfectText;
    [SerializeField] private TMP_Text greatText;
    [SerializeField] private TMP_Text goodText;
    [SerializeField] private TMP_Text badText;
    [SerializeField] private TMP_Text missText;

    // --- ランクごとの設定をまとめたデータ構造 ---
    [System.Serializable]
    public struct RankSetting
    {
        public string rankName;       // ランク名 (例: SSS, SS, S...)
        public int thresholdScore;    // このランクに必要な最低スコア
        public Color rankColor;       // その時のテキストカラー
    }

    [Header("ランク設定（高いスコア順に上から並べてください）")]
    [SerializeField]
    private RankSetting[] rankSettings = new RankSetting[]
    {
        new RankSetting { rankName = "SSS+", thresholdScore = 1090000, rankColor = new Color(0.0f, 0.8f, 1.0f, 1.0f) },
        new RankSetting { rankName = "SSS", thresholdScore = 1075000, rankColor = new Color(0.0f, 0.8f, 1.0f, 1.0f) },
        new RankSetting { rankName = "SS+", thresholdScore = 1050000, rankColor = new Color(0.0f, 0.8f, 1.0f, 1.0f) },
        new RankSetting { rankName = "SS",  thresholdScore = 1000000,  rankColor = new Color(0.0f, 0.8f, 1.0f, 1.0f) },
        new RankSetting { rankName = "S+", thresholdScore = 990000, rankColor = new Color(0.0f, 0.8f, 1.0f, 1.0f) },
        new RankSetting { rankName = "S",   thresholdScore = 975000,  rankColor = new Color(0.0f, 0.8f, 1.0f, 1.0f) },
        new RankSetting { rankName = "A",   thresholdScore = 800000,  rankColor = new Color32(255, 215, 0, 255) }, // ゴールド
        new RankSetting { rankName = "B",   thresholdScore = 700000,  rankColor = Color.blue },
        new RankSetting { rankName = "C",   thresholdScore = 500000,       rankColor = new Color32(184, 115, 51, 255) },
        new RankSetting { rankName = "D",   thresholdScore = 0,       rankColor = Color.gray }
    };

    private void Start()
    {
        if (GameDataHolder.Instance != null)
        {
            string songId = GameDataHolder.Instance.selectedJsonFileName;
            var result = GameDataHolder.Instance.currentResult;

            scoreText.text = result.score.ToString("N0");
            maxComboText.text = result.maxCombo.ToString();

            pPlusText.text = result.perfectPlusCount.ToString();
            perfectText.text = result.perfectCount.ToString();
            greatText.text = result.greatCount.ToString();
            goodText.text = result.goodCount.ToString();
            badText.text = result.badCount.ToString();
            missText.text = result.missCount.ToString();

            // ランク判定と色の反映
            if (scoreRankText != null)
            {
                SetRankAndColor(result.score);
            }

            PlayResultData savedData = GameDataHolder.Instance.LoadResult(songId);
            highScoreText.text = savedData.score.ToString("N0");

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
                    newRecordText.gameObject.SetActive(false);
                }
            }
        }
        else
        {
            Debug.LogWarning("GameDataHolder が見つかりません。");
        }
    }

    /// <summary>
    /// インスペクターの設定を元にランクを判定し、UIに反映する
    /// </summary>
    private void SetRankAndColor(int score)
    {
        // デフォルト値（万が一リストが空のとき用）
        string rankStr = "-";
        Color rankColor = Color.white;

        // 上から順に判定（スコアが高い順に並んでいる前提）
        foreach (var setting in rankSettings)
        {
            if (score >= setting.thresholdScore)
            {
                rankStr = setting.rankName;
                rankColor = setting.rankColor;
                break; // 条件に一致したらループを抜ける
            }
        }

        // ランク用テキストに反映
        if (scoreRankText != null)
        {
            scoreRankText.text = rankStr;
            scoreRankText.color = rankColor;
        }

        // スコア用テキストにも同じ色を反映する
        if (scoreText != null)
        {
            scoreText.color = rankColor;
        }
    }
}