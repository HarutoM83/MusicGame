using UnityEngine;
using UnityEngine.SceneManagement;
using System;
using System.Linq;
using System.Collections;
using System.Collections.Generic;

public class FadeManager : MonoBehaviour
{
    #region Singleton

    private static FadeManager instance;

    public static FadeManager Instance
    {
        get
        {
            if (instance == null)
            {
                instance = (FadeManager)FindObjectOfType(typeof(FadeManager));

                if (instance == null)
                {
                    Debug.LogError(typeof(FadeManager) + "is nothing");
                }
            }

            return instance;
        }
    }

    #endregion


    public bool DebugMode = true;

    private float fadeAlpha = 0;
    private bool isFading = false;

    // 現在使用するフェード色
    private Color fadeColor = Color.black;


    // シーンごとのフェード色設定
    [Serializable]
    public class SceneFadeColor
    {
        public string sceneName;
        public Color color = Color.black;
    }

    public List<SceneFadeColor> sceneFadeColors = new List<SceneFadeColor>();


    public void Awake()
    {
        if (this != Instance)
        {
            Destroy(this.gameObject);
            return;
        }

        DontDestroyOnLoad(this.gameObject);
    }


    public void OnGUI()
    {
        if (this.isFading)
        {
            fadeColor.a = fadeAlpha;
            GUI.color = fadeColor;
            GUI.DrawTexture(
                new Rect(0, 0, Screen.width, Screen.height),
                Texture2D.whiteTexture
            );
        }
    }


    public void LoadScene(string scene, float interval)
    {
        StartCoroutine(TransScene(scene, interval));
    }


    private IEnumerator TransScene(string scene, float interval)
    {
        // 遷移先シーンの色を取得
        fadeColor = GetSceneFadeColor(scene);


        // 暗転
        isFading = true;

        float time = 0;

        while (time <= interval)
        {
            fadeAlpha = Mathf.Lerp(0f, 1f, time / interval);
            time += Time.deltaTime;
            yield return null;
        }


        // シーン変更
        SceneManager.LoadScene(scene);


        // 明転
        time = 0;

        while (time <= interval)
        {
            fadeAlpha = Mathf.Lerp(1f, 0f, time / interval);
            time += Time.deltaTime;
            yield return null;
        }


        isFading = false;
    }


    // シーン名から色を探す
    private Color GetSceneFadeColor(string sceneName)
    {
        foreach (SceneFadeColor data in sceneFadeColors)
        {
            if (data.sceneName == sceneName)
            {
                return data.color;
            }
        }

        // 設定がない場合は黒
        return Color.black;
    }
}