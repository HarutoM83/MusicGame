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
        if (!music.isPlaying)
            return;
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

    // 押されたとき・離されたときに呼び出す用のメソッド（必要に応じてInput処理から呼ぶ）
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
        Debug.Log("activeNotes数:" + activeNotes.Count);
        Debug.Log("Judge呼び出し lane:" + lane);
        if (music == null)
        {
            Debug.LogError("AudioSourceが設定されていません");
            return;
        }

        float songTime = music.time;

        Notes target = null;
        float bestDiff = float.MaxValue;

        // 判定対象を探す
        for (int i = activeNotes.Count - 1; i >= 0; i--)
        {
            Notes note = activeNotes[i];

            // null対策
            if (note == null)
            {
                activeNotes.RemoveAt(i);
                continue;
            }

            // 違うレーンは無視
            if (note.Lane != lane)
                continue;

            if (songTime < note.hitTime - note.badWindow)
                continue;

            float diff =
                Mathf.Abs(songTime - note.hitTime);


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
        Debug.Log("JudgeResult到達 diff:" + diff);

        bool isLate = music.time > note.hitTime;

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
