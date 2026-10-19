using UnityEngine;

[System.Serializable]
public class PlayResultData
{
    public int score;
    public int maxCombo;
    public int perfectPlusCount;
    public int perfectCount;
    public int greatCount;
    public int goodCount;
    public int badCount;
    public int missCount;
    public bool isNewHighScore; // 今回ハイスコアを更新したかどうかのフラグ
}

public class GameDataHolder : MonoBehaviour
{
    // ★修正: 型を MusicResultData から GameDataHolder に修正
    public static GameDataHolder Instance;

    [Header("次にプレイする曲（またはJSONファイル名）")]
    public string currentSongId = "Test.json"; // 以前の selectedJsonFileName と同じ用途として使えます

    [Header("今回のプレイ結果（ゲーム中から渡される）")]
    public PlayResultData currentResult = new PlayResultData();

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject); // シーンを変えても消えないようにする
        }
        else
        {
            Destroy(gameObject);
        }
    }

    // ==========================================
    // ハイスコア＆リザルトのセーブ・ロード機能
    // ==========================================

    // スコアを保存し、ハイスコア更新判定を行う
    public void SaveResult(string songId)
    {
        // 1. 既存のセーブデータを読み込む
        PlayResultData savedData = LoadResult(songId);

        // 2. ハイスコア比較
        if (currentResult.score > savedData.score)
        {
            // 更新した場合
            currentResult.isNewHighScore = true;

            // JSON形式に変換して保存
            string json = JsonUtility.ToJson(currentResult);
            PlayerPrefs.SetString("Result_" + songId, json);
            PlayerPrefs.Save();
            Debug.Log(songId + " のハイスコアを更新しました！: " + currentResult.score);
        }
        else
        {
            // 更新しなかった場合
            currentResult.isNewHighScore = false;
        }
    }

    // 指定した曲のセーブデータをロードする
    public PlayResultData LoadResult(string songId)
    {
        string key = "Result_" + songId;
        if (PlayerPrefs.HasKey(key))
        {
            string json = PlayerPrefs.GetString(key);
            return JsonUtility.FromJson<PlayResultData>(json);
        }
        else
        {
            // 初めて遊ぶ曲の場合の初期データ
            return new PlayResultData();
        }
    }

    // 互換性を持たせる場合（どちらの名前で書いても動くようにする）
    public string selectedJsonFileName
    {
        get => currentSongId;
        set => currentSongId = value;
    }
}