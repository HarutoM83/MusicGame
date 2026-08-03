using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

public class Loading : MonoBehaviour
{
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
        SceneManager.LoadScene(scenename);
    }
}
