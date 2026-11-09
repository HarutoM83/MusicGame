using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;

[DefaultExecutionOrder(-100)]
public class JudgeManager : MonoBehaviour
{
    public static JudgeManager Instance;

    public AudioSource music;
    public List<Notes> activeNotes = new List<Notes>();

    [SerializeField] private TextMeshProUGUI judgmentTextUI;

    [Header("判定ごとの色設定")]
    [SerializeField] private Color pPlusColor = new Color(0.0f, 0.8f, 1.0f);
    [SerializeField] private Color perfectColor = Color.yellow;
    [SerializeField] private Color greatColor = new Color(1.0f, 0.4f, 0.7f);
    [SerializeField] private Color goodColor = Color.yellowGreen;
    [SerializeField] private Color badColor = Color.blue;
    [SerializeField] private Color missColor = Color.gray;

    private Coroutine hideJudgmentCoroutine;
    private bool[] isLanePressed = new bool[4];

    void Awake()
    {
        if (Instance != null)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    void Update()
    {
        if (music == null || !music.isPlaying) return;

        float songTime = music.time;

        // 後ろから前へループして安全にチェック
        for (int i = activeNotes.Count - 1; i >= 0; i--)
        {
            if (i >= activeNotes.Count) continue;

            Notes note = activeNotes[i];

            if (note == null)
            {
                activeNotes.RemoveAt(i);
                continue;
            }

            // 時間切れ（Miss）判定
            if (songTime > note.hitTime + note.badWindow)
            {
                HandleMissNote(note);
                RemoveAndReleaseNote(note); // 共通メソッドで安全に削除・解放
            }
        }
    }

    // ノーツをリストから安全に削除し、プールに返す共通メソッド
    private void RemoveAndReleaseNote(Notes note)
    {
        if (note == null) return;

        if (activeNotes.Contains(note))
        {
            activeNotes.Remove(note);
        }
        note.Release();
    }

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

        // 正順で最も古いターゲットを探す
        for (int i = 0; i < activeNotes.Count; i++)
        {
            Notes note = activeNotes[i];

            if (note == null)
            {
                activeNotes.RemoveAt(i);
                i--;
                continue;
            }

            if (note.Lane != lane) continue;
            if (songTime < note.hitTime - note.badWindow) continue;

            float diff = Mathf.Abs(songTime - note.hitTime);

            if (diff < bestDiff)
            {
                bestDiff = diff;
                target = note;
            }
        }

        if (target == null) return;

        JudgeResult(target, bestDiff);
    }

    void HandleMissNote(Notes note)
    {
        string judgmentStr = "Miss";

        ShowJudgmentUI(judgmentStr);

        if (ScoreManager.Instance != null)
        {
            ScoreManager.Instance.AddJudgment(judgmentStr);
        }
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

        ShowJudgmentUI(judgmentStr);

        if (ScoreManager.Instance != null)
        {
            ScoreManager.Instance.AddJudgment(judgmentStr);
        }

        // 共通メソッドで安全に削除・解放
        RemoveAndReleaseNote(note);
    }

    // 判定UIの共通表示処理
    private void ShowJudgmentUI(string judgmentStr)
    {
        if (judgmentTextUI != null)
        {
            judgmentTextUI.text = judgmentStr;
            judgmentTextUI.color = GetJudgmentColor(judgmentStr);
            judgmentTextUI.gameObject.SetActive(true);

            if (hideJudgmentCoroutine != null)
            {
                StopCoroutine(hideJudgmentCoroutine);
            }
            hideJudgmentCoroutine = StartCoroutine(HideJudgmentTextAfterDelay(0.5f));
        }
    }

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

    private IEnumerator HideJudgmentTextAfterDelay(float delay)
    {
        yield return new WaitForSeconds(delay);

        if (judgmentTextUI != null)
        {
            judgmentTextUI.gameObject.SetActive(false);
        }
    }
}