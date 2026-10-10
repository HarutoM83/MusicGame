using UnityEngine;

public class GameDataHolder : MonoBehaviour
{
    public static GameDataHolder Instance;

    // 次にプレイする曲のJSONファイル名、またはパス
    public string selectedJsonFileName = "Test.json";

    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject); // シーンをまたいでも破棄されないようにする
        }
        else
        {
            Destroy(gameObject);
        }
    }
}
