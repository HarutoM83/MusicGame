using UnityEngine;

public class MusicResultData : MonoBehaviour
{
    public static MusicResultData Instance;

    [Header("今回のプレイ結果")]
    public string musicNameId;
    public int score;
    public int maxCombo;
    public int perfectPlusCount;
    public int perfectCount;
    public int greatCount;
    public int goodCount;
    public int badCount;
    public int missCount;

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

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    // 指定した曲のハイスコアをセーブする
    public void SaveHighScore()
    {
        // 既存のハイスコアを読み込む
        int currentHighScore = PlayerPrefs.GetInt("HighScore_" + musicNameId, 0);

        // 今回のスコアが高ければ更新
        if (score > currentHighScore)
        {
            PlayerPrefs.SetInt("HighScore_" + musicNameId, score);
            PlayerPrefs.Save();
            Debug.Log("新記録達成！ハイスコアを保存しました: " + score);
        }
    }

    // ハイスコアを取得する
    public int GetHighScore()
    {
        return PlayerPrefs.GetInt("HighScore_" + musicNameId, 0);
    }
}
