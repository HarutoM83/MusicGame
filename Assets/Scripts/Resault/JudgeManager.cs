using UnityEngine;
using System.Collections.Generic;

[DefaultExecutionOrder(-100)]
public class JudgeManager : MonoBehaviour
{
    public static JudgeManager Instance;

    public AudioSource music;
    public List<Notes> activeNotes = new List<Notes>();

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
            if (note.Lane != lane)
                continue;

            // まだ判定範囲に入っていない場合は無視
            if (songTime < note.hitTime - note.badWindow)
                continue;

            float diff = Mathf.Abs(songTime - note.hitTime);

            // 最初に範囲内に入った（＝一番時間が古い）ノーツを優先、もしくは最もタイミングが近いものを選択
            if (diff < bestDiff)
            {
                bestDiff = diff;
                target = note;
            }
        }

        // 対象なし
        if (target == null)
        {
            return;
        }

        JudgeResult(target, bestDiff);
    }

    void JudgeResult(Notes note, float diff)
    {
        if (diff <= note.perfectplusWindow)
        {
            Debug.Log("Perfect plus");
        }
        else if (diff <= note.perfectWindow)
        {
            Debug.Log("Perfect");
        }
        else if (diff <= note.greatWindow)
        {
            Debug.Log("Great");
        }
        else if (diff <= note.goodWindow)
        {
            Debug.Log("Good");
        }
        else if (diff <= note.badWindow)
        {
            Debug.Log("Bad");
        }
        else
        {
            Debug.Log("Miss");
        }

        activeNotes.Remove(note);
        note.Release();
    }
}