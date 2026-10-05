using System.Collections; // コルーチンを使うために必要
using System.Collections.Generic;
using TMPro; // TextMeshProを使う場合
using UnityEngine;

[DefaultExecutionOrder(-100)]
public class JudgeManager : MonoBehaviour
{
    public static JudgeManager Instance;

    public AudioSource music;
    public List<Notes> activeNotes = new List<Notes>();

    [SerializeField] private TextMeshProUGUI judgmentTextUI; // ★ 判定を表示するテキスト

    [Header("判定ごとの色設定")]
    [SerializeField] private Color pPlusColor = new Color(0.0f, 0.8f, 1.0f);
    [SerializeField] private Color perfectColor = Color.yellow;
    [SerializeField] private Color greatColor = new Color(1.0f, 0.4f, 0.7f);
    [SerializeField] private Color goodColor = Color.yellowGreen;
    [SerializeField] private Color badColor = Color.blue;
    [SerializeField] private Color missColor = Color.gray;

    // 非表示タイマー用のコルーチンを保持する変数
    private Coroutine hideJudgmentCoroutine;

    // レーンが押されているかを保持する配列（例として4レーン分）
    private bool[] isLanePressed = new bool[4];

    void Awake()
    {
        // シングルトンの初期化を確実に実行する
        if (Instance != null)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
    }

    // 外部から「このレーンが押されているか」を確認できるようにするメソッド
    public bool IsLanePressed(int lane)
    {
        if (lane >= 0 && lane < isLanePressed.Length)
        {
            return isLanePressed[lane];
        }
        return false;
    }

    public void PressLane(int lane)
    {
        if (lane >= 0 && lane < isLanePressed.Length)
            isLanePressed[lane] = true;
    }

    public void ReleaseLane(int lane)
    {
        if (lane >= 0 && lane < isLanePressed.Length)
            isLanePressed[lane] = false;
    }

    public void Judge(int lane)
    {
        if (music == null || !music.isPlaying)
        {
            Debug.LogWarning("音楽が再生されていないか、AudioSourceが設定されていません");
            return;
        }

        float songTime = music.time;

        Notes target = null;
        float bestDiff = float.MaxValue;

        // 判定対象を探す（古いノーツ（リストの前方）を優先するため、正順で走査する方が安全な場合が多いです）
        // ただし削除の安全性を考慮して逆順にする場合は、一番古いものを選ぶ条件に調整します
        for (int i = 0; i < activeNotes.Count; i++)
        {
            Notes note = activeNotes[i];

            // null対策
            if (note == null)
            {
                activeNotes.RemoveAt(i);
                i--; // インデックスのズレを調整
                continue;
            }

            // 違うレーンは無視
            if (note.Lane != lane)continue;

            // まだ判定範囲に入っていない場合は無視
            if (songTime < note.hitTime - note.badWindow)continue;

            float diff = Mathf.Abs(songTime - note.hitTime);

            // 最初に範囲内に入った（＝一番時間が古い）ノーツを優先、もしくは最もタイミングが近いものを選択
            if (diff < bestDiff)
            {
                bestDiff = diff;
                target = note;
            }
        }

        // 対象なし
        if (target == null)return;

        JudgeResult(target, bestDiff);
    }

    void JudgeResult(Notes note, float diff)
    {
        string judgmentStr = "";

        if (diff <= note.perfectplusWindow) judgmentStr = "Perfect+";
        else if (diff <= note.perfectWindow) judgmentStr = "Perfect";
        else if (diff <= note.greatWindow) judgmentStr = "Great";
        else if (diff <= note.goodWindow) judgmentStr = "Good";
        else if (diff <= note.badWindow) judgmentStr = "Bad";
        else judgmentStr = "Miss";

        // ★ 判定テキストの表示・色変更・非表示タイマーの処理
        if (judgmentTextUI != null)
        {
            judgmentTextUI.text = judgmentStr;
            judgmentTextUI.color = GetJudgmentColor(judgmentStr); // 色を設定
            judgmentTextUI.gameObject.SetActive(true);            // 表示する

            // すでに動いている非表示タイマーがあればリセットする（連続で叩いたとき用）
            if (hideJudgmentCoroutine != null)
            {
                StopCoroutine(hideJudgmentCoroutine);
            }
            // 0.5秒後にテキストを非表示にする
            hideJudgmentCoroutine = StartCoroutine(HideJudgmentTextAfterDelay(0.5f));
        }

        // ScoreManagerに判定結果を渡す
        if (ScoreManager.Instance != null)
        {
            ScoreManager.Instance.AddJudgment(judgmentStr);
        }

        activeNotes.Remove(note);
        note.Release();
    }

    // 判定ごとに色を返すメソッド
    private Color GetJudgmentColor(string judgment)
    {
        switch (judgment)
        {
            case "Perfect+": return pPlusColor;
            case "Perfect": return perfectColor;
            case "Great": return greatColor;
            case "Good": return goodColor;
            case "Bad": return badColor;
            case "Miss": return missColor;
            default: return Color.white;
        }
    }

    // 一定時間後にテキストオブジェクトを非表示にするコルーチン
    private IEnumerator HideJudgmentTextAfterDelay(float delay)
    {
        yield return new WaitForSeconds(delay);

        if (judgmentTextUI != null)
        {
            judgmentTextUI.gameObject.SetActive(false); // 非表示にする
        }
    }
}