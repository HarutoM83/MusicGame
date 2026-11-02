using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

public class Loading : MonoBehaviour
{
    // ★追加: 外部から次のシーン名を一時的に指定するための静的変数
    public static string nextSceneOverride = null;

    [Header("SceneNameSet")]
    [SerializeField] private string scenename;
    [SerializeField] private Slider slider;

    IEnumerator Start()
    {
        slider.value = 0f;

        // フェードアウト終わるぐらいまで待つ
        yield return new WaitForSeconds(0.5f);

        while (slider.value < 100f)
        {
            float waitTime = Random.Range(10.0f, 30.0f);
            // 徐々にスライダーを増やす（演出）
            slider.value += Time.deltaTime * waitTime; // 速度調整OK
            yield return null;
        }

        // もし外部から上書き用のシーン名が指定されていたらそれを使う
        if (!string.IsNullOrEmpty(nextSceneOverride))
        {
            string targetScene = nextSceneOverride;
            nextSceneOverride = null; // 次回のためにクリアしておく
            FadeManager.Instance.LoadScene(targetScene, 1f);
        }
        else
        {
            // 通常通りの遷移
            SceneManager.LoadScene(scenename);
        }
    }
}
