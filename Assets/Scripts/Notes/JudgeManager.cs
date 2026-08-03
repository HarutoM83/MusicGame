using UnityEngine;
using System.Collections.Generic;

[DefaultExecutionOrder(-100)]
public class JudgeManager : MonoBehaviour
{
    public static JudgeManager Instance;

    public AudioSource music;
    public List<Notes> activeNotes = new List<Notes>();

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

    public void Judge(int lane)
    {
        Debug.Log("activeNotesêî:" + activeNotes.Count);
        Debug.Log("JudgeåƒÇ—èoÇµ lane:" + lane);
        if (music == null)
        {
            Debug.LogError("AudioSourceÇ™ê›íËÇ≥ÇÍÇƒÇ¢Ç‹ÇπÇÒ");
            return;
        }

        float songTime = music.time;

        Notes target = null;
        float bestDiff = float.MaxValue;

        // îªíËëŒè€ÇíTÇ∑
        for (int i = activeNotes.Count - 1; i >= 0; i--)
        {
            Notes note = activeNotes[i];

            // nullëŒçÙ
            if (note == null)
            {
                activeNotes.RemoveAt(i);
                continue;
            }

            // à·Ç§ÉåÅ[ÉìÇÕñ≥éã
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


        // ëŒè€Ç»Çµ
        if (target == null)
        {
            return;
        }


        JudgeResult(target, bestDiff);
    }

    void JudgeResult(Notes note, float diff)
    {
        Debug.Log("JudgeResultìûíB diff:" + diff);

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
