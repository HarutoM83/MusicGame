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
        if (Instance != null)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
    }

    public void Judge(int lane)
    {
        float songTime = music.time;

        Notes target = null;
        float bestDiff = 999f;

        // ‡@ “¯‚¶ƒŒ[ƒ“‚Ìƒm[ƒc‚ğ’T‚·
        foreach (var note in activeNotes)
        {
            if (note.Lane != lane)
                continue;

            float diff = Mathf.Abs(songTime - note.hitTime);

            if (diff < bestDiff)
            {
                bestDiff = diff;
                target = note;
            }
        }

        if (target == null)
            return;

        if (bestDiff <= target.perfectWindow)
        {
            Debug.Log("Perfect");
        }
        else if (bestDiff <= target.greatWindow)
        {
            Debug.Log("Great");
        }
        else if (bestDiff <= 0.12f)
        {
            Debug.Log("Good");
        }
        else
        {
            Debug.Log("Miss");
        }
        activeNotes.Remove(target);
        target.pool.ReleaseObject(target.gameObject);
    }
}
